export type ScaledIngredient = {
  name: string;
  quantity: string;
  unit: string;
  originalQuantity: string;
  isScaled: boolean;
};

// Helper to find greatest common divisor
const gcd = (a: number, b: number): number => {
  return b ? gcd(b, a % b) : a;
};

// Convert decimal to fraction string
const toFraction = (amount: number): string => {
  if (amount === 0) return "0";
  
  // Handle whole numbers
  if (Math.abs(amount - Math.round(amount)) < 0.01) {
    return Math.round(amount).toString();
  }
  
  const whole = Math.floor(amount);
  const remainder = amount - whole;
  
  // Common baking fractions approximation
  const tolerance = 1.0E-2; 
  let h1 = 1; let h2 = 0;
  let k1 = 0; let k2 = 1;
  let b = remainder;
  
  do {
      let a = Math.floor(b);
      let aux = h1; h1 = a * h1 + h2; h2 = aux;
      aux = k1; k1 = a * k1 + k2; k2 = aux;
      b = 1 / (b - a);
  } while (Math.abs(remainder - h1 / k1) > remainder * tolerance);
  
  // If denominator is too large, stick to decimal
  // Increased denominator limit slightly for things like 1/3 (den 3) or 3/8 (den 8)
  // but keep it constrained to avoid weird fractions like 17/43
  if (k1 > 16) return amount.toFixed(1).replace(/\.0$/, '');

  if (whole > 0) {
      return `${whole} ${h1}/${k1}`;
  }
  return `${h1}/${k1}`;
};

export const parseQuantity = (quantity: string): number => {
  if (!quantity) return 0;
  
  // Handle ranges like "1-2" -> take average 1.5
  if (quantity.includes('-')) {
    const parts = quantity.split('-').map(parseQuantity);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return (parts[0] + parts[1]) / 2;
    }
  }

  // Handle fractions like "1/2" or "1 1/2"
  if (quantity.includes('/')) {
    const parts = quantity.split(' ');
    let total = 0;
    
    for (const part of parts) {
      if (part.includes('/')) {
        const [num, den] = part.split('/').map(Number);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          total += num / den;
        }
      } else if (!isNaN(Number(part))) {
        total += Number(part);
      }
    }
    return total;
  }

  const parsed = parseFloat(quantity);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatQuantity = (amount: number): string => {
  // Don't pre-round too aggressively, it breaks 1/3 (0.333...)
  return toFraction(amount);
};

// Initial simple unit conversion map
const UNIT_CONVERSIONS: Record<string, { threshold: number, to: string, factor: number }> = {
  'tbsp': { threshold: 4, to: 'cup', factor: 0.0625 }, // 16 tbsp = 1 cup
  'tablespoon': { threshold: 4, to: 'cup', factor: 0.0625 },
  'tablespoons': { threshold: 4, to: 'cup', factor: 0.0625 },
  'tsp': { threshold: 3, to: 'tbsp', factor: 0.333333 }, // 3 tsp = 1 tbsp
  'teaspoon': { threshold: 3, to: 'tbsp', factor: 0.333333 },
  'teaspoons': { threshold: 3, to: 'tbsp', factor: 0.333333 },
  'Oz': { threshold: 16, to: 'lb', factor: 0.0625 },
  'oz': { threshold: 16, to: 'lb', factor: 0.0625 },
  'ounce': { threshold: 16, to: 'lb', factor: 0.0625 },
  'ounces': { threshold: 16, to: 'lb', factor: 0.0625 },
};

export const scaleIngredient = (
  name: string,
  quantity: string,
  unit: string,
  originalServings: number,
  newServings: number
): ScaledIngredient => {
  if (originalServings === newServings) {
    return { name, quantity, unit, originalQuantity: quantity, isScaled: false };
  }

  const numericQuantity = parseQuantity(quantity);
  const ratio = newServings / originalServings;
  let scaledAmount = numericQuantity * ratio;
  let scaledUnit = unit;

  // Auto-conversion logic
  // Normalize unit to lower case for lookup (simple implementation)
  const normalizedUnit = unit.toLowerCase().trim();
  const conversion = UNIT_CONVERSIONS[normalizedUnit];

  if (conversion && scaledAmount > conversion.threshold) {
     const convertedAmount = scaledAmount * conversion.factor;
     // Only convert if it results in a reasonable number (e.g. > 0.25)
     if (convertedAmount >= 0.25) {
       scaledAmount = convertedAmount;
       scaledUnit = conversion.to;
       
       // Handle pluralization: only add 's' if not an abbreviation and > 1
       const isAbbreviation = ['tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l'].includes(scaledUnit.toLowerCase());
       if (!isAbbreviation && scaledAmount > 1 && !scaledUnit.endsWith('s')) {
         scaledUnit += 's';
       }
     }
  }

  return {
    name,
    quantity: formatQuantity(scaledAmount),
    unit: scaledUnit,
    originalQuantity: quantity,
    isScaled: true
  };
};
