import { useState, useEffect, useCallback, useRef } from 'react';
import { Recipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from './useAnalytics';
import { updateCachedFeaturedRecipe } from './useRecipeDashboard';
import { recipeService } from '../services/recipeService';


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
            const tags = await recipeService.getUserTags(user.id, recipeType);
            setAllUserTags(tags);
        } catch (err) {
            console.error('Error loading tags:', err);
        }
    }, [user, recipeType]);

    // Main Fetch Function
    const fetchRecipes = useCallback(async (pageIndex: number, isNewFilter: boolean = false) => {
        if (!user) return;

        try {
            const { recipes: recipesList, hasMore: moreAvailable } = await recipeService.getRecipes({
                userId: user.id,
                page: pageIndex,
                recipeType,
                searchTerm,
                selectedTags,
                selectedTimeFilter
            });

            // Update State
            if (isNewFilter) {
                setRecipes(recipesList);
            } else {
                setRecipes(prev => [...prev, ...recipesList]);
            }

            setHasMore(moreAvailable);

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

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const executeSearch = useCallback(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        setPage(0);
        fetchRecipes(0, true);
    }, [fetchRecipes]);

    // Effect: Trigger fetch when filters change
    // Debounce search term to avoid rapid firing
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setPage(0);
            fetchRecipes(0, true);
        }, 500);
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [fetchRecipes]); // fetchRecipes dependency includes filters

    // Initial Load - loadTags
    useEffect(() => {
        loadTags();
    }, [loadTags]);

    // Community Recipes - Keeping existing logic largely same but maybe separating to avoid confusion
    // Ideally we should paginate this too, but for now focusing on User recipes as per task
    const loadCommunityRecipes = useCallback(async () => {
        try {
            const data = await recipeService.getCommunityRecipes(24);
            setCommunityRecipes(data);
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
            await recipeService.saveRecipe(user.id, recipeData, editingId);

            // Track creation
            if (!editingId || editingId.startsWith('temp-')) {
                const creationSource = recipeData.source_url ? 'import' : (recipeData.tags?.includes('AI Generated') ? 'ai' : 'manual');
                track('recipe_created', {
                    type: creationSource,
                    title_length: recipeData.title.length,
                    has_image: !!recipeData.image_url,
                    recipe_type: recipeData.recipe_type || recipeType,
                    tags_count: recipeData.tags?.length || 0
                });
            }

            if (editingId && !editingId.startsWith('temp-')) {
                updateCachedFeaturedRecipe(user.id, editingId, recipeData);
            }

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
            await recipeService.deleteRecipe(id);
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
            await recipeService.copyRecipe(user.id, recipe);
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
        hasMore,
        executeSearch
    };
}
