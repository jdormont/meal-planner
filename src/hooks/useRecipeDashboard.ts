import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Recipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { recipeService } from '../services/recipeService';

export type DashboardData = {
    quickWins: Recipe[];
    favorites: Recipe[];
    recent: Recipe[];
    featured: Recipe[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};

export const updateCachedFeaturedRecipe = (userId: string | undefined, recipeId: string, updates: Partial<Recipe>) => {
    if (!userId) return;
    
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `featured_recipes_${userId}_${today}`;
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                let updated = false;
                const newFeatured = parsed.map(r => {
                    if (r.id === recipeId) {
                        updated = true;
                        return { ...r, ...updates };
                    }
                    return r;
                });
                
                if (updated) {
                    localStorage.setItem(storageKey, JSON.stringify(newFeatured));
                    window.dispatchEvent(new CustomEvent('dashboard-recipes-updated', { detail: { newFeatured } }));
                }
            }
        }
    } catch (e) {
        console.error('Failed to update cached featured recipe', e);
    }
};

export function useRecipeDashboard(): DashboardData {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [featured, setFeatured] = useState<Recipe[]>([]);

    const {
        data: dashboardData = { quickWins: [], favorites: [], recent: [], older: [] },
        isLoading,
        error: queryError,
    } = useQuery({
        queryKey: ['dashboard-data', user?.id],
        queryFn: async () => {
            if (!user) return { quickWins: [], favorites: [], recent: [], older: [] };
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return recipeService.getDashboardData(user.id, thirtyDaysAgo.toISOString());
        },
        enabled: !!user,
    });

    const loading = isLoading;
    const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load dashboard') : null;

    const selectDailyFeatured = (
        favorites: Recipe[], 
        recent: Recipe[], 
        older: Recipe[]
    ): Recipe[] => {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `featured_recipes_${user?.id}_${today}`;
        
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log('Restored daily featured recipes from storage');
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to parse stored featured recipes', e);
        }

        console.log('Generating new daily featured recipes');
        const selection: Recipe[] = [];
        const seenIds = new Set<string>();

        const addUnique = (pool: Recipe[], count: number) => {
            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            let added = 0;
            for (const recipe of shuffled) {
                if (added >= count) break;
                if (!seenIds.has(recipe.id)) {
                    selection.push(recipe);
                    seenIds.add(recipe.id);
                    added++;
                }
            }
        };
        
        addUnique(older, 2);
        addUnique(favorites, 2);
        addUnique(recent, 5 - selection.length);
        
        if (selection.length < 5) {
            const allPool = [...favorites, ...recent, ...older];
            addUnique(allPool, 5 - selection.length);
        }

        const finalSelection = selection.sort(() => 0.5 - Math.random());

        try {
            localStorage.setItem(storageKey, JSON.stringify(finalSelection));
        } catch (e) {
            console.error('Failed to save featured recipes', e);
        }

        return finalSelection;
    };

    // Keep daily featured selection up to date when query data updates
    useEffect(() => {
        if (user && dashboardData && (dashboardData.favorites.length > 0 || dashboardData.recent.length > 0 || dashboardData.older.length > 0)) {
            const selected = selectDailyFeatured(
                dashboardData.favorites,
                dashboardData.recent,
                dashboardData.older
            );
            setFeatured(selected);
        }
    }, [dashboardData, user?.id]);

    // Handle updates when a recipe is edited (compatibility with other tabs)
    useEffect(() => {
        const handleUpdate = (e: CustomEvent) => {
            if (e.detail?.newFeatured) {
                setFeatured(e.detail.newFeatured);
            }
        };

        window.addEventListener('dashboard-recipes-updated', handleUpdate as EventListener);
        return () => {
            window.removeEventListener('dashboard-recipes-updated', handleUpdate as EventListener);
        };
    }, []);

    const refresh = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });
    }, [queryClient, user?.id]);

    return {
        quickWins: dashboardData.quickWins,
        favorites: dashboardData.favorites,
        recent: dashboardData.recent,
        featured,
        loading,
        error,
        refresh
    };
}
