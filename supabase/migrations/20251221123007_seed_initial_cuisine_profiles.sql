/*
  # Seed Initial Cuisine Profiles

  1. Data Population
    - Chinese cuisine profile (Weeknight home cooking focus)
    - Italian cuisine profile (Simple, ingredient-focused)
    - Mexican cuisine profile (Fresh, bold flavors)
    - Indian cuisine profile (Aromatic, layered spices)

  2. Important Notes
    - Each profile includes detection keywords
    - Profile data stored as JSONB with complete schema
    - Profiles are active by default
    - Display order set for consistent admin UI
*/

-- Insert Chinese cuisine profile
INSERT INTO cuisine_profiles (cuisine_name, style_focus, keywords, profile_data, display_order)
VALUES (
  'Chinese',
  'Weeknight home cooking, not restaurant-style',
  ARRAY['chinese', 'stir fry', 'stir-fry', 'wok', 'soy sauce', 'ginger', 'scallion', 'fried rice', 'lo mein', 'chow mein', 'kung pao', 'szechuan', 'sichuan', 'cantonese', 'mandarin', 'asian'],
  '{
    "cuisine_identity": {
      "name": "Chinese",
      "style_focus": "Weeknight home cooking, not restaurant-style"
    },
    "culinary_philosophy": [
      "Quick, high-heat cooking (stir-frying) that preserves texture and color",
      "Balance of flavors: salty, sweet, sour, umami, with optional heat",
      "Ingredient prep is key — everything mise en place before heat",
      "Simple sauces built from pantry staples (soy sauce, rice vinegar, sesame oil, cornstarch)",
      "Protein + vegetables + aromatics, served over rice or noodles"
    ],
    "ingredient_boundaries": {
      "common": [
        "Soy sauce (light and dark)",
        "Rice vinegar",
        "Sesame oil",
        "Cornstarch",
        "Ginger",
        "Garlic",
        "Scallions",
        "White rice or jasmine rice",
        "Chicken thighs or breast",
        "Ground pork or beef",
        "Firm tofu",
        "Eggs",
        "Bok choy, napa cabbage, snap peas, bell peppers, broccoli",
        "Dried chili peppers or chili oil (optional for heat)"
      ],
      "avoid": [
        "Oyster sauce (unless specified as available)",
        "Shaoxing wine (substitute: dry sherry or omit)",
        "Chinese five-spice (unless user has it)",
        "Specialty sauces like hoisin or black bean unless confirmed"
      ],
      "conditional": [
        "If the user says they have oyster sauce, hoisin, or Shaoxing wine, use them freely",
        "If not mentioned, stick to soy sauce, vinegar, sesame oil base"
      ]
    },
    "technique_defaults": [
      "Stir-fry over high heat in a large skillet or wok",
      "Velvet proteins with cornstarch if time allows (optional step)",
      "Cook aromatics (ginger, garlic, scallions) in oil first",
      "Add protein, then vegetables in order of cooking time",
      "Finish with sauce (soy + vinegar + cornstarch slurry + sesame oil)",
      "Serve immediately over steamed rice"
    ],
    "flavor_balance_norms": {
      "umami_base": "Soy sauce, with optional oyster sauce if available",
      "acidity": "Rice vinegar or a squeeze of lime",
      "sweetness": "Small amount of sugar to balance soy",
      "aromatics": "Ginger, garlic, scallions (the holy trinity)",
      "heat": "Optional — dried chilies, chili oil, or Sichuan peppercorns if user likes spice",
      "finishing_touch": "Drizzle of sesame oil, garnish with sliced scallions or sesame seeds"
    },
    "canonical_recipe_structure": {
      "title_pattern": "Quick [Protein] Stir-Fry with [Vegetables]",
      "component_order": [
        "Rice (start first, cook while prepping)",
        "Prep all ingredients (slice protein, chop vegetables, mix sauce)",
        "Stir-fry: aromatics → protein → vegetables → sauce",
        "Serve over rice, garnish"
      ],
      "timing_target": "25-35 minutes total (rice cooking + active prep and cooking)"
    },
    "generation_guardrails": {
      "dont_suggest": [
        "Deep-frying unless user explicitly asks",
        "Recipes requiring a wok if user likely has a skillet",
        "Hard-to-find ingredients like Sichuan peppercorns unless user mentions them"
      ],
      "do_suggest": [
        "Simple stir-fries",
        "Fried rice (great for leftovers)",
        "Quick noodle dishes (lo mein style)",
        "Dumplings only if user has wrappers or is interested in making dough"
      ],
      "flexibility_notes": [
        "Protein is swappable: chicken, pork, tofu, shrimp, or beef",
        "Vegetables are flexible based on what user has on hand",
        "Sauce can be adjusted for sweetness, heat, or tanginess based on preference"
      ]
    }
  }'::jsonb,
  1
)
ON CONFLICT (cuisine_name) DO NOTHING;

