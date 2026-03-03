import { useState, useEffect } from 'react';
import { supabase, Recipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
    const [data, setData] = useState<{
        quickWins: Recipe[];
        favorites: Recipe[];
        recent: Recipe[];
        featured: Recipe[];
    }>({
        quickWins: [],
        favorites: [],
        recent: [],
        featured: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const selectDailyFeatured = (
        favorites: Recipe[], 
        recent: Recipe[], 
        older: Recipe[]
    ): Recipe[] => {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `featured_recipes_${user?.id}_${today}`;
        
        // 1. Try to load from local storage
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

        // 2. Generate new selection
        console.log('Generating new daily featured recipes');
        const selection: Recipe[] = [];
        const seenIds = new Set<string>();

        const addUnique = (pool: Recipe[], count: number) => {
            // Shuffle pool copy
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

        // Strategy:
        // - 1-2 from Favorites (High rated)
        // - 1-2 from Recent (Fresh)
        // - 1-2 from Older (Rediscover)
        
        // We aim for 5 total.
        
        // 1. Rediscover (Older) - Prioritize these to ensure rotation
        addUnique(older, 2);
        
        // 2. Favorites
        addUnique(favorites, 2);
        
        // 3. Recent - fill the rest
        addUnique(recent, 5 - selection.length);
        
        // 4. Fallback - if we still don't have 5, fill from any pool
        if (selection.length < 5) {
            const allPool = [...favorites, ...recent, ...older];
            addUnique(allPool, 5 - selection.length);
        }

        // Shuffle the final selection so the types are mixed
        const finalSelection = selection.sort(() => 0.5 - Math.random());

        // 3. Save to local storage
        try {
            localStorage.setItem(storageKey, JSON.stringify(finalSelection));
        } catch (e) {
            console.error('Failed to save featured recipes', e);
        }

        return finalSelection;
    };

    const fetchDashboard = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

            // Parallel Fetch
            const [quickWinsRes, favoritesRes, recentRes, olderRes] = await Promise.all([
                // Quick Wins: time <= 30
                supabase
                    .from('recipes')
                    .select('*')
                    .eq('user_id', user.id)
                    .lte('total_time', 30)
                    .order('created_at', { ascending: false })
                    .limit(10),

                // Favorites: fetch ratings >= 4
                supabase
                    .from('recipe_ratings')
                    .select('recipe_id')
                    .eq('user_id', user.id)
                    .gte('rating', 4)
                    .limit(20), 

                // Recent
                supabase
                    .from('recipes')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(15),

                // Older (Rediscover)
                supabase
                    .from('recipes')
                    .select('*')
                    .eq('user_id', user.id)
                    .lt('created_at', thirtyDaysAgoStr)
                    .limit(20) // Just get a sample of older ones
            ]);

            if (quickWinsRes.error) throw quickWinsRes.error;
            if (favoritesRes.error) throw favoritesRes.error;
            if (recentRes.error) throw recentRes.error;
            if (olderRes.error) throw olderRes.error;

            // Process Favorites
            let favorites: Recipe[] = [];
            if (favoritesRes.data && favoritesRes.data.length > 0) {
                const favIds = favoritesRes.data.map(r => r.recipe_id);
                // remove duplicates
                const uniqueFavIds = [...new Set(favIds)];
                
                const { data: favRecipes, error: favErr } = await supabase
                    .from('recipes')
                    .select('*')
                    .in('id', uniqueFavIds)
                    .limit(20);

                if (favErr) throw favErr;
                favorites = favRecipes || [];
            }

            const recent = recentRes.data || [];
            const older = olderRes.data || [];

            // Select Daily Featured
            const featured = selectDailyFeatured(favorites, recent, older);

            setData({
                quickWins: quickWinsRes.data || [],
                favorites: favorites,
                recent: recent,
                featured: featured
            });

        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();

        const handleUpdate = (e: CustomEvent) => {
            if (e.detail?.newFeatured) {
                setData(prev => ({ ...prev, featured: e.detail.newFeatured }));
            }
        };

        window.addEventListener('dashboard-recipes-updated', handleUpdate as EventListener);
        return () => {
            window.removeEventListener('dashboard-recipes-updated', handleUpdate as EventListener);
        };
    }, [user]);

    return {
        ...data,
        loading,
        error,
        refresh: fetchDashboard
    };
}
