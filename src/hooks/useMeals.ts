import { useState, useEffect, useCallback } from 'react';
import { Meal, MealWithRecipes } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from './useAnalytics';
import { mealService } from '../services/mealService';

export function useMeals() {
    const { user } = useAuth();
    const [meals, setMeals] = useState<MealWithRecipes[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { track } = useAnalytics();

    const loadMeals = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const data = await mealService.getMeals(user.id);
            setMeals(data);
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
            await mealService.saveMeal(user.id, mealData, recipeIds, editingMealId);

            if (!editingMealId) {
                track('meal_scheduled', {
                    date: mealData.date,
                    meal_type: mealData.meal_type,
                    count: recipeIds.length,
                    is_new: true
                });
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
            await mealService.deleteMeal(id);
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
            await mealService.toggleRecipeCompletion(mealRecipeId, isCompleted);
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

        try {
            const mealDeleted = await mealService.removeRecipeFromMeal(mealId, recipeId, meal.recipes.length);
            if (mealDeleted) {
                await loadMeals();
                return true;
            }
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
                ? { ...meal, date: newDate, meal_type: newType as Meal['meal_type'] }
                : meal
        ));

        try {
            await mealService.moveMeal(mealId, newDate, newType);

            track('meal_scheduled', {
                date: newDate,
                meal_type: newType,
                is_move: true
            });

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

    const reorderMealRecipes = async (mealId: string, orderedRecipeIds: string[]): Promise<boolean> => {
        const previousMeals = [...meals];

        // Optimistic update
        setMeals(currentMeals => currentMeals.map(meal => {
            if (meal.id !== mealId) return meal;
            const reordered = orderedRecipeIds
                .map(rid => meal.recipes.find(mr => mr.recipe_id === rid))
                .filter((mr): mr is (typeof meal.recipes)[0] => mr !== undefined)
                .map((mr, index) => ({ ...mr, sort_order: index }));
            return { ...meal, recipes: reordered };
        }));

        try {
            const meal = previousMeals.find(m => m.id === mealId);
            if (!meal) return false;

            const dbMealRecipes = meal.recipes.map(r => ({
                id: r.id,
                meal_id: r.meal_id,
                recipe_id: r.recipe_id,
                user_id: r.user_id,
                sort_order: r.sort_order,
                is_completed: r.is_completed,
                created_at: r.created_at,
                updated_at: r.updated_at
            }));

            await mealService.reorderMealRecipes(mealId, orderedRecipeIds, dbMealRecipes);

            return true;
        } catch (err) {
            console.error('Error reordering meal recipes:', err);
            setMeals(previousMeals);
            return false;
        }
    };

    const copyWeekMeals = async (
        fromWeekStart: Date,
        toWeekStart: Date
    ): Promise<{ copied: number; skipped: number }> => {
        if (!user) return { copied: 0, skipped: 0 };

        const { copied, skipped } = await mealService.copyWeekMeals(user.id, fromWeekStart, toWeekStart, meals);

        if (copied > 0) {
            track('week_copied', { copied, skipped });
            await loadMeals();
        }

        return { copied, skipped };
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
        toggleRecipeCompletion,
        reorderMealRecipes,
        copyWeekMeals,
    };
}