-- Insert Italian cuisine profile
INSERT INTO cuisine_profiles (cuisine_name, style_focus, keywords, profile_data, display_order)
VALUES (
  'Italian',
  'Simple, ingredient-focused home cooking',
  ARRAY['italian', 'pasta', 'spaghetti', 'penne', 'rigatoni', 'marinara', 'bolognese', 'carbonara', 'pesto', 'parmesan', 'mozzarella', 'basil', 'olive oil', 'risotto', 'mediterranean'],
  '{
    "cuisine_identity": {
      "name": "Italian",
      "style_focus": "Simple, ingredient-focused home cooking"
    },
    "culinary_philosophy": [
      "Quality ingredients simply prepared",
      "Let core flavors shine — tomatoes, garlic, olive oil, herbs",
      "Fresh is best, but pantry staples work beautifully",
      "Pasta as a vehicle for sauce, not drowned in it",
      "Finish with good olive oil and freshly grated cheese"
    ],
    "ingredient_boundaries": {
      "common": [
        "Pasta (dried: spaghetti, penne, rigatoni, etc.)",
        "Canned tomatoes (whole, crushed, or diced)",
        "Garlic",
        "Olive oil (extra virgin for finishing)",
        "Onions",
        "Parmesan cheese",
        "Fresh or dried basil, oregano, parsley",
        "Salt and black pepper",
        "Red pepper flakes (optional)",
        "Ground beef or Italian sausage (for meat sauces)",
        "Chicken breast or thighs"
      ],
      "avoid": [
        "Expensive ingredients like truffle oil or saffron unless mentioned",
        "Fresh mozzarella unless user confirms they have it",
        "Arborio rice unless making risotto specifically"
      ],
      "conditional": [
        "Use fresh herbs if mentioned, dried if not",
        "Heavy cream is fine for creamy dishes like carbonara or vodka sauce",
        "White wine adds depth to sauces but can be omitted"
      ]
    },
    "technique_defaults": [
      "Sauté aromatics (garlic, onion) in olive oil",
      "Build sauce from canned tomatoes or cream base",
      "Cook pasta to al dente in well-salted water",
      "Reserve pasta water for sauce consistency",
      "Toss pasta with sauce, adding pasta water to emulsify",
      "Finish with cheese, herbs, and drizzle of olive oil"
    ],
    "flavor_balance_norms": {
      "savory_base": "Garlic, onion, tomatoes, or cream",
      "richness": "Olive oil, butter, cheese (Parmesan, Pecorino)",
      "herbs": "Basil for tomato dishes, parsley for versatility, oregano for depth",
      "heat": "Optional red pepper flakes",
      "acidity": "Tomatoes provide natural acidity; balance with pinch of sugar if needed",
      "finishing_touch": "Freshly grated Parmesan and a drizzle of quality olive oil"
    },
    "canonical_recipe_structure": {
      "title_pattern": "[Pasta Shape] with [Sauce Type]",
      "component_order": [
        "Start pasta water (heavily salted)",
        "Prep sauce ingredients",
        "Cook aromatics and build sauce",
        "Cook pasta, reserve pasta water",
        "Combine pasta and sauce with pasta water",
        "Finish and serve with cheese and herbs"
      ],
      "timing_target": "20-30 minutes total"
    },
    "generation_guardrails": {
      "dont_suggest": [
        "Fresh pasta unless user wants to make it",
        "Complex sauces with many specialty ingredients",
        "Dishes requiring long braises (save for weekend cooking)"
      ],
      "do_suggest": [
        "Classic tomato-based pastas (marinara, arrabbiata, puttanesca)",
        "Cream-based pastas (carbonara, alfredo, vodka sauce)",
        "Simple aglio e olio (garlic and oil)",
        "One-pan pastas where pasta cooks in the sauce",
        "Baked pasta dishes like simple baked ziti"
      ],
      "flexibility_notes": [
        "Pasta shapes are interchangeable",
        "Protein is optional or can be added (chicken, sausage, shrimp)",
        "Vegetables like spinach, zucchini, or mushrooms integrate easily"
      ]
    }
  }'::jsonb,
  2
)
ON CONFLICT (cuisine_name) DO NOTHING;

