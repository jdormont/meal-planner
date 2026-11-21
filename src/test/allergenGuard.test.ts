import { describe, it, expect, vi } from 'vitest';
import {
  annotateSuggestions,
  buildCorrectionNote,
  guardResponse,
  suggestionToRecipe,
} from '../../supabase/functions/_shared/allergens/index.ts';

type TestSuggestion = {
  title: string;
  description: string;
  full_details: { ingredients: string[]; instructions: string[] };
  allergen_blocked?: boolean;
};
const suggestion = (title: string, ingredients: string[]): TestSuggestion => ({
  title,
  description: '',
  full_details: { ingredients, instructions: [] },
});
const resp = (...suggestions: TestSuggestion[]) => ({ reply: 'Here you go', suggestions });

describe('suggestionToRecipe', () => {
  it('reads ingredients from full_details or a top-level list', () => {
    expect(suggestionToRecipe(suggestion('A', ['butter'])).ingredients).toEqual(['butter']);
    expect(suggestionToRecipe({ title: 'B', ingredients: ['milk'] }).ingredients).toEqual(['milk']);
    expect(suggestionToRecipe({ title: 'C' }).ingredients).toEqual([]);
  });
});

describe('annotateSuggestions', () => {
  it('flags blocked suggestions and does not mutate the input', () => {
    const input = resp(suggestion('Bacon Pasta', ['8 oz spaghetti', '4 slices bacon']), suggestion('Rice Bowl', ['rice']));
    const { response } = annotateSuggestions(input, [{ id: 'me', name: 'Me', restrictions: ['pork'] }]);
    expect(response.suggestions[0].allergen_blocked).toBe(true);
    expect(response.suggestions[1].allergen_blocked).toBe(false);
    expect(input.suggestions[0].allergen_blocked).toBeUndefined();
  });
});

describe('guardResponse', () => {
  it('does nothing and never calls the LLM when there are no restrictions', async () => {
    const regen = vi.fn();
    const out = await guardResponse(resp(suggestion('Bacon', ['bacon'])), [], regen);
    expect(out.regenerated).toBe(false);
    expect(regen).not.toHaveBeenCalled();
  });

  it('does not regenerate when everything is clear', async () => {
    const regen = vi.fn();
    const out = await guardResponse(resp(suggestion('Rice Bowl', ['rice', 'broccoli'])), ['pork'], regen);
    expect(out.regenerated).toBe(false);
    expect(out.blockedCount).toBe(0);
    expect(out.response.suggestions[0].allergen_blocked).toBe(false);
    expect(regen).not.toHaveBeenCalled();
  });

  it('regenerates exactly once and returns the clean replacement', async () => {
    const regen = vi.fn().mockResolvedValue(resp(suggestion('Chicken Pasta', ['spaghetti', 'chicken'])));
    const out = await guardResponse(resp(suggestion('Carbonara', ['spaghetti', 'guanciale'])), ['pork'], regen);
    expect(regen).toHaveBeenCalledTimes(1);
    expect(out.regenerated).toBe(true);
    expect(out.blockedCount).toBe(0);
    expect(out.response.suggestions[0].title).toBe('Chicken Pasta');
  });

  it('names the violation in the correction note', async () => {
    const regen = vi.fn().mockResolvedValue(resp(suggestion('OK', ['rice'])));
    await guardResponse(resp(suggestion('Carbonara', ['guanciale'])), ['pork'], regen);
    const note = regen.mock.calls[0][0] as string;
    expect(note).toContain('Carbonara');
    expect(note).toContain('guanciale');
    expect(note).toContain('pork');
  });

  it('does not loop: if the retry is still blocked it is returned flagged after one call', async () => {
    const regen = vi.fn().mockResolvedValue(resp(suggestion('Ham Sandwich', ['ham', 'bread'])));
    const out = await guardResponse(resp(suggestion('Carbonara', ['guanciale'])), ['pork'], regen);
    expect(regen).toHaveBeenCalledTimes(1);
    expect(out.blockedCount).toBe(1);
    expect(out.response.suggestions[0].allergen_blocked).toBe(true);
  });

  it('falls back to the original flagged response if regeneration throws or returns nothing', async () => {
    const original = resp(suggestion('Carbonara', ['guanciale']));
    const thrown = await guardResponse(original, ['pork'], vi.fn().mockRejectedValue(new Error('boom')));
    expect(thrown.response.suggestions[0].allergen_blocked).toBe(true);
    expect(thrown.blockedCount).toBe(1);
    const empty = await guardResponse(original, ['pork'], vi.fn().mockResolvedValue(null));
    expect(empty.response.suggestions[0].allergen_blocked).toBe(true);
  });

  it('passes through chat turns with no suggestions', async () => {
    const regen = vi.fn();
    const out = await guardResponse({ reply: 'Any allergies?', suggestions: [] }, ['pork'], regen);
    expect(out.regenerated).toBe(false);
    expect(regen).not.toHaveBeenCalled();
  });
});

describe('buildCorrectionNote', () => {
  it('lists each blocked recipe with its ingredient and restriction', () => {
    const note = buildCorrectionNote([{ title: 'X', findings: [{ restriction: 'dairy', ingredient: 'butter' }] }]);
    expect(note).toContain('"X"');
    expect(note).toContain('"butter"');
    expect(note).toContain('dairy');
  });
});
