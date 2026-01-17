import { useState, useEffect } from 'react';
import { supabase, Recipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type DashboardData = {
    quickWins: Recipe[];
    favorites: Recipe[];
    recent: Recipe[];
    featured: Recipe | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};

export function useRecipeDashboard(): DashboardData {
    const { user } = useAuth();
    const [data, setData] = useState<{
        quickWins: Recipe[];
        favorites: Recipe[];
        recent: Recipe[];
        featured: Recipe | null;
    }>({
        quickWins: [],
        favorites: [],
        recent: [],
        featured: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            // Parallel Fetch
            const [quickWinsRes, favoritesRes, recentRes, ratingsRes] = await Promise.all([
                // Quick Wins: time <= 30
                supabase
                    .from('recipes')
                    .select('*')
                    .eq('user_id', user.id)
                    .lte('total_time', 30)
                    .order('created_at', { ascending: false })
                    .limit(10),

                // Favorites: need to join with ratings ideally, but for now we might fetch recipes and filter client side 
                // OR fetch all ratings >= 4 and then fetch those recipes.
                // Supabase doesn't easily support join filtering in one go without view or complex query.
                // Let's try fetching high ratings first.
                supabase
                    .from('recipe_ratings')
                    .select('recipe_id, rating')
                    .eq('user_id', user.id)
                    .gte('rating', 4)
                    .limit(20), // Get top 20 rated IDs

                // Recent
                supabase
                    .from('recipes')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10),

                // Fetch all ratings for accurate display on cards if needed, 
                // but for "favorites" lane we specifically need the high rated ones.
                // We'll reuse the second query result for that.
                Promise.resolve({ data: [], error: null }) // filler
            ]);

            if (quickWinsRes.error) throw quickWinsRes.error;
            if (favoritesRes.error) throw favoritesRes.error;
            if (recentRes.error) throw recentRes.error;

            // Process Favorites
            let favorites: Recipe[] = [];
            if (favoritesRes.data && favoritesRes.data.length > 0) {
                const favIds = favoritesRes.data.map(r => r.recipe_id);
                const { data: favRecipes, error: favErr } = await supabase
                    .from('recipes')
                    .select('*')
                    .in('id', favIds)
                    .limit(10);

                if (favErr) throw favErr;
                favorites = favRecipes || [];
            }

            // Featured Logic: Random from favorites, or recent if no favorites
            let featured: Recipe | null = null;
            const pool = favorites.length > 0 ? favorites : recentRes.data || [];
            if (pool.length > 0) {
                const randomIndex = Math.floor(Math.random() * pool.length);
                featured = pool[randomIndex];
            }

            setData({
                quickWins: quickWinsRes.data || [],
                favorites: favorites,
                recent: recentRes.data || [],
                featured
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
    }, [user]);

    return {
        ...data,
        loading,
        error,
        refresh: fetchDashboard
    };
}
