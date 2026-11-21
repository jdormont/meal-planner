import { ALLERGENS, TaxonomyKey } from './data.ts';
import { resolveRestriction } from './restrictions.ts';
import { covers, findSpans, Span, tokenize } from './text.ts';

export type Severity = 'definite' | 'possible';
export type CheckStatus = 'safe' | 'warning' | 'blocked';

export interface Diner {
  id: string;
  name: string;
  /** Raw stored restriction labels (onboarding ids and/or free text). */
  restrictions: string[];
}

export interface RecipeIngredientInput {
  name?: string;
  quantity?: number | string | null;
  unit?: string | null;
}

export interface RecipeInput {
  title?: string | null;
  description?: string | null;
  notes?: string | null;
  ingredients?: Array<RecipeIngredientInput | string> | null;
}

export interface Finding {
  dinerId: string;
  /** The diner's original restriction label. */
  restriction: string;
  /** Original ingredient text (or "title"/"description"/"notes"). */
  ingredient: string;
  matchedTerm: string;
  severity: Severity;
  reason: string;
}

export interface DinerResult {
  dinerId: string;
  name: string;
  status: CheckStatus;
  findings: Finding[];
  checkedAgainst: string[];
  unverified: string[];
}

export interface CheckResult {
  status: CheckStatus;
  perDiner: DinerResult[];
  findings: Finding[];
  /** Display labels of restrictions that were auto-checked (all diners). */
  checkedAgainst: string[];
  /** Free-text restrictions that could not be mapped: shown as "not auto-checked". */
  unverified: string[];
  /** True when the ingredient list was empty/unparseable, so nothing could be checked. */
  ingredientsUnreadable: boolean;
}

interface PreparedEntry {
  key: TaxonomyKey;
  definite: Array<{ term: string; tokens: string[] }>;
  possible: Array<{ term: string; tokens: string[] }>;
  overrides: string[][];
  freeWords: Set<string>;
}

const prepared = new Map<TaxonomyKey, PreparedEntry>();

function prepare(key: TaxonomyKey): PreparedEntry {
  let p = prepared.get(key);
  if (p) return p;
  const e = ALLERGENS[key];
  const prep = (terms: string[]) => terms.map(term => ({ term, tokens: tokenize(term) })).filter(t => t.tokens.length > 0);
  p = {
    key,
    definite: prep(e.definite),
    possible: prep(e.possible),
    overrides: e.safeOverrides.map(o => tokenize(o)).filter(t => t.length > 0),
    freeWords: new Set(e.freeWords.flatMap(w => tokenize(w))),
  };
  prepared.set(key, p);
  return p;
}

interface TextMatch { term: string; severity: Severity; claimedFree: boolean }

/** Best (highest-severity) match of one allergen in one piece of text, or null. */
function matchText(text: string, key: TaxonomyKey): TextMatch | null {
  const tokens = tokenize(text);
  if (tokens.length === 0) return null;
  const p = prepare(key);

  const overrideSpans: Span[] = p.overrides.flatMap(o => findSpans(tokens, o));
  // "pork-free", "dairy free": a free-claim sitting right before the word "free".
  const claimed = tokens.some((t, i) => t === 'free' && i > 0 && p.freeWords.has(tokens[i - 1]));

  let best: TextMatch | null = null;
  const consider = (list: PreparedEntry['definite'], severity: Severity) => {
    for (const { term, tokens: phrase } of list) {
      for (const span of findSpans(tokens, phrase)) {
        if (overrideSpans.some(o => covers(o, span))) continue;
        // The matched words are themselves the free-claim ("pork" in "pork free"): not a hit.
        if (tokens[span.end] === 'free' && span.end === span.start + phrase.length) {
          const last = tokens[span.end - 1];
          if (p.freeWords.has(last)) continue;
        }
        let sev: Severity = severity;
        if (claimed) {
          if (severity === 'possible') continue; // labelled free: ignore ambiguous sources
          sev = 'possible'; // definite term but labelled free: verify rather than block
        }
        if (!best || (sev === 'definite' && best.severity !== 'definite')) {
          best = { term, severity: sev, claimedFree: claimed };
        }
      }
    }
  };
  consider(p.definite, 'definite');
  consider(p.possible, 'possible');
  return best;
}

