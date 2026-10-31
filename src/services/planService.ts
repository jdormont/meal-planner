import { recipeService } from './recipeService';
import { mealService } from './mealService';
import { parseIngredient } from '../utils/recipeParser';
import type { RecipeSuggestion } from '../components/RecipeSuggestionCard';

export type PlanItem = {
  suggestion: RecipeSuggestion;
  /** yyyy-MM-dd */
  date: string;
};

export type AddToPlanResult = {
  added: number;
  failed: string[];
};

/**
 * Turns chat suggestions into saved recipes and schedules each one as a dinner
 * on the given date. Suggestions without full details are saved as stubs
 * (title + description); the user can open the recipe to generate the rest.
 */
export async function addSuggestionsToPlanner(
  userId: string,
  items: PlanItem[]
): Promise<AddToPlanResult> {
  const result: AddToPlanResult = { added: 0, failed: [] };

  for (const { suggestion, date } of items) {
    let recipeId: string | null = null;
    try {
      const recipe = await recipeService.saveRecipe(userId, {
        title: suggestion.title,
        description: suggestion.description || '',
        ingredients: (suggestion.full_details?.ingredients ?? []).map((line) => parseIngredient(line)),
        instructions: suggestion.full_details?.instructions ?? [],
        total_time: parseInt(suggestion.time_estimate) || 0,
        servings: 4,
        tags: ['AI Generated', suggestion.cuisine].filter(Boolean) as string[],
        image_url: suggestion.image_url || '',
        source_url: '',
        notes: suggestion.reason_for_recommendation || '',
        is_shared: false,
        recipe_type: 'food',
      });
      recipeId = recipe.id;

      await mealService.saveMeal(
        userId,
        {
          name: suggestion.title,
          date,
          meal_type: 'dinner',
          is_event: false,
          description: suggestion.description || '',
          notes: '',
          is_archived: false,
        },
        [recipe.id]
      );
      result.added += 1;
    } catch (error) {
      console.error('Failed to add suggestion to planner:', suggestion.title, error);
      result.failed.push(suggestion.title);
      // Don't leave an orphaned recipe if scheduling failed.
      if (recipeId) {
        await recipeService.deleteRecipe(recipeId).catch(() => {});
      }
    }
  }

  return result;
}
