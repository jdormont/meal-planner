import { addDays, format, parseISO } from 'date-fns';
import { supabase, Meal, MealWithRecipes, WeeklyMealSet, DbMeal, DbRecipe, DbMealRecipe, DbMealInsert, DbMealUpdate, DbMealRecipeInsert } from '../lib/supabase';
import { mapMeal } from '../lib/mappers';

export const mealService = {
  /**
   * Fetches active meals for a user with their associated recipes.
   */
  async getMeals(userId: string): Promise<MealWithRecipes[]> {
    const { data, error } = await supabase
      .from('meals')
      .select('*, meal_recipes:meal_recipes(*, recipe:recipes(*))')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('date', { ascending: true })
      .order('sort_order', { referencedTable: 'meal_recipes', ascending: true });

    if (error) throw error;

    return (data || []).map((meal) => {
      const mealRecipes = (meal as { meal_recipes?: unknown }).meal_recipes;
      const recipeRows = Array.isArray(mealRecipes) ? mealRecipes : [];
      return mapMeal(
        meal as unknown as DbMeal,
        recipeRows as unknown as (DbMealRecipe & { recipe: DbRecipe | null })[]
      );
    });
  },

  /**
   * Creates or updates a meal and updates its recipe associations.
   */
  async saveMeal(
    userId: string,
    mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    recipeIds: string[],
    editingMealId?: string
  ): Promise<string> {
    let mealId: string;

    const dbPayload: DbMealInsert | DbMealUpdate = {
      name: mealData.name,
      date: mealData.date,
      meal_type: mealData.meal_type,
      is_event: mealData.is_event,
      description: mealData.description,
      notes: mealData.notes,
      is_archived: mealData.is_archived,
      updated_at: new Date().toISOString()
    };

    if (editingMealId) {
      const { error } = await supabase
        .from('meals')
        .update(dbPayload as DbMealUpdate)
        .eq('id', editingMealId);

      if (error) throw error;
      mealId = editingMealId;

      // Delete old associations
      const { error: deleteError } = await supabase
        .from('meal_recipes')
        .delete()
        .eq('meal_id', mealId);

      if (deleteError) throw deleteError;
    } else {
      const insertPayload: DbMealInsert = {
        name: mealData.name,
        user_id: userId,
        date: mealData.date,
        meal_type: mealData.meal_type,
        is_event: mealData.is_event,
        description: mealData.description || null,
        notes: mealData.notes || null,
        is_archived: mealData.is_archived,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('meals')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      mealId = data.id;
    }

    // Insert new associations
    if (recipeIds.length > 0) {
      const mealRecipes: DbMealRecipeInsert[] = recipeIds.map((recipeId, index) => ({
        meal_id: mealId,
        recipe_id: recipeId,
        user_id: userId,
        sort_order: index,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: mrError } = await supabase
        .from('meal_recipes')
        .insert(mealRecipes);

      if (mrError) throw mrError;
    }

    return mealId;
  },

  /**
   * Deletes a meal.
   */
  async deleteMeal(mealId: string): Promise<void> {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (error) throw error;
  },

  /**
   * Toggles recipe completion state.
   */
  async toggleRecipeCompletion(mealRecipeId: string, isCompleted: boolean): Promise<void> {
    const { error } = await supabase
      .from('meal_recipes')
      .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
      .eq('id', mealRecipeId);

    if (error) throw error;
  },

  /**
   * Adds a recipe to an existing meal.
   */
  async addRecipeToMeal(userId: string, mealId: string, recipeId: string): Promise<void> {
    const { data: existingMealRecipes, error: fetchError } = await supabase
      .from('meal_recipes')
      .select('sort_order')
      .eq('meal_id', mealId)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    const nextSortOrder = existingMealRecipes && existingMealRecipes.length > 0
      ? (existingMealRecipes[0].sort_order ?? 0) + 1
      : 0;

    const { error: insertError } = await supabase
      .from('meal_recipes')
      .insert({
        meal_id: mealId,
        recipe_id: recipeId,
        user_id: userId,
        sort_order: nextSortOrder,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) throw insertError;
  },

  /**
   * Removes a recipe from a meal. If it is the last recipe, deletes the meal.
   */
  async removeRecipeFromMeal(mealId: string, recipeId: string, currentRecipesCount: number): Promise<boolean> {
    if (currentRecipesCount <= 1) {
      await this.deleteMeal(mealId);
      return true; // Meal deleted
    }

    const { error } = await supabase
      .from('meal_recipes')
      .delete()
      .eq('meal_id', mealId)
      .eq('recipe_id', recipeId);

    if (error) throw error;
    return false; // Meal kept
  },

  /**
   * Moves a meal to a new slot (date + type).
   */
  async moveMeal(mealId: string, newDate: string, newType: string): Promise<void> {
    const { error } = await supabase
      .from('meals')
      .update({
        date: newDate,
        meal_type: newType,
        updated_at: new Date().toISOString()
      })
      .eq('id', mealId);

    if (error) throw error;
  },

  /**
   * Reorders recipes in a meal.
   */
  async reorderMealRecipes(_mealId: string, orderedRecipeIds: string[], mealRecipes: DbMealRecipe[]): Promise<void> {
    await Promise.all(
      orderedRecipeIds.map((recipeId, index) => {
        const mr = mealRecipes.find(r => r.recipe_id === recipeId);
        if (!mr) return Promise.resolve();
        return supabase
          .from('meal_recipes')
          .update({ sort_order: index, updated_at: new Date().toISOString() })
          .eq('id', mr.id);
      })
    );
  },

  /**
   * Copies meal plans from one week to another week.
   */
  async copyWeekMeals(
    userId: string,
    fromWeekStart: Date,
    toWeekStart: Date,
    allMeals: MealWithRecipes[]
  ): Promise<{ copied: number; skipped: number }> {
    const sourceDates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(fromWeekStart, i), 'yyyy-MM-dd')
    );

    const sourceMeals = allMeals.filter(m => sourceDates.includes(m.date) && !m.is_event);
    if (sourceMeals.length === 0) return { copied: 0, skipped: 0 };

    const targetDates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(toWeekStart, i), 'yyyy-MM-dd')
    );

    const existingSlots = new Set(
      allMeals
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
            user_id: userId,
            name: source.name,
            date: targetDate,
            meal_type: source.meal_type,
            is_event: false,
            description: source.description,
            notes: source.notes,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (mealError || !newMeal) {
          skipped++;
          continue;
        }

        if (source.recipes.length > 0) {
          const mealRecipes: DbMealRecipeInsert[] = source.recipes.map((mr, index) => ({
            meal_id: newMeal.id,
            recipe_id: mr.recipe_id,
            user_id: userId,
            sort_order: index,
            is_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: mrError } = await supabase
            .from('meal_recipes')
            .insert(mealRecipes);

          if (mrError) {
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

    return { copied, skipped };
  },

  /**
   * Fetches the latest global weekly meal set.
   */
  async getLatestWeeklyMealSet(): Promise<WeeklyMealSet | null> {
    const { data, error } = await supabase
      .from('weekly_meal_sets')
      .select('*')
      .is('user_id', null) // GLOBAL SET
      .order('week_start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      week_start_date: data.week_start_date,
      recipes: (data.recipes as unknown[]) || []
    };
  },

  /**
   * Triggers the weekly-planner edge function to generate a new weekly set.
   */
  async generateWeeklyMealSet(userId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('weekly-planner', {
      body: { userId }
    });

    if (error) throw error;
  },

  /**
   * Submits feedback for a meal suggestion.
   */
  async submitFeedback(
    userId: string,
    targetId: string,
    rating: 'thumbs_up' | 'thumbs_down',
    recipeJson: unknown
  ): Promise<void> {
    const { error } = await supabase.from('meal_feedback').insert({
      user_id: userId,
      target_id: targetId,
      target_type: 'suggestion',
      rating: rating,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      details: { recipe_json: recipeJson } as any
    });

    if (error) throw error;
  }
};
