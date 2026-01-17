import { useState, useEffect, useCallback } from 'react';
import { supabase, Recipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from './useAnalytics';

const ITEMS_PER_PAGE = 12;

export function useRecipes() {
    const { user } = useAuth();
    const { track } = useAnalytics();

    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [communityRecipes, setCommunityRecipes] = useState<Recipe[]>([]);

    // We treat 'recipes' as the source of truth for the UI now (it's already filtered/paginated)
    // To maintain compatibility with App.tsx which expects filteredRecipes
    const filteredRecipes = recipes;
    const filteredCommunityRecipes = communityRecipes; // Community recipes not yet paginated in this refactor, or we can leave as is

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('');
    const [recipeType, setRecipeType] = useState<'food' | 'cocktail'>('food');

    // Available Tags (fetched separately to support filtering across all recipes)
    const [allUserTags, setAllUserTags] = useState<string[]>([]);

    const loadTags = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('tags')
                .eq('user_id', user.id)
                .eq('recipe_type', recipeType);

            if (error) throw error;

            const tagSet = new Set<string>();
            data?.forEach(row => {
                row.tags?.forEach((tag: string) => tagSet.add(tag));
            });
            setAllUserTags(Array.from(tagSet).sort());
        } catch (err) {
            console.error('Error loading tags:', err);
        }
    }, [user, recipeType]);

    // Main Fetch Function
    const fetchRecipes = useCallback(async (pageIndex: number, isNewFilter: boolean = false) => {
        if (!user) return;

        try {
            // Start building the query
            let query = supabase
                .from('recipes')
                .select('*')
                .eq('user_id', user.id)
                .eq('recipe_type', recipeType)
                .order('created_at', { ascending: false })
                .range(pageIndex * ITEMS_PER_PAGE, (pageIndex + 1) * ITEMS_PER_PAGE - 1);

            // Apply Filters
            if (searchTerm) {
                // ILIKE on title OR description. 
                // Note: Ingredients search omitted for server-side perf without FTS
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            if (selectedTags.length > 0) {
                query = query.contains('tags', selectedTags);
            }

            if (selectedTimeFilter) {
                switch (selectedTimeFilter) {
                    case 'quick':
                        query = query.lte('total_time', 30);
                        break;
                    case 'medium':
                        query = query.gt('total_time', 30).lte('total_time', 45);
                        break;
                    case 'hour':
                        query = query.gt('total_time', 45).lte('total_time', 90);
                        break;
                    case 'project':
                        query = query.gt('total_time', 90);
                        break;
                }
            }

            const { data: recipesData, error: recipesError } = await query;

            if (recipesError) throw recipesError;

            // Fetch Ratings
            // We only need ratings for the fetched recipes
            const visibleRecipeIds = recipesData?.map(r => r.id) || [];
            let recipesWithRatings = recipesData || [];

            if (visibleRecipeIds.length > 0) {
                const { data: ratingsData } = await supabase
                    .from('recipe_ratings')
                    .select('recipe_id, rating')
                    .eq('user_id', user.id)
                    .in('recipe_id', visibleRecipeIds);

                const ratingsMap = new Map((ratingsData || []).map(r => [r.recipe_id, r.rating]));
                recipesWithRatings = recipesWithRatings.map(recipe => ({
                    ...recipe,
                    rating: ratingsMap.get(recipe.id) || null
                }));
            }

            // Update State
            if (isNewFilter) {
                setRecipes(recipesWithRatings);
            } else {
                setRecipes(prev => [...prev, ...recipesWithRatings]);
            }

            // Check if we reached the end
            // If we got fewer items than requested, we are done
            if ((recipesData?.length || 0) < ITEMS_PER_PAGE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (err) {
            console.error('Error loading recipes:', err);
            setError(err instanceof Error ? err.message : 'Failed to load recipes');
        } finally {
            setLoading(false);
        }
    }, [user, recipeType, searchTerm, selectedTags, selectedTimeFilter]);

    // Public load function for refreshing
    const loadRecipes = useCallback(async () => {
        setPage(0);
        await fetchRecipes(0, true);
        await loadTags();
    }, [fetchRecipes, loadTags]);

    const loadMore = useCallback(() => {
        if (!hasMore || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchRecipes(nextPage, false);
    }, [page, hasMore, loading, fetchRecipes]);

    // Effect: Trigger fetch when filters change
    // Debounce search term to avoid rapid firing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setPage(0);
            fetchRecipes(0, true);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [fetchRecipes]); // fetchRecipes dependency includes filters

    // Initial Load - loadTags
    useEffect(() => {
        loadTags();
    }, [loadTags]);

    // Community Recipes - Keeping existing logic largely same but maybe separating to avoid confusion
    // Ideally we should paginate this too, but for now focusing on User recipes as per task
    const loadCommunityRecipes = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .eq('is_shared', true)
                .order('created_at', { ascending: false })
                .limit(24); // Limit community recipes too for safety

            if (error) throw error;
            setCommunityRecipes(data || []);
        } catch (err) {
            console.error('Error loading community recipes:', err);
        }
    }, []);

    useEffect(() => {
        if (user) {
            loadCommunityRecipes();
        }
    }, [user, loadCommunityRecipes]);


    const saveRecipe = async (recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>, editingId?: string) => {
        if (!user) return;

        try {
            let error;
            if (editingId && !editingId.startsWith('temp-')) {
                const result = await supabase
                    .from('recipes')
                    .update(recipeData)
                    .eq('id', editingId);
                error = result.error;
            } else {
                const result = await supabase
                    .from('recipes')
                    .insert([{ ...recipeData, user_id: user.id, recipe_type: recipeData.recipe_type || recipeType }]);
                error = result.error;

                // Track creation
                const creationSource = recipeData.source_url ? 'import' : (recipeData.tags?.includes('AI Generated') ? 'ai' : 'manual');
                track('recipe_created', {
                    type: creationSource,
                    title_length: recipeData.title.length,
                    has_image: !!recipeData.image_url,
                    recipe_type: recipeData.recipe_type || recipeType,
                    tags_count: recipeData.tags?.length || 0
                });
            }

            if (error) throw error;

            // Reload to reflect changes
            await loadRecipes();
            await loadTags();
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
            await loadTags();
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

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const getAllTags = (showCommunity: boolean) => {
        // If showCommunity, we should ideally fetch community tags too, 
        // but for now we'll return user tags which are fetched.
        // Or we can scan communityRecipes (which are loaded in memory).
        if (showCommunity) {
            const tagSet = new Set<string>();
            communityRecipes.forEach(r => r.tags.forEach(t => tagSet.add(t)));
            return Array.from(tagSet).sort();
        }
        return allUserTags;
    };

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
        toggleTag,
        loadMore,
        hasMore
    };
}
