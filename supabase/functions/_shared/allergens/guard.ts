import { checkRecipe, CheckResult, Diner, RecipeInput } from './check.ts';

/** Minimal shape of the ai-chat structured response (kept structural so this stays pure TS). */
export interface GuardableResponse {
  reply: string;
  // deno-lint-ignore no-explicit-any
  suggestions: any[];
}

export interface GuardOutcome<R extends GuardableResponse> {
  response: R;
  /** True if one regeneration attempt was made. */
  regenerated: boolean;
  /** Suggestions that are still blocked in the response being returned. */
  blockedCount: number;
}

// deno-lint-ignore no-explicit-any
export function suggestionToRecipe(s: any): RecipeInput {
  const fromDetails = s?.full_details?.ingredients;
  const ingredients = Array.isArray(fromDetails) ? fromDetails : Array.isArray(s?.ingredients) ? s.ingredients : [];
  return { title: s?.title, description: s?.description, ingredients };
}

/** Attach `allergen_check` + `allergen_blocked` to every suggestion. Does not mutate the input. */
export function annotateSuggestions<R extends GuardableResponse>(
  response: R,
  diners: Diner[],
): { response: R; results: CheckResult[] } {
  const results = response.suggestions.map(s => checkRecipe(suggestionToRecipe(s), diners));
  const suggestions = response.suggestions.map((s, i) => ({
    ...s,
    allergen_blocked: results[i].status === 'blocked',
    allergen_check: {
      status: results[i].status,
      checkedAgainst: results[i].checkedAgainst,
      unverified: results[i].unverified,
      findings: results[i].findings.map(f => ({
        restriction: f.restriction,
        ingredient: f.ingredient,
        severity: f.severity,
        reason: f.reason,
      })),
    },
  }));
  return { response: { ...response, suggestions }, results };
}

/** Instruction appended for the single regeneration attempt. Names the violation explicitly. */
export function buildCorrectionNote(
  blocked: Array<{ title: string; findings: Array<{ restriction: string; ingredient: string }> }>,
): string {
  const lines = blocked.map(b => {
    const why = b.findings.map(f => `"${f.ingredient}" (conflicts with the ${f.restriction} restriction)`).join('; ');
    return `- "${b.title}": ${why}`;
  });
  return [
    'SAFETY CORRECTION: an automated allergen check found these suggestions contain ingredients the user must avoid:',
    ...lines,
    'Return the SAME JSON format again. Replace every flagged recipe with a different recipe that is free of those ingredients',
    'and of their derivatives, and keep the recipes that were not flagged. Do not mention this correction in "reply".',
  ].join('\n');
}

/**
 * Run the deterministic check on a parsed response. If any suggestion is blocked, call
 * `regenerate` AT MOST ONCE with a correction note; whatever comes back is annotated and
 * returned (still-blocked suggestions keep `allergen_blocked: true` so the UI can warn).
 */
export async function guardResponse<R extends GuardableResponse>(
  response: R,
  restrictions: string[],
  regenerate: (correctionNote: string) => Promise<R | null>,
): Promise<GuardOutcome<R>> {
  const cleaned = (restrictions ?? []).filter(r => String(r ?? '').trim().length > 0);
  if (cleaned.length === 0 || !Array.isArray(response.suggestions) || response.suggestions.length === 0) {
    return { response, regenerated: false, blockedCount: 0 };
  }
  const diners: Diner[] = [{ id: 'me', name: 'Me', restrictions: cleaned }];

  const first = annotateSuggestions(response, diners);
  const blocked = first.results
    .map((r, i) => ({ r, s: response.suggestions[i] }))
    .filter(x => x.r.status === 'blocked')
    .map(x => ({
      title: String(x.s?.title ?? 'Untitled'),
      findings: x.r.findings.filter(f => f.severity === 'definite'),
    }));
  if (blocked.length === 0) return { response: first.response, regenerated: false, blockedCount: 0 };

  let retry: R | null = null;
  try {
    retry = await regenerate(buildCorrectionNote(blocked));
  } catch (e) {
    console.error('Allergen regeneration failed; returning original with blocked flags:', e);
  }
  if (!retry || !Array.isArray(retry.suggestions) || retry.suggestions.length === 0) {
    return { response: first.response, regenerated: true, blockedCount: blocked.length };
  }
  const second = annotateSuggestions(retry, diners);
  return {
    response: second.response,
    regenerated: true,
    blockedCount: second.results.filter(r => r.status === 'blocked').length,
  };
}
