/**
 * Text normalisation + phrase matching for ingredient strings.
 * Pure TypeScript: no framework, DOM, or Deno-specific APIs.
 */

const IRREGULAR_SINGULAR: Record<string, string> = {
  anchovies: 'anchovy', molasses: 'molasses', hummus: 'hummus', couscous: 'couscous', asparagus: 'asparagus',
  swiss: 'swiss', bass: 'bass', grits: 'grits', citrus: 'citrus', lens: 'lens', hollandaise: 'hollandaise',
  mahi: 'mahi', tahini: 'tahini', mayo: 'mayo', ghee: 'ghee', roe: 'roe', caviar: 'caviar',
};

/** Units, quantities and prep words that never change what an ingredient IS. */
const DROP_WORDS = new Set([
  'tbsp', 'tbs', 'tablespoon', 'tsp', 'teaspoon', 'cup', 'oz', 'ounce', 'lb', 'pound', 'g', 'gram', 'kg',
  'kilogram', 'ml', 'l', 'liter', 'litre', 'pinch', 'dash', 'can', 'clove', 'package', 'pkg', 'pint',
  'quart', 'gallon', 'handful', 'bunch', 'slice', 'piece', 'large', 'small', 'medium', 'melted', 'chopped',
  'diced', 'minced', 'sliced', 'grated', 'shredded', 'fresh', 'softened', 'divided', 'optional', 'to', 'taste',
  'about', 'approximately', 'for', 'serving', 'garnish', 'cut', 'into', 'cubed', 'crushed', 'peeled',
  'room', 'temperature', 'cold', 'warm', 'finely', 'roughly', 'thinly', 'plus', 'more', 'or', 'a', 'an', 'the',
  'x',
]);

export function singularize(word: string): string {
  if (IRREGULAR_SINGULAR[word]) return IRREGULAR_SINGULAR[word];
  let w = word;
  if (w.length > 3) {
    if (w.endsWith('ies')) w = w.slice(0, -3) + 'y';
    else if (/(xes|ches|shes|oes)$/.test(w)) w = w.slice(0, -2);
    else if (w.endsWith('s') && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
  }
  // cookie/cookies -> cooky, brownie -> browny (keeps both sides symmetric)
  if (w.length > 4 && w.endsWith('ie')) w = w.slice(0, -2) + 'y';
  return w;
}

/** Lowercase, strip accents/apostrophes, split on non-alphanumerics, drop noise, singularise. */
export function tokenize(input: string, opts: { dropNoise?: boolean } = { dropNoise: true }): string[] {
  const cleaned = String(input ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!cleaned) return [];
  const out: string[] = [];
  for (const raw of cleaned.split(' ')) {
    if (!raw) continue;
    if (opts.dropNoise !== false) {
      if (/^\d+$/.test(raw) || DROP_WORDS.has(raw)) continue;
    }
    out.push(singularize(raw));
  }
  return out;
}

export interface Span { start: number; end: number } // end exclusive

export function findSpans(tokens: string[], phrase: string[]): Span[] {
  const spans: Span[] = [];
  if (phrase.length === 0) return spans;
  for (let i = 0; i + phrase.length <= tokens.length; i++) {
    let ok = true;
    for (let j = 0; j < phrase.length; j++) {
      if (tokens[i + j] !== phrase[j]) { ok = false; break; }
    }
    if (ok) spans.push({ start: i, end: i + phrase.length });
  }
  return spans;
}

export function covers(outer: Span, inner: Span): boolean {
  return outer.start <= inner.start && outer.end >= inner.end;
}
