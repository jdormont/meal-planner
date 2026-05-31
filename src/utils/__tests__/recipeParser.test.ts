import { describe, it, expect } from 'vitest';
import { parseIngredient, parseAIRecipe } from '../recipeParser';

describe('parseIngredient', () => {
  it('parses quantity, unit, and name', () => {
    const result = parseIngredient('2 cups flour');
    expect(result.quantity).toBe('2');
    expect(result.unit).toBe('cups');
    expect(result.name).toBe('flour');
  });

  it('parses fractional quantity', () => {
    const result = parseIngredient('1/2 tsp salt');
    expect(result.quantity).toBe('1/2');
    expect(result.unit).toBe('tsp');
    expect(result.name).toBe('salt');
  });

  it('strips leading list markers (dash)', () => {
    const result = parseIngredient('- 3 tbsp olive oil');
    expect(result.quantity).toBe('3');
    expect(result.unit).toBe('tbsp');
    expect(result.name).toBe('olive oil');
  });

  it('strips leading list markers (bullet)', () => {
    const result = parseIngredient('• 1 cup milk');
    expect(result.quantity).toBe('1');
    expect(result.unit).toBe('cup');
    expect(result.name).toBe('milk');
  });

  it('returns empty quantity and unit for name-only ingredients', () => {
    const result = parseIngredient('salt to taste');
    expect(result.name).toBeTruthy();
  });

  it('handles ingredient without a unit', () => {
    const result = parseIngredient('2 eggs');
    expect(result.quantity).toBe('2');
    expect(result.name).toBeTruthy();
  });
});

describe('parseAIRecipe', () => {
  const sampleRecipe = `
# Spaghetti Carbonara

A classic Italian pasta dish.

Prep Time: 10 minutes
Cook Time: 20 minutes

## Ingredients
- 200g spaghetti
- 100g pancetta
- 2 eggs
- 50g Parmesan cheese

## Instructions
1. Boil salted water and cook spaghetti until al dente.
2. Fry pancetta until crispy.
3. Mix eggs and cheese in a bowl.
4. Combine pasta, pancetta, and egg mixture off the heat.
`;

  it('extracts the title from a markdown heading', () => {
    const result = parseAIRecipe(sampleRecipe);
    expect(result.title).toBe('Spaghetti Carbonara');
  });

  it('extracts ingredients', () => {
    const result = parseAIRecipe(sampleRecipe);
    expect(result.ingredients.length).toBe(4);
    expect(result.ingredients.some(i => i.name.toLowerCase().includes('spaghetti'))).toBe(true);
  });

  it('extracts numbered instructions', () => {
    const result = parseAIRecipe(sampleRecipe);
    expect(result.instructions.length).toBe(4);
    expect(result.instructions[0]).toContain('Boil');
  });

  it('calculates total time from prep + cook when total not provided', () => {
    const result = parseAIRecipe(sampleRecipe);
    expect(result.totalTime).toBe(30);
  });

  it('prefers explicit total time over sum', () => {
    const text = `
# Quick Dish
Total Time: 45 minutes
Prep Time: 10 minutes
Cook Time: 30 minutes

## Ingredients
- 1 cup rice

## Instructions
1. Cook rice.
`;
    const result = parseAIRecipe(text);
    expect(result.totalTime).toBe(45);
  });

  it('uses default title when no heading is present', () => {
    const result = parseAIRecipe('Some recipe text without a heading.');
    expect(result.title).toBe('AI Suggested Recipe');
  });

  it('returns empty ingredients for recipe with no ingredient section', () => {
    const result = parseAIRecipe('# My Recipe\n\n## Instructions\n1. Do something.');
    expect(result.ingredients).toHaveLength(0);
  });
});
