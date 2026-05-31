import { describe, it, expect } from 'vitest';
import { parseQuantity, formatQuantity, scaleIngredient } from '../recipeScaler';

describe('parseQuantity', () => {
  it('parses whole numbers', () => {
    expect(parseQuantity('2')).toBe(2);
    expect(parseQuantity('10')).toBe(10);
  });

  it('parses simple fractions', () => {
    expect(parseQuantity('1/2')).toBeCloseTo(0.5);
    expect(parseQuantity('1/4')).toBeCloseTo(0.25);
    expect(parseQuantity('2/3')).toBeCloseTo(0.667, 2);
  });

  it('parses mixed fractions', () => {
    expect(parseQuantity('1 1/2')).toBeCloseTo(1.5);
    expect(parseQuantity('2 1/4')).toBeCloseTo(2.25);
    expect(parseQuantity('3 2/3')).toBeCloseTo(3.667, 2);
  });

  it('parses decimal quantities', () => {
    expect(parseQuantity('0.5')).toBeCloseTo(0.5);
    expect(parseQuantity('1.75')).toBeCloseTo(1.75);
  });

  it('averages ranges', () => {
    expect(parseQuantity('1-2')).toBeCloseTo(1.5);
    expect(parseQuantity('2-4')).toBeCloseTo(3);
  });

  it('returns 0 for empty or non-numeric input', () => {
    expect(parseQuantity('')).toBe(0);
    expect(parseQuantity('a pinch')).toBe(0);
  });
});

describe('formatQuantity', () => {
  it('formats whole numbers cleanly', () => {
    expect(formatQuantity(1)).toBe('1');
    expect(formatQuantity(3)).toBe('3');
  });

  it('formats common fractions', () => {
    expect(formatQuantity(0.5)).toBe('1/2');
    expect(formatQuantity(0.25)).toBe('1/4');
    expect(formatQuantity(0.75)).toBe('3/4');
    expect(formatQuantity(1 / 3)).toBe('1/3');
  });

  it('formats mixed fractions', () => {
    expect(formatQuantity(1.5)).toBe('1 1/2');
    expect(formatQuantity(2.25)).toBe('2 1/4');
  });

  it('falls back to decimal for awkward fractions with large denominators', () => {
    // 1/17 ≈ 0.0588 — denominator > 16, should fall back to decimal
    const result = formatQuantity(1 / 17);
    expect(result).toMatch(/^\d+\.\d+$/);
  });
});

describe('scaleIngredient', () => {
  it('returns original values when servings unchanged', () => {
    const result = scaleIngredient('flour', '2', 'cups', 4, 4);
    expect(result.isScaled).toBe(false);
    expect(result.quantity).toBe('2');
    expect(result.unit).toBe('cups');
  });

  it('scales up correctly', () => {
    const result = scaleIngredient('sugar', '1', 'cup', 2, 4);
    expect(result.isScaled).toBe(true);
    expect(result.quantity).toBe('2');
    expect(result.unit).toBe('cup');
  });

  it('scales down correctly', () => {
    const result = scaleIngredient('oil', '2', 'cups', 4, 2);
    expect(result.isScaled).toBe(true);
    expect(result.quantity).toBe('1');
  });

  it('scales fractional quantities', () => {
    const result = scaleIngredient('salt', '1/2', 'tsp', 2, 4);
    expect(result.isScaled).toBe(true);
    expect(result.quantity).toBe('1');
  });

  it('converts tbsp to cups when threshold exceeded', () => {
    // 8 tbsp at 2x = 16 tbsp → should convert to 1 cup
    const result = scaleIngredient('butter', '8', 'tbsp', 1, 2);
    expect(result.unit).toBe('cup');
  });

  it('converts tsp to tbsp when threshold exceeded', () => {
    // 2 tsp at 2x = 4 tsp → should convert (> threshold of 3)
    const result = scaleIngredient('vanilla', '2', 'tsp', 1, 2);
    expect(result.unit).toBe('tbsp');
  });

  it('preserves originalQuantity', () => {
    const result = scaleIngredient('eggs', '2', '', 2, 6);
    expect(result.originalQuantity).toBe('2');
  });

  it('handles zero original quantity gracefully', () => {
    const result = scaleIngredient('seasoning', '0', 'tsp', 2, 4);
    expect(result.quantity).toBe('0');
  });
});
