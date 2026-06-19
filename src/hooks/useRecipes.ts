import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Recipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from './useAnalytics';
import { updateCachedFeaturedRecipe } from './useRecipeDashboard';
import { recipeService } from '../services/recipeService';

export function useRecipes() {
    const { user } = useAuth();
    const { track } = useAnalytics();
    const queryClient = useQueryClient();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('');
    const [recipeType, setRecipeType] = useState<'food' | 'cocktail'>('food');

    // Debounce search term to avoid rapid network requests
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // User's Recipes Infinite Query
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isFetchingNextPage,
        error: queryError,
    } = useInfiniteQuery({
        queryKey: ['recipes', user?.id, { recipeType, searchTerm: debouncedSearchTerm, selectedTags, selectedTimeFilter }],
        queryFn: async ({ pageParam = 0 }) => {
            if (!user) return { recipes: [], hasMore: false };
            return recipeService.getRecipes({
                userId: user.id,
                page: pageParam,
                recipeType,
                searchTerm: debouncedSearchTerm,
                selectedTags,
                selectedTimeFilter
            });
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.hasMore ? allPages.length : undefined;
        },
        initialPageParam: 0,
        enabled: !!user,
    });

    const recipes = data ? data.pages.flatMap(page => page.recipes) : [];
    const loading = isLoading || isFetchingNextPage;
    const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load recipes') : null;
    const hasMore = !!hasNextPage;

    // Community Recipes Infinite Query
    const {
        data: communityData,
        fetchNextPage: fetchNextPageCommunity,
        hasNextPage: hasNextPageCommunity,
        isFetchingNextPage: isFetchingNextPageCommunity,
    } = useInfiniteQuery({
        queryKey: ['community-recipes-paged'],
        queryFn: ({ pageParam = 0 }) => recipeService.getCommunityRecipesPaginated(pageParam),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.hasMore ? allPages.length : undefined;
        },
        initialPageParam: 0,
        enabled: !!user,
    });

    const communityRecipes = useMemo(
        () => communityData ? communityData.pages.flatMap(page => page.recipes) : [],
        [communityData]
    );

    // Available Tags Query
    const { data: allUserTags = [] } = useQuery({
        queryKey: ['user-tags', user?.id, recipeType],
        queryFn: () => {
            if (!user) return [];
            return recipeService.getUserTags(user.id, recipeType);
        },
        enabled: !!user
    });

    // Refetch handlers (compatibility with legacy codebase)
    const loadRecipes = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['recipes', user?.id] });
        await queryClient.invalidateQueries({ queryKey: ['user-tags', user?.id] });
    }, [queryClient, user?.id]);

    const loadCommunityRecipes = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['community-recipes-paged'] });
    }, [queryClient]);

    const loadMore = useCallback(() => {
        if (hasNextPage && !loading) {
            fetchNextPage();
        }
    }, [hasNextPage, loading, fetchNextPage]);

    const loadMoreCommunity = useCallback(() => {
        if (hasNextPageCommunity && !isFetchingNextPageCommunity) {
            fetchNextPageCommunity();
        }
    }, [hasNextPageCommunity, isFetchingNextPageCommunity, fetchNextPageCommunity]);

    const executeSearch = useCallback(() => {
        setDebouncedSearchTerm(searchTerm);
    }, [searchTerm]);

    // Mutations
    const saveRecipeMutation = useMutation({
        mutationFn: async ({ recipeData, editingId }: { recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>; editingId?: string }) => {
            if (!user) throw new Error('Not authenticated');
            return recipeService.saveRecipe(user.id, recipeData, editingId);
        },
        onSuccess: (_, variables) => {
            const { recipeData, editingId } = variables;
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
                updateCachedFeaturedRecipe(user?.id, editingId, recipeData);
            }

            // Invalidate cached data to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['recipes', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-tags', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });
        }
    });

    const saveRecipe = async (recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>, editingId?: string) => {
        try {
            await saveRecipeMutation.mutateAsync({ recipeData, editingId });
            return true;
        } catch (err) {
            console.error('Error saving recipe:', err);
            return false;
        }
    };

    const deleteRecipeMutation = useMutation({
        mutationFn: (id: string) => recipeService.deleteRecipe(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-tags', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });
        }
    });

    const deleteRecipe = async (id: string) => {
        try {
            await deleteRecipeMutation.mutateAsync(id);
            return true;
        } catch (err) {
            console.error('Error deleting recipe:', err);
            return false;
        }
    };

    const copyRecipeMutation = useMutation({
        mutationFn: (recipe: Recipe) => {
            if (!user) throw new Error('Not authenticated');
            return recipeService.copyRecipe(user.id, recipe);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-tags', user?.id] });
        }
    });

    const copyRecipe = async (recipe: Recipe) => {
        try {
            await copyRecipeMutation.mutateAsync(recipe);
            return true;
        } catch (err) {
            console.error('Error copying recipe:', err);
            return false;
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const getAllTags = (showCommunity: boolean) => {
        if (showCommunity) {
            const tagSet = new Set<string>();
            communityRecipes.forEach(r => r.tags.forEach(t => tagSet.add(t)));
            return Array.from(tagSet).sort();
        }
        return allUserTags;
    };

    const filteredCommunityRecipes = useMemo(() => {
        let result = communityRecipes;

        result = result.filter(r => r.recipe_type === recipeType);

        if (debouncedSearchTerm) {
            const term = debouncedSearchTerm.toLowerCase();
            result = result.filter(r =>
                r.title.toLowerCase().includes(term) ||
                r.description.toLowerCase().includes(term) ||
                r.ingredients.some(i => i.name.toLowerCase().includes(term))
            );
        }

        if (selectedTags.length > 0) {
            result = result.filter(r =>
                selectedTags.every(tag => r.tags.includes(tag))
            );
        }

        if (selectedTimeFilter) {
            result = result.filter(r => {
                const t = r.total_time;
                if (!t) return false;
                switch (selectedTimeFilter) {
                    case 'quick':   return t <= 30;
                    case 'medium':  return t > 30 && t <= 45;
                    case 'hour':    return t > 45 && t <= 90;
                    case 'project': return t > 90;
                    default:        return true;
                }
            });
        }

        return result;
    }, [communityRecipes, debouncedSearchTerm, selectedTags, recipeType, selectedTimeFilter]);

    return {
        recipes,
        communityRecipes,
        filteredRecipes: recipes,
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
        loadMoreCommunity,
        hasNextPageCommunity: !!hasNextPageCommunity,
        isFetchingNextPageCommunity,
        executeSearch
    };
}
