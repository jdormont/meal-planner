import { useState, useEffect, useCallback } from 'react';
import { supabase, Recipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useRecipes() {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [communityRecipes, setCommunityRecipes] = useState<Recipe[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [filteredCommunityRecipes, setFilteredCommunityRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('');
    const [recipeType, setRecipeType] = useState<'food' | 'cocktail'>('food');

    const loadRecipes = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data: recipesData, error: recipesError } = await supabase
                .from('recipes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (recipesError) throw recipesError;

            // Fetch ratings for all recipes
            const { data: ratingsData, error: ratingsError } = await supabase
                .from('recipe_ratings')
                .select('recipe_id, rating')
                .eq('user_id', user.id);

            if (ratingsError) throw ratingsError;

            // Create a map of recipe_id to rating
            const ratingsMap = new Map(
                (ratingsData || []).map(r => [r.recipe_id, r.rating])
            );

            // Merge ratings with recipes
            const recipesWithRatings = (recipesData || []).map(recipe => ({
                ...recipe,
                rating: ratingsMap.get(recipe.id) || null
            }));

            setRecipes(recipesWithRatings);
        } catch (err) {
            console.error('Error loading recipes:', err);
            setError(err instanceof Error ? err.message : 'Failed to load recipes');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const loadCommunityRecipes = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .eq('is_shared', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCommunityRecipes(data || []);
        } catch (err) {
            console.error('Error loading community recipes:', err);
        }
    }, []);

    const saveRecipe = async (recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>, editingId?: string) => {
        if (!user) return;

        try {
            if (editingId && !editingId.startsWith('temp-')) {
                const { error } = await supabase
                    .from('recipes')
                    .update(recipeData)
                    .eq('id', editingId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('recipes')
                    .insert([{ ...recipeData, user_id: user.id, recipe_type: recipeData.recipe_type || recipeType }]);

                if (error) throw error;
            }

            await loadRecipes();
            await loadCommunityRecipes();
            return true;
        } catch (err) {
            console.error('Error saving recipe:', err);
            setError(err instanceof Error ? err.message : 'Failed to save recipe');
            return false;
        }
    };

    const deleteRecipe = async (id: string) => {
        try {
            const { error } = await supabase.from('recipes').delete().eq('id', id);

            if (error) throw error;
            await loadRecipes();
            await loadCommunityRecipes();
            return true;
        } catch (err) {
            console.error('Error deleting recipe:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete recipe');
            return false;
        }
    };

    const copyRecipe = async (recipe: Recipe) => {
        if (!user) return;

        try {
            const { error } = await supabase.from('recipes').insert([{
                user_id: user.id,
                title: `${recipe.title} (Copy)`,
                description: recipe.description,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                prep_time_minutes: recipe.prep_time_minutes,
                cook_time_minutes: recipe.cook_time_minutes,
                servings: recipe.servings,
                tags: recipe.tags,
                image_url: recipe.image_url,
                source_url: recipe.source_url,
                notes: recipe.notes,
                is_shared: false,
                recipe_type: recipe.recipe_type,
                cocktail_metadata: recipe.cocktail_metadata
            }]);

            if (error) throw error;
            await loadRecipes();
            return true;
        } catch (err) {
            console.error('Error copying recipe:', err);
            setError(err instanceof Error ? err.message : 'Failed to copy recipe');
            return false;
        }
    };

    // Filter Logic
    useEffect(() => {
        let filtered = [...recipes].filter((recipe) => recipe.recipe_type === recipeType);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((recipe) => {
                const titleMatch = recipe.title.toLowerCase().includes(term);
                const descMatch = recipe.description.toLowerCase().includes(term);
                const ingredientMatch = recipe.ingredients.some((ing) =>
                    ing.name.toLowerCase().includes(term)
                );
                return titleMatch || descMatch || ingredientMatch;
            });
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter((recipe) =>
                selectedTags.some((tag) => recipe.tags.includes(tag))
            );
        }

        if (selectedTimeFilter) {
            filtered = filtered.filter((recipe) => {
                const totalMinutes = recipe.prep_time_minutes + recipe.cook_time_minutes;
                switch (selectedTimeFilter) {
                    case 'quick':
                        return totalMinutes <= 30;
                    case 'medium':
                        return totalMinutes > 30 && totalMinutes <= 45;
                    case 'hour':
                        return totalMinutes > 45 && totalMinutes <= 90;
                    case 'project':
                        return totalMinutes > 90;
                    default:
                        return true;
                }
            });
        }

        setFilteredRecipes(filtered);
    }, [recipes, searchTerm, selectedTags, recipeType, selectedTimeFilter]);

    useEffect(() => {
        let filtered = [...communityRecipes];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((recipe) => {
                const titleMatch = recipe.title.toLowerCase().includes(term);
                const descMatch = recipe.description.toLowerCase().includes(term);
                const ingredientMatch = recipe.ingredients.some((ing) =>
                    ing.name.toLowerCase().includes(term)
                );
                return titleMatch || descMatch || ingredientMatch;
            });
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter((recipe) =>
                selectedTags.some((tag) => recipe.tags.includes(tag))
            );
        }

        if (selectedTimeFilter) {
            filtered = filtered.filter((recipe) => {
                const totalMinutes = recipe.prep_time_minutes + recipe.cook_time_minutes;
                switch (selectedTimeFilter) {
                    case 'quick':
                        return totalMinutes <= 30;
                    case 'medium':
                        return totalMinutes > 30 && totalMinutes <= 45;
                    case 'hour':
                        return totalMinutes > 45 && totalMinutes <= 90;
                    case 'project':
                        return totalMinutes > 90;
                    default:
                        return true;
                }
            });
        }

        setFilteredCommunityRecipes(filtered);
    }, [communityRecipes, searchTerm, selectedTags, selectedTimeFilter]);

    const getAllTags = (showCommunity: boolean) => {
        const tagSet = new Set<string>();
        const recipesToScan = showCommunity ? communityRecipes : recipes;
        recipesToScan
            .filter((recipe) => recipe.recipe_type === recipeType)
            .forEach((recipe) => {
                recipe.tags.forEach((tag) => tagSet.add(tag));
            });
        return Array.from(tagSet).sort();
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    // Initial Load
    useEffect(() => {
        if (user) {
            loadRecipes();
            loadCommunityRecipes();
        }
    }, [user, loadRecipes, loadCommunityRecipes]);

    return {
        recipes,
        communityRecipes,
        filteredRecipes,
        filteredCommunityRecipes,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        selectedTags,
        setSelectedTags,
        selectedTimeFilter,
        setSelectedTimeFilter,
        recipeType,
        setRecipeType,
        loadRecipes,
        loadCommunityRecipes,
        saveRecipe,
        deleteRecipe,
        copyRecipe,
        getAllTags,
        toggleTag
    };
}
