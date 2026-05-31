import { describe, it, expect } from 'vitest';
import {
  detectAllergenCategories,
  getBlockedIngredients,
  containsBlockedIngredient,
  ALLERGEN_DERIVATIVES,
} from '../allergenUtils';

describe('detectAllergenCategories', () => {
  it('detects a single allergen category', () => {
    expect(detectAllergenCategories(['shellfish allergy'])).toContain('shellfish');
  });

  it('detects multiple allergen categories', () => {
    const result = detectAllergenCategories(['gluten intolerance', 'dairy free', 'nut allergy']);
    expect(result).toContain('gluten');
    expect(result).toContain('dairy');
    expect(result).toContain('nut');
  });

  it('is case-insensitive', () => {
    expect(detectAllergenCategories(['Shellfish', 'DAIRY', 'Gluten-Free'])).toEqual(
      expect.arrayContaining(['shellfish', 'dairy', 'gluten'])
    );
  });

  it('returns empty array when no known allergens are present', () => {
    expect(detectAllergenCategories(['no restrictions', 'loves spicy food'])).toEqual([]);
  });

  it('returns empty array for empty restrictions', () => {
    expect(detectAllergenCategories([])).toEqual([]);
  });
});

describe('getBlockedIngredients', () => {
  it('returns shellfish derivatives for shellfish restriction', () => {
    const blocked = getBlockedIngredients(['shellfish allergy']);
    expect(blocked).toContain('shrimp');
    expect(blocked).toContain('crab');
    expect(blocked).toContain('lobster');
    expect(blocked).toContain('oysters');
  });

  it('returns dairy derivatives for dairy restriction', () => {
    const blocked = getBlockedIngredients(['dairy free']);
    expect(blocked).toContain('milk');
    expect(blocked).toContain('cheese');
    expect(blocked).toContain('butter');
  });

  it('returns gluten derivatives for gluten restriction', () => {
    const blocked = getBlockedIngredients(['gluten intolerance']);
    expect(blocked).toContain('wheat');
    expect(blocked).toContain('barley');
    expect(blocked).toContain('rye');
  });

  it('returns union of derivatives for multiple restrictions', () => {
    const blocked = getBlockedIngredients(['soy allergy', 'egg allergy']);
    expect(blocked).toContain('tofu');
    expect(blocked).toContain('miso');
    expect(blocked).toContain('eggs');
  });

  it('returns empty array for no restrictions', () => {
    expect(getBlockedIngredients([])).toEqual([]);
  });

  it('deduplicates overlapping derivatives', () => {
    // "soy sauce" appears in both gluten and soy derivative lists
    const blocked = getBlockedIngredients(['gluten intolerance', 'soy allergy']);
    const soySauceCount = blocked.filter(b => b === 'soy sauce').length;
    expect(soySauceCount).toBe(1);
  });
});

describe('containsBlockedIngredient', () => {
  it('returns true when a blocked ingredient is present', () => {
    const ingredients = ['pasta', 'shrimp', 'olive oil'];
    expect(containsBlockedIngredient(ingredients, ['shellfish allergy'])).toBe(true);
  });

  it('returns false when no blocked ingredients are present', () => {
    const ingredients = ['pasta', 'tomato sauce', 'basil'];
    expect(containsBlockedIngredient(ingredients, ['shellfish allergy'])).toBe(false);
  });

  it('performs substring matching (catches "peanut butter")', () => {
    const ingredients = ['flour', 'peanut butter', 'sugar'];
    expect(containsBlockedIngredient(ingredients, ['nut allergy'])).toBe(true);
  });

  it('is case-insensitive for ingredient names', () => {
    const ingredients = ['Milk', 'Sugar', 'Flour'];
    expect(containsBlockedIngredient(ingredients, ['dairy free'])).toBe(true);
  });

  it('returns false for empty ingredient list', () => {
    expect(containsBlockedIngredient([], ['shellfish allergy'])).toBe(false);
  });

  it('returns false for empty restrictions', () => {
    const ingredients = ['shrimp', 'crab'];
    expect(containsBlockedIngredient(ingredients, [])).toBe(false);
  });
});

describe('ALLERGEN_DERIVATIVES completeness', () => {
  it('covers all 8 major food allergens (Big 9 minus sesame)', () => {
    // Shellfish, gluten (wheat), dairy (milk), tree nuts, peanuts (under nut), soy, eggs, fish
    const keys = Object.keys(ALLERGEN_DERIVATIVES);
    expect(keys).toContain('shellfish');
    expect(keys).toContain('gluten');
    expect(keys).toContain('dairy');
    expect(keys).toContain('nut');
    expect(keys).toContain('soy');
    expect(keys).toContain('egg');
    expect(keys).toContain('fish');
  });

  it('every category has at least one derivative', () => {
    for (const [key, derivatives] of Object.entries(ALLERGEN_DERIVATIVES)) {
      expect(derivatives.length, `${key} should have derivatives`).toBeGreaterThan(0);
    }
  });
});
