
export interface Message {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
}

export interface UserPreferences {
    favorite_cuisines?: string[];
    favorite_dishes?: string[];
    dietary_style?: string;
    food_restrictions?: string[];
    time_preference?: 'quick' | 'moderate' | 'relaxed';
    skill_level?: string;
    household_size?: number;
    spice_preference?: string;
    cooking_equipment?: string[];
    additional_notes?: string;
}

export interface ModelConfig {
    id: string;
    model_identifier: string;
    provider: string;
    model_name: string;
}

export interface Ingredient {
    name: string;
    amount?: string;
    unit?: string;
}

export interface RecipeRequest {
    title: string;
    description?: string;
    ingredients: Ingredient[];
    instructions: string[];
    prepTime?: number;
    cookTime?: number;
    recipeType?: 'food' | 'cocktail';
}

export interface CuisineProfile {
    cuisine_name: string;
    keywords: string[];
    style_focus: string;
    is_active?: boolean;
    profile_data?: {
        culinary_philosophy?: string[];
        ingredient_boundaries?: {
            common: string[];
            avoid: string[];
        };
        technique_defaults?: string[];
        flavor_balance_norms?: Record<string, string>;
        canonical_recipe_structure?: {
            timing_target?: string;
        };
        generation_guardrails?: {
            do_suggest: string[];
            dont_suggest: string[];
        };
    };
}

export interface RecipeTags {
    technique?: string;
    grain?: string;
    protein?: string;
    cuisine?: string;
    meal?: string;
    base?: string;
    flavor?: string;
    strength?: string;
    method?: string;
    occasion?: string;
    baseSpirit?: string;
    glassType?: string;
    cocktailMethod?: string;
    ice?: string;
    garnish?: string;
    [key: string]: string | undefined;
}
