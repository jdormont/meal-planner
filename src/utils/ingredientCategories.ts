/**
 * Maps an ingredient name to a grocery store section, used to group the
 * shopping list for faster in-store navigation.
 */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Produce: [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'berry', 'berries',
    'strawberry', 'blueberry', 'raspberry', 'melon', 'watermelon', 'pear',
    'peach', 'plum', 'mango', 'pineapple', 'avocado', 'tomato', 'potato',
    'sweet potato', 'onion', 'garlic', 'shallot', 'scallion', 'green onion',
    'carrot', 'celery', 'lettuce', 'spinach', 'kale', 'arugula', 'cabbage',
    'broccoli', 'cauliflower', 'pepper', 'bell pepper', 'jalapeno', 'cucumber',
    'zucchini', 'squash', 'pumpkin', 'mushroom', 'corn', 'pea', 'green bean',
    'asparagus', 'beet', 'radish', 'turnip', 'ginger', 'cilantro', 'parsley',
    'basil', 'mint', 'thyme', 'rosemary', 'dill', 'chive', 'herb',
  ],
  Dairy: [
    'milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'sour cream',
    'cream cheese', 'egg', 'half and half', 'half-and-half', 'mozzarella',
    'cheddar', 'parmesan', 'feta', 'ricotta', 'cottage cheese', 'buttermilk',
    'whipped cream', 'margarine',
  ],
  'Meat & Seafood': [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage', 'ham',
    'steak', 'ground beef', 'ground turkey', 'ground pork', 'ground chicken',
    'fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'crab', 'lobster', 'scallop',
    'cod', 'tilapia', 'mussel', 'clam', 'oyster', 'meat', 'chorizo', 'pepperoni',
    'prosciutto', 'salami',
  ],
  Frozen: [
    'frozen', 'ice cream', 'popsicle', 'frozen pizza', 'frozen vegetable',
    'frozen fruit', 'sorbet', 'gelato', 'ice',
  ],
  Bakery: [
    'bread', 'bagel', 'bun', 'roll', 'tortilla', 'croissant', 'baguette',
    'muffin', 'pita', 'naan', 'biscuit', 'pastry', 'donut', 'doughnut', 'cake',
  ],
  Pantry: [
    'rice', 'pasta', 'noodle', 'flour', 'sugar', 'salt', 'pepper', 'spice',
    'oil', 'olive oil', 'vinegar', 'sauce', 'ketchup', 'mustard', 'mayo',
    'mayonnaise', 'broth', 'stock', 'bouillon', 'can', 'canned', 'bean',
    'lentil', 'chickpea', 'cereal', 'oat', 'oatmeal', 'granola', 'nut',
    'peanut butter', 'almond butter', 'jam', 'jelly', 'honey', 'syrup',
    'chocolate', 'cocoa', 'baking powder', 'baking soda', 'vanilla', 'yeast',
    'tea', 'coffee', 'juice', 'soda', 'water', 'wine', 'soy sauce', 'salsa',
    'tortilla chip', 'cracker', 'chip', 'pretzel', 'popcorn',
  ],
};

/**
 * Returns the grocery store section for an ingredient name, falling back to
 * "Other" when no keyword matches.
 */
export function categorizeIngredient(name: string): string {
  const normalized = name.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
}