function ingredientText(i: RecipeIngredientInput | string): string {
  if (typeof i === 'string') return i;
  return String(i?.name ?? '');
}

const worst = (a: CheckStatus, b: CheckStatus): CheckStatus =>
  a === 'blocked' || b === 'blocked' ? 'blocked' : a === 'warning' || b === 'warning' ? 'warning' : 'safe';

export function checkRecipe(recipe: RecipeInput, diners: Diner[]): CheckResult {
  const rawList = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  const ingredients = rawList.map(ingredientText).filter(t => t.trim().length > 0);
  const ingredientsUnreadable = ingredients.length === 0 || ingredients.every(t => tokenize(t).length === 0);

  const sideTexts: Array<{ where: string; text: string }> = [
    { where: 'title', text: recipe?.title ?? '' },
    { where: 'description', text: recipe?.description ?? '' },
    { where: 'notes', text: recipe?.notes ?? '' },
  ].filter(s => s.text.trim().length > 0);

  const perDiner: DinerResult[] = [];
  const allFindings: Finding[] = [];
  const checkedAll = new Set<string>();
  const unverifiedAll = new Set<string>();

  for (const diner of diners) {
    const findings: Finding[] = [];
    const checked = new Set<string>();
    const unverified: string[] = [];

    for (const label of diner.restrictions ?? []) {
      const keys = resolveRestriction(label);
      if (keys.length === 0) {
        if (String(label ?? '').trim()) unverified.push(label);
        continue;
      }
      for (const key of keys) {
        checked.add(ALLERGENS[key].label);
        const keyLabel = ALLERGENS[key].label;

        for (const ing of ingredients) {
          const m = matchText(ing, key);
          if (!m) continue;
          const reason = m.claimedFree
            ? `"${ing}" is labelled ${keyLabel}-free but matches "${m.term}": check the label`
            : m.severity === 'definite'
              ? `"${ing}" contains ${m.term}, a source of ${keyLabel}`
              : `"${ing}" may contain hidden ${keyLabel} (${m.term})`;
          findings.push({ dinerId: diner.id, restriction: label, ingredient: ing, matchedTerm: m.term, severity: m.severity, reason });
        }

        // Title/description/notes: only definite terms, reported at warning (possible) level.
        const alreadyFlagged = findings.some(f => f.restriction === label && f.severity === 'definite');
        if (!alreadyFlagged) {
          for (const { where, text } of sideTexts) {
            const m = matchText(text, key);
            if (m && m.severity === 'definite') {
              findings.push({
                dinerId: diner.id, restriction: label, ingredient: where, matchedTerm: m.term, severity: 'possible',
                reason: `"${m.term}" appears in the recipe ${where}, but not clearly in the ingredient list`,
              });
              break;
            }
          }
        }
      }
    }

    let status: CheckStatus = 'safe';
    if (findings.some(f => f.severity === 'definite')) status = 'blocked';
    else if (findings.length > 0) status = 'warning';
    // Nothing could be read from the ingredient list: never claim "safe" for someone with checks to run.
    if (ingredientsUnreadable && checked.size > 0 && status === 'safe') status = 'warning';

    const checkedAgainst = Array.from(checked);
    checkedAgainst.forEach(c => checkedAll.add(c));
    unverified.forEach(u => unverifiedAll.add(u));
    allFindings.push(...findings);
    perDiner.push({ dinerId: diner.id, name: diner.name, status, findings, checkedAgainst, unverified });
  }

  return {
    status: perDiner.reduce<CheckStatus>((acc, d) => worst(acc, d.status), 'safe'),
    perDiner,
    findings: allFindings,
    checkedAgainst: Array.from(checkedAll),
    unverified: Array.from(unverifiedAll),
    ingredientsUnreadable,
  };
}

/** Convenience for UI: does this set of diners have anything to check at all? */
export function hasAnyRestrictions(diners: Diner[]): boolean {
  return diners.some(d => (d.restrictions ?? []).some(r => String(r ?? '').trim().length > 0));
}
