import { describe, it, expect } from 'vitest';
import {
  checkRecipe,
  hasAnyRestrictions,
  normalizeRestriction,
  resolveRestriction,
  tokenize,
  type Diner,
  type TaxonomyKey,
} from '../../supabase/functions/_shared/allergens/index.ts';

type Expect = 'definite' | 'possible' | null;

/** Check a single ingredient string against a single restriction label. */
function sev(restriction: string, ingredient: string): Expect {
  const r = checkRecipe({ ingredients: [{ name: ingredient }] }, [{ id: 'me', name: 'Me', restrictions: [restriction] }]);
  if (r.findings.some(f => f.severity === 'definite')) return 'definite';
  if (r.findings.length > 0) return 'possible';
  return null;
}

// [restriction, ingredient, expected]
const CASES: Array<[TaxonomyKey, string, Expect]> = [
  // ---- milk -------------------------------------------------------------
  ['milk', '2 tbsp unsalted butter, melted', 'definite'],
  ['milk', '1 cup whole milk', 'definite'],
  ['milk', '1/2 cup heavy cream', 'definite'],
  ['milk', '200g grated Parmesan cheese', 'definite'],
  ['milk', '3 tablespoons ghee', 'definite'],
  ['milk', 'Greek yogurt', 'definite'],
  ['milk', '1 cup plain yoghurt', 'definite'],
  ['milk', '1 lb paneer, cubed', 'definite'],
  ['milk', '2 cups buttermilk', 'definite'],
  ['milk', 'sour cream', 'definite'],
  ['milk', '8 oz cream cheese', 'definite'],
  ['milk', 'whey protein', 'definite'],
  ['milk', 'sodium caseinate', 'definite'],
  ['milk', '1 tin sweetened condensed milk', 'definite'],
  ['milk', 'mozzarella balls', 'definite'],
  ['milk', 'Crème fraîche', 'definite'],
  ['milk', '1 cup coconut milk', null],
  ['milk', '1 can full-fat coconut cream', null],
  ['milk', '1 cup almond milk', null],
  ['milk', 'oat milk, unsweetened', null],
  ['milk', '1 cup soy milk', null],
  ['milk', 'cocoa butter', null],
  ['milk', '2 tbsp peanut butter', null],
  ['milk', 'almond butter', null],
  ['milk', '1 butternut squash, cubed', null],
  ['milk', 'cream of tartar', null],
  ['milk', 'dairy-free butter', null],
  ['milk', 'vegan cheese shreds', null],
  ['milk', 'butter lettuce leaves', null],
  ['milk', '1 cup butter beans', null],
  ['milk', '1 eggplant', null],
  ['milk', 'milk chocolate chips', 'definite'],
  ['milk', 'margarine', 'possible'],
  ['milk', 'basil pesto', 'possible'],
  ['milk', 'dark chocolate', 'possible'],
  ['milk', 'dairy-free chocolate chips', null],
  ['milk', 'natural flavors', 'possible'],
  ['milk', 'chicken breast', null],
  // ---- egg --------------------------------------------------------------
  ['egg', '2 large eggs', 'definite'],
  ['egg', '1 egg white', 'definite'],
  ['egg', '3 egg yolks', 'definite'],
  ['egg', '1/2 cup mayonnaise', 'definite'],
  ['egg', '2 tbsp mayo', 'definite'],
  ['egg', 'aioli', 'definite'],
  ['egg', 'meringue powder', 'definite'],
  ['egg', 'egg noodles', 'definite'],
  ['egg', 'hollandaise sauce', 'definite'],
  ['egg', 'brioche buns', 'possible'],
  ['egg', 'fresh pasta', 'possible'],
  ['egg', 'tartar sauce', 'possible'],
  ['egg', 'vegan mayo', null],
  ['egg', '1 eggplant, sliced', null],
  ['egg', 'a pinch of nutmeg', null],
  ['egg', 'egg replacer', null],
  ['egg', 'olive oil', null],
  ['egg', 'Eggs', 'definite'],
  // ---- fish -------------------------------------------------------------
  ['fish', '2 salmon fillets', 'definite'],
  ['fish', '1 can tuna, drained', 'definite'],
  ['fish', '1 tbsp fish sauce', 'definite'],
  ['fish', '4 anchovies', 'definite'],
  ['fish', '2 tsp anchovy paste', 'definite'],
  ['fish', 'cod fillet', 'definite'],
  ['fish', 'dashi stock', 'definite'],
  ['fish', 'bonito flakes', 'definite'],
  ['fish', 'sea bass', 'definite'],
  ['fish', 'tilapia', 'definite'],
  ['fish', '2 tsp Worcestershire sauce', 'possible'],
  ['fish', 'Caesar dressing', 'possible'],
  ['fish', 'vegan fish sauce', null],
  ['fish', 'shrimp', null],
  ['fish', 'chicken thighs', null],
  ['fish', '1 tsp kosher salt', null],
  // ---- shellfish --------------------------------------------------------
  ['shellfish', '1 lb large shrimp, peeled', 'definite'],
  ['shellfish', '8 oz lump crab meat', 'definite'],
  ['shellfish', '2 lobster tails', 'definite'],
  ['shellfish', '12 mussels', 'definite'],
  ['shellfish', 'scallops', 'definite'],
  ['shellfish', '1 tbsp oyster sauce', 'definite'],
  ['shellfish', 'calamari rings', 'definite'],
  ['shellfish', 'clams', 'definite'],
  ['shellfish', 'shrimp paste', 'definite'],
  ['shellfish', 'oyster mushrooms', null],
  ['shellfish', '2 crab apples', null],
  ['shellfish', '2 scallions, sliced', null],
  ['shellfish', 'salmon', null],
  ['shellfish', 'mixed seafood', 'possible'],
  ['shellfish', 'vegetarian oyster sauce', null],
  // ---- tree nuts --------------------------------------------------------
  ['tree_nuts', '1/2 cup chopped walnuts', 'definite'],
  ['tree_nuts', '1 cup almond milk', 'definite'],
  ['tree_nuts', 'almond flour', 'definite'],
  ['tree_nuts', '2 tbsp pine nuts, toasted', 'definite'],
  ['tree_nuts', 'cashews', 'definite'],
  ['tree_nuts', 'pecan halves', 'definite'],
  ['tree_nuts', 'pistachios', 'definite'],
  ['tree_nuts', 'hazelnut spread', 'definite'],
  ['tree_nuts', 'Nutella', 'definite'],
  ['tree_nuts', 'marzipan', 'definite'],
  ['tree_nuts', 'basil pesto', 'definite'],
  ['tree_nuts', 'mixed nuts', 'definite'],
  ['tree_nuts', 'granola', 'possible'],
  ['tree_nuts', 'amaretto', 'possible'],
  ['tree_nuts', 'a pinch of ground nutmeg', null],
  ['tree_nuts', '1 cup coconut milk', null],
  ['tree_nuts', 'shredded coconut', null],
  ['tree_nuts', 'butternut squash', null],
  ['tree_nuts', 'water chestnuts', null],
  ['tree_nuts', 'peanut butter', null],
  ['tree_nuts', 'doughnut', null],
  ['tree_nuts', 'sunflower seeds', null],
  // ---- peanuts ----------------------------------------------------------
  ['peanuts', '2 tbsp peanut butter', 'definite'],
  ['peanuts', '1/2 cup roasted peanuts', 'definite'],
  ['peanuts', 'peanut oil', 'definite'],
  ['peanuts', 'groundnut oil', 'definite'],
  ['peanuts', 'chicken satay', 'definite'],
  ['peanuts', 'pad thai sauce', 'possible'],
  ['peanuts', 'mole sauce', 'possible'],
  ['peanuts', 'trail mix', 'possible'],
  ['peanuts', 'chopped nuts', 'possible'],
  ['peanuts', 'almonds', null],
  ['peanuts', 'cashew butter', null],
  ['peanuts', 'nutmeg', null],
  ['peanuts', 'sesame oil', null],
  ['peanuts', 'peanut-free granola', null],
  // ---- wheat ------------------------------------------------------------
  ['wheat', '2 cups all-purpose flour', 'definite'],
  ['wheat', '1 cup panko breadcrumbs', 'definite'],
  ['wheat', '8 oz spaghetti', 'definite'],
  ['wheat', '1 tbsp soy sauce', 'definite'],
  ['wheat', 'couscous', 'definite'],
  ['wheat', 'flour tortillas', 'definite'],
  ['wheat', 'pita bread', 'definite'],
  ['wheat', 'semolina', 'definite'],
  ['wheat', 'bulgur wheat', 'definite'],
  ['wheat', 'seitan', 'definite'],
  ['wheat', 'ramen noodles', 'definite'],
  ['wheat', 'tamari', 'possible'],
  ['wheat', 'beer', 'possible'],
  ['wheat', 'rice flour', null],
  ['wheat', 'almond flour', null],
  ['wheat', 'coconut flour', null],
  ['wheat', 'chickpea flour', null],
  ['wheat', 'gluten-free pasta', null],
  ['wheat', 'corn tortillas', null],
  ['wheat', 'rice noodles', null],
  ['wheat', 'wheat-free soy sauce', null],
  ['wheat', 'buckwheat groats', null],
  // ---- gluten -----------------------------------------------------------
  ['gluten', '1 cup pearl barley', 'definite'],
  ['gluten', 'rye bread', 'definite'],
  ['gluten', '2 tbsp malt vinegar', 'definite'],
  ['gluten', 'whole wheat flour', 'definite'],
  ['gluten', 'soy sauce', 'definite'],
  ['gluten', 'wheat-free soy sauce', 'possible'],
  ['gluten', 'gluten-free soy sauce', null],
  ['gluten', 'gluten-free flour blend', null],
  ['gluten', 'rolled oats', 'possible'],
  ['gluten', 'rice flour', null],
  ['gluten', 'rice', null],
  ['gluten', 'quinoa', null],
  ['gluten', 'gluten-free bread', null],
  // ---- soy --------------------------------------------------------------
  ['soy', '1 block firm tofu', 'definite'],
  ['soy', 'tempeh', 'definite'],
  ['soy', '1 cup edamame', 'definite'],
  ['soy', '1 tbsp miso paste', 'definite'],
  ['soy', 'soy sauce', 'definite'],
  ['soy', 'soy milk', 'definite'],
  ['soy', 'tamari', 'definite'],
  ['soy', 'soya chunks', 'definite'],
  ['soy', 'vegetable oil', 'possible'],
  ['soy', 'teriyaki sauce', 'possible'],
  ['soy', 'coconut aminos', null],
  ['soy', 'olive oil', null],
  ['soy', 'sesame oil', null],
  // ---- sesame -----------------------------------------------------------
  ['sesame', '2 tbsp tahini', 'definite'],
  ['sesame', 'toasted sesame oil', 'definite'],
  ['sesame', '1 tbsp sesame seeds', 'definite'],
  ['sesame', 'halva', 'definite'],
  ['sesame', 'hummus', 'possible'],
  ['sesame', 'za\'atar', 'possible'],
  ['sesame', 'everything bagel seasoning', 'possible'],
  ['sesame', 'olive oil', null],
  ['sesame', 'poppy seeds', null],
  // ---- pork -------------------------------------------------------------
  ['pork', '4 slices bacon', 'definite'],
  ['pork', 'pancetta, diced', 'definite'],
  ['pork', 'prosciutto', 'definite'],
  ['pork', '2 tbsp lard', 'definite'],
  ['pork', 'pork shoulder', 'definite'],
  ['pork', 'honey-glazed ham', 'definite'],
  ['pork', 'guanciale', 'definite'],
  ['pork', 'chorizo', 'possible'],
  ['pork', 'Italian sausage', 'possible'],
  ['pork', 'pepperoni', 'possible'],
  ['pork', 'gelatin', 'possible'],
  ['pork', '2 cups stock', 'possible'],
  ['pork', 'turkey bacon', null],
  ['pork', 'chicken sausage', null],
  ['pork', 'chicken stock', null],
  ['pork', 'vegetable broth', null],
  ['pork', 'pork-free stock', null],
  ['pork', 'coconut bacon', null],
  ['pork', 'hamburger buns', null],
  ['pork', 'chicken breast', null],
  // ---- beef -------------------------------------------------------------
  ['beef', '1 lb ground beef', 'definite'],
  ['beef', 'beef broth', 'definite'],
  ['beef', 'ribeye steak', 'definite'],
  ['beef', 'veal cutlets', 'definite'],
  ['beef', 'beef tallow', 'definite'],
  ['beef', 'beef jerky', 'definite'],
  ['beef', 'hamburger patties', 'possible'],
  ['beef', 'meatballs', 'possible'],
  ['beef', 'gelatin', 'possible'],
  ['beef', 'tuna steak', null],
  ['beef', 'cauliflower steak', null],
  ['beef', 'turkey burger', null],
  ['beef', 'chicken broth', null],
  ['beef', 'beefsteak tomato', null],
  ['beef', 'pork chops', null],
];