-- Insert Mexican cuisine profile
INSERT INTO cuisine_profiles (cuisine_name, style_focus, keywords, profile_data, display_order)
VALUES (
  'Mexican',
  'Fresh, bold flavors with simple preparation',
  ARRAY['mexican', 'taco', 'burrito', 'quesadilla', 'enchilada', 'fajita', 'salsa', 'guacamole', 'cilantro', 'lime', 'cumin', 'chili', 'tortilla', 'tex-mex', 'latin'],
  '{
    "cuisine_identity": {
      "name": "Mexican",
      "style_focus": "Fresh, bold flavors with simple preparation"
    },
    "culinary_philosophy": [
      "Bright, fresh flavors — lime, cilantro, chili",
      "Layered but simple — protein, beans, fresh toppings",
      "Warm tortillas as the foundation for most meals",
      "Quick cooking with bold spices (cumin, chili powder, paprika)",
      "Fresh toppings elevate everything (salsa, avocado, lime, cilantro)"
    ],
    "ingredient_boundaries": {
      "common": [
        "Tortillas (flour or corn)",
        "Ground beef, chicken breast or thighs, or pork",
        "Black beans or pinto beans (canned is fine)",
        "Rice (white or Mexican rice)",
        "Onions and bell peppers",
        "Tomatoes (fresh or canned)",
        "Garlic",
        "Cumin, chili powder, paprika, oregano",
        "Lime (essential for brightness)",
        "Cilantro (fresh)",
        "Avocado or guacamole",
        "Shredded cheese (cheddar, Monterey Jack, or Mexican blend)",
        "Sour cream",
        "Jalapeños (optional for heat)"
      ],
      "avoid": [
        "Specialty chiles like poblanos or chipotles unless user mentions them",
        "Cotija cheese unless confirmed",
        "Mexican crema (substitute: sour cream)",
        "Tomatillos unless making salsa verde specifically"
      ],
      "conditional": [
        "Use fresh tomatoes for salsa, canned for cooked sauces",
        "Chipotle in adobo adds smoky heat if available",
        "Queso fresco is nice but not essential"
      ]
    },
    "technique_defaults": [
      "Season and cook protein with cumin, chili powder, paprika",
      "Sauté onions and peppers for fajita-style dishes",
      "Warm tortillas before serving",
      "Build tacos or burritos with layers: protein, beans, rice, fresh toppings",
      "Finish with fresh lime juice, cilantro, salsa, avocado"
    ],
    "flavor_balance_norms": {
      "savory_base": "Cumin, chili powder, garlic, onion",
      "brightness": "Lime juice is critical for authentic flavor",
      "heat": "Optional jalapeños, hot sauce, or chili powder to taste",
      "freshness": "Cilantro, fresh tomatoes, onions",
      "richness": "Avocado, cheese, sour cream",
      "finishing_touch": "Squeeze of lime, handful of cilantro, drizzle of hot sauce"
    },
    "canonical_recipe_structure": {
      "title_pattern": "[Protein] [Dish Type: Tacos/Burritos/Bowls/Quesadillas]",
      "component_order": [
        "Start rice if serving (cook while prepping)",
        "Season and cook protein",
        "Prep fresh toppings (dice tomatoes, chop cilantro, slice avocado)",
        "Warm tortillas if needed",
        "Assemble and serve with lime wedges"
      ],
      "timing_target": "20-30 minutes total"
    },
    "generation_guardrails": {
      "dont_suggest": [
        "Complicated mole sauces",
        "Dishes requiring specialty equipment like a tortilla press",
        "Recipes with hard-to-find ingredients unless user mentions them"
      ],
      "do_suggest": [
        "Tacos (any protein: beef, chicken, fish, vegetarian)",
        "Burritos and burrito bowls",
        "Quesadillas (quick and kid-friendly)",
        "Fajitas (great for groups)",
        "Simple enchiladas (can use store-bought sauce)",
        "Nachos or loaded taco salads"
      ],
      "flexibility_notes": [
        "Protein is swappable: ground beef, shredded chicken, carnitas, black beans",
        "Toppings are customizable based on preference",
        "Dishes can be made vegetarian by using beans and vegetables"
      ]
    }
  }'::jsonb,
  3
)
ON CONFLICT (cuisine_name) DO NOTHING;

