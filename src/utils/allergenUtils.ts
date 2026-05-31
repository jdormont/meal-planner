/**
 * Allergen detection and derivative expansion utilities.
 *
 * These are extracted from the ai-chat edge function so they can be unit tested.
 * The edge function should import from here during the P4 refactor.
 */

export type AllergenKey = 'shellfish' | 'gluten' | 'dairy' | 'nut' | 'soy' | 'egg' | 'fish';

/** Known derivatives for each top-level allergen category. */
export const ALLERGEN_DERIVATIVES: Record<AllergenKey, string[]> = {
  shellfish: ['shrimp', 'crab', 'lobster', 'crayfish', 'prawns', 'scallops', 'clams', 'mussels', 'oysters', 'shellfish stock', 'shellfish paste'],
  gluten: ['wheat', 'barley', 'rye', 'soy sauce', 'malt vinegar'],
  dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt'],
  nut: ['peanut', 'peanuts', 'almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'tahini', 'nut oil', 'nut butter'],
  soy: ['soybean', 'soybeans', 'tofu', 'soy sauce', 'edamame', 'miso', 'tempeh'],
  egg: ['egg', 'eggs'],
  fish: ['fish sauce', 'anchovies'],
};

/**
 * Returns which top-level allergen categories are present in a restrictions list.
 * Matching is case-insensitive and substring-based (e.g. "nut allergy" matches "nut").
 */
export function detectAllergenCategories(restrictions: string[]): AllergenKey[] {
  const keys = Object.keys(ALLERGEN_DERIVATIVES) as AllergenKey[];
  return keys.filter(key =>
    restrictions.some(r => r.toLowerCase().includes(key))
  );
}

/**
 * Returns all derivative ingredients to avoid given a list of restriction strings.
 */
export function getBlockedIngredients(restrictions: string[]): string[] {
  const categories = detectAllergenCategories(restrictions);
  const blocked = new Set<string>();
  for (const cat of categories) {
    for (const derivative of ALLERGEN_DERIVATIVES[cat]) {
      blocked.add(derivative.toLowerCase());
    }
  }
  return Array.from(blocked);
}

/**
 * Returns true if any ingredient name in a list is blocked by the given restrictions.
 */
export function containsBlockedIngredient(
  ingredientNames: string[],
  restrictions: string[]
): boolean {
  const blocked = getBlockedIngredients(restrictions);
  return ingredientNames.some(name =>
    blocked.some(b => name.toLowerCase().includes(b))
  );
}
