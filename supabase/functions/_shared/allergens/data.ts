/**
 * Allergen knowledge base. Pure data, no imports, safe for both Deno and Vite.
 *
 * Terms are written in natural singular form; the matcher normalises both sides
 * the same way (see text.ts), so plurals and accents are handled automatically.
 *
 * REVIEW NOTE: these lists are a first draft and should be hand-reviewed for the
 * allergens that matter most to real users before relying on them.
 */

export type TaxonomyKey =
  | 'milk' | 'egg' | 'fish' | 'shellfish' | 'tree_nuts' | 'peanuts'
  | 'wheat' | 'soy' | 'sesame' | 'gluten' | 'pork' | 'beef';

export interface AllergenEntry {
  /** Human label used in UI copy ("No match found for: dairy"). */
  label: string;
  /** Words that, directly before "free", claim the ingredient lacks this allergen. */
  freeWords: string[];
  /** Ingredient names/derivatives that contain the allergen. */
  definite: string[];
  /** Hidden or ambiguous sources: the ingredient MAY contain the allergen. */
  possible: string[];
  /** False-positive guards: a match inside one of these phrases is ignored. */
  safeOverrides: string[];
}

const WHEAT_DEFINITE = [
  'wheat', 'flour', 'all purpose flour', 'bread flour', 'bread', 'breadcrumb', 'bread crumb', 'panko',
  'pasta', 'spaghetti', 'macaroni', 'penne', 'fettuccine', 'linguine', 'lasagna', 'lasagne', 'orzo',
  'rigatoni', 'tagliatelle', 'ravioli', 'gnocchi', 'ramen', 'udon', 'couscous', 'semolina', 'durum',
  'spelt', 'farro', 'kamut', 'bulgur', 'seitan', 'soy sauce', 'shoyu', 'crouton', 'cracker', 'pita',
  'naan', 'bun', 'biscuit', 'pizza dough', 'dough', 'pastry', 'pie crust', 'phyllo', 'filo',
  'graham cracker', 'wheat germ', 'wheat bran', 'farina', 'cake mix', 'pancake mix',
];
const WHEAT_POSSIBLE = [
  'tortilla', 'tamari', 'beer', 'malt', 'teriyaki', 'hoisin', 'gravy', 'roux', 'meatball', 'meatloaf',
  'imitation crab', 'modified food starch', 'bouillon',
];
const WHEAT_OVERRIDES = [
  'rice flour', 'almond flour', 'coconut flour', 'chickpea flour', 'tapioca flour', 'potato flour',
  'cassava flour', 'buckwheat flour', 'corn flour', 'oat flour', 'sorghum flour', 'gluten free flour',
  'gluten free bread', 'gluten free pasta', 'gluten free soy sauce', 'gluten free breadcrumb',
  'gluten free cracker', 'rice noodle', 'corn tortilla', 'cornbread', 'flourless', 'sweet potato flour',
  'wheat free soy sauce', 'wheat free pasta', 'wheat free bread',
];

