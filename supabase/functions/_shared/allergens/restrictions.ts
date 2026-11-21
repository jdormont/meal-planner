import { RESTRICTION_SYNONYMS, TaxonomyKey, TAXONOMY_KEYS } from './data.ts';

/** Words that decorate a restriction label without changing what it refers to. */
const FILLER = new Set([
  'allergy', 'allergic', 'allergies', 'intolerance', 'intolerant', 'sensitivity', 'sensitive', 'free',
  'no', 'avoid', 'avoiding', 'without', 'to', 'a', 'an', 'the', 'and', 'i', 'am', 'have', 'severe', 'mild',
  'diet', 'restriction',
]);

/**
 * Resolve a stored restriction label (onboarding id like "tree_nuts" or free text like
 * "Gluten-free" / "Nut allergy") to zero or more taxonomy keys.
 * An empty array means "cannot be auto-checked" and MUST be surfaced as unverified.
 */
export function resolveRestriction(label: string): TaxonomyKey[] {
  const base = String(label ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').trim();
  if (!base) return [];
  const direct = RESTRICTION_SYNONYMS[base];
  if (direct) return [...direct];
  if ((TAXONOMY_KEYS as string[]).includes(base)) return [base as TaxonomyKey];

  const words = base.replace(/[^a-z0-9_]+/g, ' ').split(' ').filter(w => w && !FILLER.has(w));
  if (words.length === 0) return [];
  const phrase = words.join(' ');
  if (RESTRICTION_SYNONYMS[phrase]) return [...RESTRICTION_SYNONYMS[phrase]];

  // Every remaining word must be understood; otherwise the label is not safely mappable.
  const keys = new Set<TaxonomyKey>();
  for (let i = 0; i < words.length; i++) {
    const two = words[i] + ' ' + (words[i + 1] ?? '');
    if (words[i + 1] && RESTRICTION_SYNONYMS[two]) {
      RESTRICTION_SYNONYMS[two].forEach(k => keys.add(k));
      i++;
      continue;
    }
    const hit = RESTRICTION_SYNONYMS[words[i]];
    if (!hit) return [];
    hit.forEach(k => keys.add(k));
  }
  return Array.from(keys);
}

/** First taxonomy key for a label, or null if it cannot be mapped. */
export function normalizeRestriction(label: string): TaxonomyKey | null {
  return resolveRestriction(label)[0] ?? null;
}
