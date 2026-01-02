import { useState, useEffect, useCallback } from 'react';
import { supabase, Meal, MealWithRecipes } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useMeals() {
    const { user } = useAuth();
    const [meals, setMeals] = useState<MealWithRecipes[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMeals = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data: mealsData, error: mealsError } = await supabase
                .from('meals')
                .select('*')
                .eq('is_archived', false)
                .order('date', { ascending: true });

            if (mealsError) throw mealsError;

            const mealsWithRecipes: MealWithRecipes[] = await Promise.all(
                (mealsData || []).map(async (meal) => {
                    const { data: mealRecipes, error: mrError } = await supabase
                        .from('meal_recipes')
                        .select('*, recipe:recipes(*)')
                        .eq('meal_id', meal.id)
                        .order('sort_order', { ascending: true });

                    if (mrError) throw mrError;

                    return {
                        ...meal,
                        recipes: mealRecipes || [],
                    };
                })
            );

            setMeals(mealsWithRecipes);
        } catch (err) {
            console.error('Error loading meals:', err);
            setError(err instanceof Error ? err.message : 'Failed to load meals');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const saveMeal = async (
        mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
        recipeIds: string[],
        editingMealId?: string
    ) => {
        if (!user) return;

        try {
            let mealId: string;

            if (editingMealId) {
                const { error } = await supabase
                    .from('meals')
                    .update({ ...mealData, updated_at: new Date().toISOString() })
                    .eq('id', editingMealId);

                if (error) throw error;
                mealId = editingMealId;

                await supabase.from('meal_recipes').delete().eq('meal_id', mealId);
            } else {
                const { data, error } = await supabase
                    .from('meals')
                    .insert([{ ...mealData, user_id: user.id }])
                    .select()
                    .single();

                if (error) throw error;
                mealId = data.id;
            }

            if (recipeIds.length > 0) {
                const mealRecipes = recipeIds.map((recipeId, index) => ({
                    meal_id: mealId,
                    recipe_id: recipeId,
                    user_id: user.id,
                    sort_order: index,
                    is_completed: false,
                }));

                const { error: mrError } = await supabase
                    .from('meal_recipes')
                    .insert(mealRecipes);

                if (mrError) throw mrError;
            }

            await loadMeals();
            return true;
        } catch (err) {
            console.error('Error saving meal:', err);
            setError(err instanceof Error ? err.message : 'Failed to save meal');
            return false;
        }
    };

    const deleteMeal = async (id: string) => {
        try {
            const { error } = await supabase.from('meals').delete().eq('id', id);

            if (error) throw error;
            await loadMeals();
            return true;
        } catch (err) {
            console.error('Error deleting meal:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete meal');
            return false;
        }
    };

    const toggleRecipeCompletion = async (mealRecipeId: string, isCompleted: boolean) => {
        try {
            const { error } = await supabase
                .from('meal_recipes')
                .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
                .eq('id', mealRecipeId);

            if (error) throw error;
            await loadMeals();
            return true;
        } catch (err) {
            console.error('Error toggling recipe completion:', err);
            return false;
        }
    };

    const removeRecipeFromMeal = async (mealId: string, recipeId: string) => {
        const meal = meals.find(m => m.id === mealId);
        if (!meal) return false;

        // If it's the last recipe, delete the whole meal
        if (meal.recipes.length <= 1) {
            return deleteMeal(mealId);
        }

        try {
            const { error } = await supabase
                .from('meal_recipes')
                .delete()
                .eq('meal_id', mealId)
                .eq('recipe_id', recipeId);

            if (error) throw error;
            await loadMeals();
            return true;
        } catch (err) {
            console.error('Error removing recipe from meal:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove recipe');
            return false;
        }
    };

    const moveMeal = async (mealId: string, newDate: string, newType: string) => {
        // Optimistic Update
        const previousMeals = [...meals];
        setMeals(currentMeals => currentMeals.map(meal =>
            meal.id === mealId
                ? { ...meal, date: newDate, meal_type: newType as any }
                : meal
        ));

        try {
            const { error } = await supabase
                .from('meals')
                .update({
                    date: newDate,
                    meal_type: newType,
                    updated_at: new Date().toISOString()
                })
                .eq('id', mealId);

            if (error) throw error;

            // Background re-fetch to ensure consistency
            loadMeals();
            return true;
        } catch (err) {
            console.error('Error moving meal:', err);
            // Rollback
            setMeals(previousMeals);
            setError(err instanceof Error ? err.message : 'Failed to move meal');
            return false;
        }
    };

    useEffect(() => {
        if (user) {
            loadMeals();
        }
    }, [user, loadMeals]);

    return {
        meals,
        loading,
        error,
        loadMeals,
        saveMeal,
        deleteMeal,
        moveMeal,
        removeRecipeFromMeal,
        toggleRecipeCompletion
    };
}
