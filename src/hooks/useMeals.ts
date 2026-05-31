import { useState, useEffect, useCallback } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { supabase, Meal, MealWithRecipes } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from './useAnalytics';

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
            const { data: mealsData, error: mealsError } = await supabase
                .from('meals')
                .select('*, meal_recipes:meal_recipes(*, recipe:recipes(*))')
                .eq('is_archived', false)
                .order('date', { ascending: true })
                .order('sort_order', { referencedTable: 'meal_recipes', ascending: true });

            if (mealsError) throw mealsError;

            const mealsWithRecipes: MealWithRecipes[] = (mealsData || []).map((meal) => {
                const { meal_recipes, ...mealFields } = meal as typeof meal & { meal_recipes: MealWithRecipes['recipes'] };
                return { ...mealFields, recipes: meal_recipes || [] };
            });

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

                track('meal_scheduled', {
                    date: mealData.date,
                    meal_type: mealData.meal_type,
                    count: recipeIds.length,
                    is_new: true
                });
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
                ? { ...meal, date: newDate, meal_type: newType as Meal['meal_type'] }
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

            await Promise.all(
                orderedRecipeIds.map((recipeId, index) => {
                    const mr = meal.recipes.find(r => r.recipe_id === recipeId);
                    if (!mr) return Promise.resolve();
                    return supabase
                        .from('meal_recipes')
                        .update({ sort_order: index, updated_at: new Date().toISOString() })
                        .eq('id', mr.id);
                })
            );

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

        // Build the 7 source dates
        const sourceDates = Array.from({ length: 7 }, (_, i) =>
            format(addDays(fromWeekStart, i), 'yyyy-MM-dd')
        );

        const sourceMeals = meals.filter(m => sourceDates.includes(m.date) && !m.is_event);

        if (sourceMeals.length === 0) return { copied: 0, skipped: 0 };

        // Build target date set to detect conflicts
        const targetDates = Array.from({ length: 7 }, (_, i) =>
            format(addDays(toWeekStart, i), 'yyyy-MM-dd')
        );
        const existingSlots = new Set(
            meals
                .filter(m => targetDates.includes(m.date) && !m.is_event)
                .map(m => `${m.date}::${m.meal_type}`)
        );

        let copied = 0;
        let skipped = 0;

        for (const source of sourceMeals) {
            const targetDate = format(
                addDays(parseISO(source.date), 7),
                'yyyy-MM-dd'
            );
            const slot = `${targetDate}::${source.meal_type}`;

            if (existingSlots.has(slot)) {
                skipped++;
                continue;
            }

            try {
                const { data: newMeal, error: mealError } = await supabase
                    .from('meals')
                    .insert({
                        user_id: user.id,
                        name: source.name,
                        date: targetDate,
                        meal_type: source.meal_type,
                        is_event: false,
                        description: source.description,
                        notes: source.notes,
                        is_archived: false,
                    })
                    .select()
                    .single();

                if (mealError || !newMeal) {
                    skipped++;
                    continue;
                }

                if (source.recipes.length > 0) {
                    const mealRecipes = source.recipes.map((mr, index) => ({
                        meal_id: newMeal.id,
                        recipe_id: mr.recipe_id,
                        user_id: user.id,
                        sort_order: index,
                        is_completed: false,
                    }));

                    const { error: mrError } = await supabase
                        .from('meal_recipes')
                        .insert(mealRecipes);

                    if (mrError) {
                        // Cleanup orphaned meal if recipes failed
                        await supabase.from('meals').delete().eq('id', newMeal.id);
                        skipped++;
                        continue;
                    }
                }

                copied++;
                existingSlots.add(slot);
            } catch (err) {
                console.error('Error copying meal:', err);
                skipped++;
            }
        }

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