export const ALLERGENS: Record<TaxonomyKey, AllergenEntry> = {
  milk: {
    label: 'dairy',
    freeWords: ['dairy', 'milk', 'lactose'],
    definite: [
      'milk', 'butter', 'cream', 'cheese', 'yogurt', 'yoghurt', 'ghee', 'whey', 'casein', 'caseinate',
      'lactose', 'paneer', 'parmesan', 'parmigiano', 'cheddar', 'mozzarella', 'ricotta', 'mascarpone',
      'feta', 'brie', 'gouda', 'gruyere', 'halloumi', 'buttermilk', 'custard', 'ice cream', 'kefir',
      'half and half', 'creme fraiche', 'condensed milk', 'evaporated milk', 'milk powder', 'queso',
      'bechamel', 'alfredo', 'dulce de leche', 'gelato', 'labneh', 'quark', 'curd',
    ],
    possible: [
      'natural flavor', 'natural flavour', 'pesto', 'caesar dressing', 'ranch', 'au gratin', 'margarine',
      'milk chocolate', 'chocolate', 'caramel', 'naan', 'brioche', 'mashed potato', 'butterscotch',
      'nougat', 'toffee', 'protein powder', 'creamer',
    ],
    safeOverrides: [
      'coconut milk', 'coconut cream', 'almond milk', 'oat milk', 'soy milk', 'rice milk', 'cashew milk',
      'hemp milk', 'cream of tartar', 'cocoa butter', 'peanut butter', 'almond butter', 'cashew butter',
      'sunflower seed butter', 'sunflower butter', 'nut butter', 'apple butter', 'shea butter',
      'butter bean', 'butter lettuce', 'butter bean', 'dairy free butter', 'dairy free milk',
      'dairy free cheese', 'dairy free yogurt', 'dairy free cream', 'dairy free ice cream',
      'vegan butter', 'vegan cheese', 'vegan cream', 'plant based milk', 'plant based butter',
      'coconut yogurt', 'soy yogurt', 'coconut whipped cream', 'milk thistle', 'cream soda',
    ],
  },
  egg: {
    label: 'egg',
    freeWords: ['egg'],
    definite: [
      'egg', 'egg white', 'egg yolk', 'mayonnaise', 'mayo', 'meringue', 'aioli', 'albumin',
      'egg noodle', 'eggnog', 'hollandaise', 'egg wash', 'custard', 'quiche', 'frittata', 'omelet',
      'omelette', 'souffle', 'lysozyme',
    ],
    possible: [
      'brioche', 'challah', 'fresh pasta', 'tartar sauce', 'marshmallow', 'caesar dressing',
      'pancake mix', 'cake mix', 'french toast', 'ice cream', 'mousse', 'pasta',
    ],
    safeOverrides: [
      'vegan mayo', 'vegan mayonnaise', 'egg replacer', 'egg substitute', 'eggless mayo',
      'egg free mayo', 'egg free mayonnaise', 'dried pasta',
    ],
  },
  fish: {
    label: 'fish',
    freeWords: ['fish'],
    definite: [
      'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'halibut', 'trout', 'bass', 'haddock', 'mackerel',
      'sardine', 'anchovy', 'herring', 'snapper', 'mahi', 'swordfish', 'catfish', 'pollock', 'flounder',
      'fish sauce', 'fish stock', 'dashi', 'bonito', 'katsuobushi', 'caviar', 'roe', 'fish oil', 'surimi',
      'eel', 'anchovy paste', 'nam pla', 'bouillabaisse', 'fish sticks', 'fish stick', 'carp', 'perch',
      'monkfish', 'grouper', 'sea bass',
    ],
    possible: [
      'worcestershire', 'caesar dressing', 'caesar salad', 'thai curry paste', 'curry paste',
      'bouillon', 'omega 3', 'paella', 'puttanesca', 'kimchi', 'xo sauce',
    ],
    safeOverrides: ['vegan fish sauce', 'vegetarian fish sauce', 'fish free fish sauce', 'fish mint'],
  },
  shellfish: {
    label: 'shellfish',
    freeWords: ['shellfish', 'seafood'],
    definite: [
      'shellfish', 'shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'crawfish', 'langoustine', 'scallop',
      'clam', 'mussel', 'oyster', 'squid', 'calamari', 'octopus', 'cuttlefish', 'abalone', 'escargot',
      'krill', 'shrimp paste', 'oyster sauce', 'crab stick', 'imitation crab', 'conch', 'whelk',
      'cockle', 'barnacle', 'sea urchin',
    ],
    possible: [
      'seafood', 'surimi', 'bouillabaisse', 'paella', 'xo sauce', 'thai curry paste', 'curry paste',
      'fish sauce', 'seafood stock', 'cioppino', 'gumbo', 'jambalaya',
    ],
    safeOverrides: [
      'oyster mushroom', 'king oyster mushroom', 'crab apple', 'crabapple', 'vegetarian oyster sauce',
      'mushroom oyster sauce', 'vegan oyster sauce', 'vegan shrimp', 'vegan scallop', 'vegan crab',
    ],
  },
  tree_nuts: {
    label: 'tree nuts',
    freeWords: ['nut', 'tree nut'],
    definite: [
      'almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut',
      'pine nut', 'chestnut', 'praline', 'marzipan', 'frangipane', 'nutella', 'gianduja', 'filbert',
      'nut', 'mixed nut', 'nut butter', 'nut oil', 'nut milk', 'almond flour', 'almond extract',
      'pesto', 'amaretti', 'orgeat', 'hickory nut', 'pili nut', 'kola nut', 'cobnut',
    ],
    possible: [
      'amaretto', 'baklava', 'granola', 'trail mix', 'nougat', 'frangelico', 'natural flavor',
      'natural flavour', 'energy bar', 'muesli',
    ],
    safeOverrides: ['water chestnut', 'nut free pesto', 'nutmeg', 'butternut', 'doughnut', 'donut'],
  },
  peanuts: {
    label: 'peanuts',
    freeWords: ['peanut', 'nut'],
    definite: [
      'peanut', 'groundnut', 'peanut butter', 'peanut oil', 'peanut flour', 'arachis', 'monkey nut',
      'satay', 'peanut sauce',
    ],
    possible: [
      'nut', 'mixed nut', 'trail mix', 'granola', 'pad thai', 'mole', 'egg roll', 'nougat', 'praline',
      'energy bar', 'muesli', 'natural flavor', 'natural flavour', 'chili', 'african stew',
      'thai curry paste', 'curry paste', 'marzipan',
    ],
    safeOverrides: [],
  },
  wheat: {
    label: 'wheat',
    freeWords: ['wheat'],
    definite: WHEAT_DEFINITE,
    possible: WHEAT_POSSIBLE,
    safeOverrides: WHEAT_OVERRIDES,
  },
  gluten: {
    label: 'gluten',
    freeWords: ['gluten', 'wheat'],
    definite: [...WHEAT_DEFINITE, 'barley', 'rye', 'malt vinegar', 'malt extract', 'triticale', 'brewers yeast', 'pearl barley', 'malted milk'],
    possible: [...WHEAT_POSSIBLE, 'oat', 'oatmeal', 'rolled oat', 'granola', 'muesli', 'licorice', 'soup'],
    safeOverrides: WHEAT_OVERRIDES.filter(o => !o.startsWith('wheat free') && !o.startsWith('oat flour')),
  },
  soy: {
    label: 'soy',
    freeWords: ['soy', 'soya'],
    definite: [
      'soy', 'soya', 'soybean', 'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce', 'tamari', 'shoyu',
      'soy milk', 'soy lecithin', 'textured vegetable protein', 'natto', 'soy protein', 'soy flour',
      'soybean oil', 'soy nut', 'yuba',
    ],
    possible: [
      'teriyaki', 'hoisin', 'vegetable oil', 'margarine', 'mayonnaise', 'stir fry sauce', 'bouillon',
      'vegetable broth', 'natural flavor', 'natural flavour', 'protein bar', 'worcestershire',
      'imitation meat', 'veggie burger',
    ],
    safeOverrides: ['soy free soy sauce', 'coconut aminos'],
  },
  sesame: {
    label: 'sesame',
    freeWords: ['sesame'],
    definite: [
      'sesame', 'tahini', 'sesame oil', 'sesame seed', 'gomasio', 'halva', 'halvah', 'benne', 'tahina',
    ],
    possible: [
      'hummus', 'baba ganoush', 'zaatar', 'za atar', 'dukkah', 'furikake', 'everything bagel',
      'everything seasoning', 'bagel', 'hamburger bun', 'hot dog bun', 'falafel', 'natural flavor',
      'natural flavour', 'shawarma', 'teriyaki',
    ],
    safeOverrides: ['sesame free'],
  },
  pork: {
    label: 'pork',
    freeWords: ['pork'],
    definite: [
      'pork', 'bacon', 'ham', 'pancetta', 'prosciutto', 'lard', 'pork belly', 'pork chop', 'pork rind',
      'chicharron', 'guanciale', 'speck', 'spare rib', 'carnitas', 'pulled pork', 'lardon', 'salt pork',
      'jamon', 'gammon', 'mortadella', 'tonkotsu', 'char siu', 'ham hock', 'bacon bit', 'bacon fat',
      'pork sausage', 'pork broth', 'pork stock',
    ],
    possible: [
      'sausage', 'chorizo', 'salami', 'pepperoni', 'hot dog', 'bologna', 'kielbasa', 'andouille',
      'gelatin', 'gelatine', 'marshmallow', 'stock', 'broth', 'bouillon', 'bone broth', 'sopressata',
      'nduja', 'frankfurter', 'wiener', 'brat', 'bratwurst', 'spam', 'luncheon meat', 'meatball',
      'meatloaf', 'dumpling', 'wonton', 'refried bean',
    ],
    safeOverrides: [
      'turkey bacon', 'turkey sausage', 'chicken sausage', 'turkey ham', 'coconut bacon', 'vegan bacon',
      'tempeh bacon', 'beef bacon', 'veggie sausage', 'plant based sausage', 'vegetarian sausage',
      'vegan sausage', 'turkey pepperoni', 'beef sausage', 'beef hot dog', 'chicken stock',
      'chicken broth', 'vegetable stock', 'vegetable broth', 'beef stock', 'beef broth',
      'turkey stock', 'turkey broth', 'mushroom broth', 'mushroom stock', 'vegan gelatin',
      'vegetarian bouillon', 'vegetable bouillon', 'chicken bouillon', 'beef bouillon',
      'beef bone broth', 'chicken bone broth', 'turkey meatball', 'chicken meatball', 'beef meatball',
      'turkey meatloaf', 'beef meatloaf',
    ],
  },
  beef: {
    label: 'beef',
    freeWords: ['beef'],
    definite: [
      'beef', 'ground beef', 'steak', 'brisket', 'ribeye', 'sirloin', 'veal', 'beef broth', 'beef stock',
      'beef bouillon', 'oxtail', 'short rib', 'chuck roast', 'tallow', 'suet', 'beef jerky', 'pastrami',
      'corned beef', 'tripe', 'filet mignon', 'flank steak', 'skirt steak', 'beef bone broth',
      'tenderloin beef', 'prime rib', 'roast beef',
    ],
    possible: [
      'jerky', 'burger', 'hamburger', 'meatball', 'meatloaf', 'hot dog', 'gelatin', 'gelatine',
      'bouillon', 'bone broth', 'salami', 'pepperoni', 'bologna', 'frankfurter', 'wiener', 'bratwurst',
      'stock', 'broth', 'worcestershire', 'sausage', 'consomme', 'demi glace', 'au jus',
    ],
    safeOverrides: [
      'tuna steak', 'salmon steak', 'cauliflower steak', 'swordfish steak', 'tofu steak', 'portobello steak',
      'vegan beef', 'veggie burger', 'turkey burger', 'chicken burger', 'bean burger', 'black bean burger',
      'plant based burger', 'turkey meatball', 'chicken meatball', 'pork meatball', 'turkey meatloaf',
      'chicken stock', 'chicken broth', 'vegetable stock', 'vegetable broth', 'pork stock', 'pork broth',
      'turkey stock', 'turkey broth', 'mushroom broth', 'mushroom stock', 'vegan gelatin',
      'vegetarian bouillon', 'vegetable bouillon', 'chicken bouillon', 'pork bouillon', 'turkey sausage',
      'chicken sausage', 'pork sausage', 'vegan sausage', 'chicken bone broth', 'turkey bone broth',
      'turkey hot dog', 'chicken hot dog', 'turkey bacon', 'beefsteak tomato', 'turkey bratwurst',
      'chicken bratwurst', 'pork bratwurst', 'pork salami', 'turkey salami', 'turkey pepperoni',
      'pork pepperoni', 'pork bologna', 'turkey bologna', 'pork jerky', 'turkey jerky', 'salmon jerky',
      'fish sauce', 'pork hot dog', 'plant based sausage', 'vegetarian sausage', 'veggie sausage',
    ],
  },
};