describe('allergen matcher: ingredient table', () => {
  it('has at least 150 cases', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(150);
  });
  it.each(CASES)('%s vs "%s" -> %s', (key, ingredient, expected) => {
    expect(sev(key, ingredient)).toBe(expected);
  });
});

describe('regression: named cases from the brief', () => {
  it('pork allergy flags bacon/pancetta/lard/prosciutto', () => {
    for (const i of ['bacon', 'pancetta', 'lard', 'prosciutto']) expect(sev('pork', i)).toBe('definite');
  });
  it('pork-free stock is not flagged for pork', () => {
    expect(sev('pork', 'pork-free stock')).toBeNull();
  });
  it('tree nut allergy ignores nutmeg and coconut', () => {
    expect(sev('tree_nuts', 'nutmeg')).toBeNull();
    expect(sev('tree_nuts', 'coconut')).toBeNull();
  });
  it('gluten restriction does not treat wheat-free soy sauce as gluten-free', () => {
    expect(sev('gluten', 'wheat-free soy sauce')).not.toBeNull();
  });
});

describe('tokenize', () => {
  it('strips quantities, units and prep words', () => {
    expect(tokenize('2 tbsp unsalted butter, melted')).toEqual(['unsalted', 'butter']);
  });
  it('singularises plurals and handles accents', () => {
    expect(tokenize('Crème Fraîche')).toEqual(['creme', 'fraiche']);
    expect(tokenize('Anchovies')).toEqual(['anchovy']);
  });
  it('returns [] for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('resolveRestriction / normalizeRestriction', () => {
  it.each([
    ['peanuts', ['peanuts']],
    ['tree_nuts', ['tree_nuts']],
    ['dairy', ['milk']],
    ['eggs', ['egg']],
    ['Gluten-free', ['gluten']],
    ['Nut allergy', ['tree_nuts', 'peanuts']],
    ['Dairy-free', ['milk']],
    ['shellfish allergy', ['shellfish']],
    ['lactose intolerant', ['milk']],
    ['no pork', ['pork']],
  ])('%s -> %j', (label, keys) => {
    expect(resolveRestriction(label as string)).toEqual(keys);
  });
  it('returns [] / null for labels it cannot map', () => {
    expect(resolveRestriction('vegetarian')).toEqual([]);
    expect(resolveRestriction('no spicy food or cilantro')).toEqual([]);
    expect(normalizeRestriction('keto')).toBeNull();
    expect(normalizeRestriction('Dairy')).toBe('milk');
  });
});

describe('checkRecipe', () => {
  const me = (restrictions: string[]): Diner => ({ id: 'me', name: 'Me', restrictions });

  it('blocks a recipe with butter for a dairy restriction and names butter', () => {
    const r = checkRecipe({ ingredients: [{ name: 'butter' }, { name: 'flour' }] }, [me(['dairy'])]);
    expect(r.status).toBe('blocked');
    expect(r.findings[0].ingredient).toBe('butter');
    expect(r.findings[0].restriction).toBe('dairy');
    expect(r.checkedAgainst).toEqual(['dairy']);
  });

  it('is safe when nothing matches, and reports what was checked', () => {
    const r = checkRecipe({ ingredients: [{ name: 'rice' }, { name: 'broccoli' }] }, [me(['peanuts', 'dairy'])]);
    expect(r.status).toBe('safe');
    expect(r.checkedAgainst).toEqual(['peanuts', 'dairy']);
  });

  it('warns (never safe) when ingredients are empty or unparseable', () => {
    expect(checkRecipe({ ingredients: [] }, [me(['dairy'])]).status).toBe('warning');
    expect(checkRecipe({ ingredients: null }, [me(['dairy'])]).status).toBe('warning');
    expect(checkRecipe({ ingredients: [{ name: '   ' }] }, [me(['dairy'])]).ingredientsUnreadable).toBe(true);
    expect(checkRecipe({ ingredients: [{ name: '2 tbsp' }] }, [me(['dairy'])]).status).toBe('warning');
  });

  it('empty ingredients with no restrictions stays safe (nothing to check)', () => {
    expect(checkRecipe({ ingredients: [] }, [me([])]).status).toBe('safe');
  });

  it('lists unmapped free-text restrictions as unverified instead of silently passing', () => {
    const r = checkRecipe({ ingredients: [{ name: 'rice' }] }, [me(['peanuts', 'no cilantro'])]);
    expect(r.unverified).toEqual(['no cilantro']);
    expect(r.checkedAgainst).toEqual(['peanuts']);
  });

  it('flags a title match at warning level when the ingredient list is sloppy', () => {
    const r = checkRecipe({ title: 'Peanut Butter Cookies', ingredients: [{ name: 'flour' }, { name: 'sugar' }] }, [me(['peanuts'])]);
    expect(r.status).toBe('warning');
    expect(r.findings[0].ingredient).toBe('title');
  });

  it('does not duplicate a title warning when the ingredient list already blocks', () => {
    const r = checkRecipe({ title: 'Peanut Butter Cookies', ingredients: [{ name: 'peanut butter' }] }, [me(['peanuts'])]);
    expect(r.status).toBe('blocked');
    expect(r.findings.every(f => f.ingredient !== 'title')).toBe(true);
  });

  it('accepts plain-string ingredients', () => {
    expect(checkRecipe({ ingredients: ['1 cup milk'] }, [me(['dairy'])]).status).toBe('blocked');
  });

  it('supports multiple diners with different restrictions', () => {
    const diners: Diner[] = [
      { id: 'me', name: 'Me', restrictions: ['dairy'] },
      { id: 'mia', name: 'Mia', restrictions: ['peanuts'] },
      { id: 'dad', name: 'Dad', restrictions: ['pork'] },
    ];
    const r = checkRecipe({ ingredients: [{ name: '2 tbsp peanut butter' }, { name: 'rice' }] }, diners);
    expect(r.status).toBe('blocked');
    const byId = Object.fromEntries(r.perDiner.map(d => [d.dinerId, d.status]));
    expect(byId).toEqual({ me: 'safe', mia: 'blocked', dad: 'safe' });
    expect(r.findings.every(f => f.dinerId === 'mia')).toBe(true);
  });

  it('a diner with no restrictions is safe and checks nothing', () => {
    const r = checkRecipe({ ingredients: [{ name: 'butter' }] }, [{ id: 'x', name: 'X', restrictions: [] }]);
    expect(r.status).toBe('safe');
    expect(r.checkedAgainst).toEqual([]);
  });

  it('hasAnyRestrictions ignores blank labels', () => {
    expect(hasAnyRestrictions([me([])])).toBe(false);
    expect(hasAnyRestrictions([me(['  '])])).toBe(false);
    expect(hasAnyRestrictions([me(['soy'])])).toBe(true);
  });

  it('maps "Nut allergy" to both peanuts and tree nuts', () => {
    expect(checkRecipe({ ingredients: ['almonds'] }, [me(['Nut allergy'])]).status).toBe('blocked');
    expect(checkRecipe({ ingredients: ['peanuts'] }, [me(['Nut allergy'])]).status).toBe('blocked');
  });
});
