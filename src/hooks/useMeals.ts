import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Meal, MealWithRecipes, DbMealRecipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from './useAnalytics';
import { mealService } from '../services/mealService';

export function useMeals() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { track } = useAnalytics();

    // Fetch meals using React Query
    const {
        data: meals = [],
        isLoading,
        error: queryError,
    } = useQuery({
        queryKey: ['meals', user?.id],
        queryFn: async () => {
            if (!user) return [];
            return mealService.getMeals(user.id);
        },
        enabled: !!user,
    });

    const loading = isLoading;
    const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load meals') : null;

    const loadMeals = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['meals', user?.id] });
    }, [queryClient, user?.id]);

    const saveMealMutation = useMutation({
        mutationFn: async ({ mealData, recipeIds, editingMealId }: { mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>; recipeIds: string[]; editingMealId?: string }) => {
            if (!user) throw new Error('Not authenticated');
            return mealService.saveMeal(user.id, mealData, recipeIds, editingMealId);
        },
        onSuccess: (_, variables) => {
            const { mealData, recipeIds, editingMealId } = variables;
            if (!editingMealId) {
                track('meal_scheduled', {
                    date: mealData.date,
                    meal_type: mealData.meal_type,
                    count: recipeIds.length,
                    is_new: true
                });
            }
            queryClient.invalidateQueries({ queryKey: ['meals', user?.id] });
        }
    });

    const saveMeal = async (
        mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
        recipeIds: string[],
        editingMealId?: string
    ) => {
        try {
            await saveMealMutation.mutateAsync({ mealData, recipeIds, editingMealId });
            return true;
        } catch (err) {
            console.error('Error saving meal:', err);
            return false;
        }
    };

    const deleteMealMutation = useMutation({
        mutationFn: (id: string) => mealService.deleteMeal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meals', user?.id] });
        }
    });

    const deleteMeal = async (id: string) => {
        try {
            await deleteMealMutation.mutateAsync(id);
            return true;
        } catch (err) {
            console.error('Error deleting meal:', err);
            return false;
        }
    };

    const toggleRecipeCompletionMutation = useMutation({
        mutationFn: ({ mealRecipeId, isCompleted }: { mealRecipeId: string; isCompleted: boolean }) =>
            mealService.toggleRecipeCompletion(mealRecipeId, isCompleted),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meals', user?.id] });
        }
    });

    const toggleRecipeCompletion = async (mealRecipeId: string, isCompleted: boolean) => {
        try {
            await toggleRecipeCompletionMutation.mutateAsync({ mealRecipeId, isCompleted });
            return true;
        } catch (err) {
            console.error('Error toggling recipe completion:', err);
            return false;
        }
    };

    const removeRecipeFromMealMutation = useMutation({
        mutationFn: async ({ mealId, recipeId, mealRecipesCount }: { mealId: string; recipeId: string; mealRecipesCount: number }) =>
            mealService.removeRecipeFromMeal(mealId, recipeId, mealRecipesCount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meals', user?.id] });
        }
    });

    const removeRecipeFromMeal = async (mealId: string, recipeId: string) => {
        const meal = meals.find(m => m.id === mealId);
        if (!meal) return false;

        try {
            await removeRecipeFromMealMutation.mutateAsync({ mealId, recipeId, mealRecipesCount: meal.recipes.length });
            return true;
        } catch (err) {
            console.error('Error removing recipe from meal:', err);
            return false;
        }
    };

    // Optimistic UI updates for moveMeal
    const moveMealMutation = useMutation({
        mutationFn: ({ mealId, newDate, newType }: { mealId: string; newDate: string; newType: string }) =>
            mealService.moveMeal(mealId, newDate, newType),
        onMutate: async ({ mealId, newDate, newType }) => {
            await queryClient.cancelQueries({ queryKey: ['meals', user?.id] });
            const previousMeals = queryClient.getQueryData<MealWithRecipes[]>(['meals', user?.id]);

            queryClient.setQueryData<MealWithRecipes[]>(['meals', user?.id], (old) => {
                if (!old) return [];
                return old.map(meal =>
                    meal.id === mealId
                        ? { ...meal, date: newDate, meal_type: newType as Meal['meal_type'] }
                        : meal
                );
            });

            return { previousMeals };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousMeals) {
                queryClient.setQueryData(['meals', user?.id], context.previousMeals);
            }
        },
        onSuccess: (_, variables) => {
            track('meal_scheduled', {
                date: variables.newDate,
                meal_type: variables.newType,
                is_move: true
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['meals', user?.id] });
        }
    });

    const moveMeal = async (mealId: string, newDate: string, newType: string) => {
        try {
            await moveMealMutation.mutateAsync({ mealId, newDate, newType });
            return true;
        } catch (err) {
            console.error('Error moving meal:', err);
            return false;
        }
    };

    const reorderMealRecipesMutation = useMutation({
        mutationFn: ({ mealId, orderedRecipeIds, dbMealRecipes }: { mealId: string; orderedRecipeIds: string[]; dbMealRecipes: DbMealRecipe[] }) =>
            mealService.reorderMealRecipes(mealId, orderedRecipeIds, dbMealRecipes),
        onMutate: async ({ mealId, orderedRecipeIds }) => {
            await queryClient.cancelQueries({ queryKey: ['meals', user?.id] });
            const previousMeals = queryClient.getQueryData<MealWithRecipes[]>(['meals', user?.id]);

            queryClient.setQueryData<MealWithRecipes[]>(['meals', user?.id], (old) => {
                if (!old) return [];
                return old.map(meal => {
                    if (meal.id !== mealId) return meal;
                    const reordered = orderedRecipeIds
                        .map(rid => meal.recipes.find(mr => mr.recipe_id === rid))
                        .filter((mr): mr is (typeof meal.recipes)[0] => mr !== undefined)
                        .map((mr, index) => ({ ...mr, sort_order: index }));
                    return { ...meal, recipes: reordered };
                });
            });

            return { previousMeals };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousMeals) {
                queryClient.setQueryData(['meals', user?.id], context.previousMeals);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['meals', user?.id] });
        }
    });

    const reorderMealRecipes = async (mealId: string, orderedRecipeIds: string[]): Promise<boolean> => {
        try {
            const previousMeals = queryClient.getQueryData<MealWithRecipes[]>(['meals', user?.id]) || [];
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

            await reorderMealRecipesMutation.mutateAsync({ mealId, orderedRecipeIds, dbMealRecipes });
            return true;
        } catch (err) {
            console.error('Error reordering meal recipes:', err);
            return false;
        }
    };

    const copyWeekMealsMutation = useMutation({
        mutationFn: async ({ fromWeekStart, toWeekStart }: { fromWeekStart: Date; toWeekStart: Date }) => {
            if (!user) throw new Error('Not authenticated');
            return mealService.copyWeekMeals(user.id, fromWeekStart, toWeekStart, meals);
        },
        onSuccess: (data) => {
            if (data.copied > 0) {
                track('week_copied', { copied: data.copied, skipped: data.skipped });
            }
            queryClient.invalidateQueries({ queryKey: ['meals', user?.id] });
        }
    });

    const copyWeekMeals = async (
        fromWeekStart: Date,
        toWeekStart: Date
    ): Promise<{ copied: number; skipped: number }> => {
        try {
            return await copyWeekMealsMutation.mutateAsync({ fromWeekStart, toWeekStart });
        } catch (err) {
            console.error('Error copying week meals:', err);
            return { copied: 0, skipped: 0 };
        }
    };

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