-- Insert Indian cuisine profile
INSERT INTO cuisine_profiles (cuisine_name, style_focus, keywords, profile_data, display_order)
VALUES (
  'Indian',
  'Aromatic, layered spices with approachable technique',
  ARRAY['indian', 'curry', 'tikka masala', 'biryani', 'dal', 'lentil', 'turmeric', 'cumin', 'coriander', 'garam masala', 'naan', 'basmati', 'tandoori', 'vindaloo', 'korma', 'south asian'],
  '{
    "cuisine_identity": {
      "name": "Indian",
      "style_focus": "Aromatic, layered spices with approachable technique"
    },
    "culinary_philosophy": [
      "Build depth through blooming whole and ground spices in oil",
      "Balance of six tastes: sweet, sour, salty, bitter, pungent, astringent",
      "Slow-building flavors in one pot — curry, dal, or braise",
      "Protein or vegetables in a rich, spiced sauce or dry preparation",
      "Serve with rice or flatbread to soak up flavors"
    ],
    "ingredient_boundaries": {
      "common": [
        "Basmati rice",
        "Onions, ginger, garlic (the base trinity)",
        "Tomatoes (fresh or canned)",
        "Cumin seeds and ground cumin",
        "Coriander (ground)",
        "Turmeric",
        "Garam masala",
        "Chili powder or cayenne (for heat)",
        "Yogurt (for marinating and creamy dishes)",
        "Coconut milk (for South Indian or creamy curries)",
        "Lentils (red lentils, split peas for dal)",
        "Chicken thighs (best for curry)",
        "Chickpeas or other legumes",
        "Spinach (for saag dishes)",
        "Cilantro (fresh, for garnish)"
      ],
      "avoid": [
        "Specialty ingredients like fenugreek, asafoetida, curry leaves unless user has them",
        "Ghee (substitute: butter or oil)",
        "Paneer unless user confirms they have it or want to make it",
        "Tamarind paste unless specifically mentioned"
      ],
      "conditional": [
        "Use garam masala if available, or substitute with cumin + coriander blend",
        "Heavy cream adds richness to dishes like tikka masala",
        "Kashmiri chili powder for color without too much heat"
      ]
    },
    "technique_defaults": [
      "Bloom whole spices (cumin seeds) in hot oil first",
      "Sauté onions until golden brown (builds sweetness)",
      "Add ginger-garlic paste, cook until fragrant",
      "Add ground spices (cumin, coriander, turmeric), toast briefly",
      "Add tomatoes, cook down into a thick sauce base",
      "Add protein or vegetables, simmer until tender",
      "Finish with garam masala, cream, or yogurt (off heat)",
      "Garnish with fresh cilantro, serve with rice or naan"
    ],
    "flavor_balance_norms": {
      "aromatic_base": "Onion, ginger, garlic (sautéed until golden)",
      "spice_layers": "Whole spices first, then ground spices, garam masala at the end",
      "umami_depth": "Tomatoes cooked down, or yogurt for tang",
      "richness": "Yogurt, cream, or coconut milk",
      "heat": "Adjustable with chili powder or fresh green chilies",
      "brightness": "Fresh cilantro, squeeze of lemon or lime",
      "finishing_touch": "Sprinkle of garam masala, swirl of cream, handful of cilantro"
    },
    "canonical_recipe_structure": {
      "title_pattern": "[Protein/Vegetable] [Curry Style: Masala/Korma/Vindaloo] or [Dal/Lentil Dish]",
      "component_order": [
        "Start rice (cook while building curry)",
        "Prep aromatics and spices",
        "Build spice base (onions → ginger-garlic → spices → tomatoes)",
        "Add protein or vegetables, simmer in sauce",
        "Finish with cream, yogurt, or garam masala",
        "Serve with rice, garnish with cilantro"
      ],
      "timing_target": "35-45 minutes total (rice cooking + curry building)"
    },
    "generation_guardrails": {
      "dont_suggest": [
        "Complicated biryanis unless user asks",
        "Recipes requiring a tandoor or grill unless user has one",
        "Dishes with long lists of hard-to-find spices"
      ],
      "do_suggest": [
        "Simple curries (tikka masala, butter chicken, korma)",
        "Dal dishes (red lentil dal, chana dal)",
        "One-pot dishes like curry with chickpeas or vegetables",
        "Dry preparations like aloo gobi or bhindi",
        "Rice dishes like simple pulao"
      ],
      "flexibility_notes": [
        "Protein is swappable: chicken, lamb, shrimp, paneer, chickpeas",
        "Spice level is adjustable",
        "Can make vegetarian versions with lentils, chickpeas, or vegetables",
        "Cream and coconut milk are interchangeable for richness"
      ]
    }
  }'::jsonb,
  4
)
ON CONFLICT (cuisine_name) DO NOTHING;