export const TAXONOMY_KEYS = Object.keys(ALLERGENS) as TaxonomyKey[];

/** Map of lowercase restriction words/phrases to taxonomy keys (see restrictions.ts). */
export const RESTRICTION_SYNONYMS: Record<string, TaxonomyKey[]> = {
  dairy: ['milk'], milk: ['milk'], lactose: ['milk'], 'lactose intolerant': ['milk'], 'lactose intolerance': ['milk'],
  egg: ['egg'], eggs: ['egg'],
  fish: ['fish'], finfish: ['fish'],
  shellfish: ['shellfish'], crustacean: ['shellfish'], crustaceans: ['shellfish'],
  'crustacean shellfish': ['shellfish'], mollusk: ['shellfish'], mollusks: ['shellfish'], seafood: ['fish', 'shellfish'],
  'tree nut': ['tree_nuts'], 'tree nuts': ['tree_nuts'], tree_nuts: ['tree_nuts'], treenut: ['tree_nuts'], treenuts: ['tree_nuts'],
  nut: ['tree_nuts', 'peanuts'], nuts: ['tree_nuts', 'peanuts'],
  peanut: ['peanuts'], peanuts: ['peanuts'],
  wheat: ['wheat'],
  gluten: ['gluten'], celiac: ['gluten'], coeliac: ['gluten'], 'celiac disease': ['gluten'],
  soy: ['soy'], soya: ['soy'], soybean: ['soy'], soybeans: ['soy'],
  sesame: ['sesame'],
  pork: ['pork'], pig: ['pork'],
  beef: ['beef'], 'red meat': ['beef', 'pork'],
};
