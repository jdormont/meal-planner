import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useMeals } from '../hooks/useMeals';
import { useRecipes } from '../hooks/useRecipes';
import { MealCalendar, MealType } from '../components/MealCalendar';
import { MealList } from '../components/MealList';
import { MealForm } from '../components/MealForm';
import { MealDetail } from '../components/MealDetail';
import { RecipeDetail } from '../components/RecipeDetail';
import { recipeService } from '../services/recipeService';
import { Meal, Recipe } from '../lib/supabase';
import { Calendar, Loader2 } from 'lucide-react';
import { subWeeks } from 'date-fns';

export function PlannerPage() {
  const [location, setLocation] = useLocation();

  // Sub-routes for overlays
  const [matchNew] = useRoute('/meals/new');
  const [matchDetail, paramsDetail] = useRoute('/meals/:id');
  const [matchEdit, paramsEdit] = useRoute('/meals/:id/edit');
  const [matchRecipe, paramsRecipe] = useRoute('/recipes/:id');

  const {
    meals,
    loading: mealsLoading,
    saveMeal,
    deleteMeal,
    moveMeal,
    removeRecipeFromMeal,
    toggleRecipeCompletion,
    reorderMealRecipes,
    copyWeekMeals,
  } = useMeals();

  const {
    recipes,
    communityRecipes,
    copyRecipe,
  } = useRecipes();

  const isCollectionsView = location.startsWith('/planner/collections');

  // Filter meals for "Collections" view (is_event = true)
  const collectionMeals = meals.filter(meal => meal.is_event);
  const calendarMeals = meals.filter(meal => !meal.is_event);

  const activeMeal = meals.find(m => m.id === (paramsDetail?.id || paramsEdit?.id)) || null;

  const handleSaveMeal = async (
    mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    recipeIds: string[]
  ) => {
    const success = await saveMeal(mealData, recipeIds, paramsEdit?.id);
    if (success) {
      setLocation(isCollectionsView ? '/collections' : '/');
    } else {
      alert('Failed to save meal. Please try again.');
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (confirm('Are you sure you want to delete this meal?')) {
      const success = await deleteMeal(id);
      if (success) {
        setLocation(isCollectionsView ? '/collections' : '/');
      } else {
        alert('Failed to delete meal. Please try again.');
      }
    }
  };

  const handleToggleRecipeCompletion = async (mealRecipeId: string, isCompleted: boolean) => {
    await toggleRecipeCompletion(mealRecipeId, isCompleted);
  };

  const handleCopyRecipe = async (recipe: Recipe) => {
    const success = await copyRecipe(recipe);
    if (success) {
      alert('Recipe copied to your collection!');
    }
  };

  // Get defaults for new meals from query params
  const searchParams = new URLSearchParams(window.location.search);
  const defaultDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const defaultType = (searchParams.get('type') || 'dinner') as MealType;

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setLocation('/')}
          className={`px-4 py-2 rounded-lg font-medium transition ${!isCollectionsView
            ? 'bg-terracotta-500 text-white shadow-sm'
            : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
        >
          Weekly Plan
        </button>
        <button
          onClick={() => setLocation('/collections')}
          className={`px-4 py-2 rounded-lg font-medium transition ${isCollectionsView
            ? 'bg-terracotta-500 text-white shadow-sm'
            : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
        >
          Collections
        </button>
      </div>

      {mealsLoading && meals.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-terracotta-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your meals...</p>
        </div>
      ) : !isCollectionsView ? (
        <MealCalendar
          meals={calendarMeals}
          onMoveMeal={moveMeal}
          onAddMeal={(date, type) => setLocation(`/meals/new?date=${date}&type=${type}`)}
          onMealClick={(meal) => setLocation(`/meals/${meal.id}`)}
          onRecipeClick={(recipe) => setLocation(`/recipes/${recipe.id}`)}
          onRemoveRecipe={removeRecipeFromMeal}
          onCopyPreviousWeek={async (toWeekStart) =>
            copyWeekMeals(subWeeks(toWeekStart, 1), toWeekStart)
          }
        />
      ) : (
        <MealList
          meals={collectionMeals}
          onSelect={(meal) => setLocation(`/meals/${meal.id}`)}
          onCreateNew={() => setLocation('/meals/new')}
        />
      )}

      {/* New Meal Modal Overlay */}
      {matchNew && (
        <MealForm
          meal={null}
          recipes={[...recipes, ...communityRecipes]}
          selectedRecipeIds={[]}
          onSave={handleSaveMeal}
          onCancel={() => setLocation(isCollectionsView ? '/collections' : '/')}
          initialDate={defaultDate}
          initialMealType={defaultType}
        />
      )}

      {/* Edit Meal Modal Overlay */}
      {matchEdit && activeMeal && (
        <MealForm
          meal={activeMeal}
          recipes={[...recipes, ...communityRecipes]}
          selectedRecipeIds={activeMeal.recipes.map(mr => mr.recipe_id)}
          onSave={handleSaveMeal}
          onCancel={() => setLocation(`/meals/${activeMeal.id}`)}
          initialDate={activeMeal.date}
          initialMealType={activeMeal.meal_type}
        />
      )}

      {/* Meal Detail Modal Overlay */}
      {matchDetail && activeMeal && (
        <MealDetail
          meal={activeMeal}
          onClose={() => setLocation(isCollectionsView ? '/collections' : '/')}
          onToggleRecipeCompletion={handleToggleRecipeCompletion}
          onViewRecipe={(recipe) => setLocation(`/recipes/${recipe.id}`)}
          onEdit={() => setLocation(`/meals/${activeMeal.id}/edit`)}
          onDelete={() => handleDeleteMeal(activeMeal.id)}
          onReorderRecipes={reorderMealRecipes}
        />
      )}

      {/* Recipe Detail Modal Overlay from Planner */}
      {matchRecipe && paramsRecipe?.id && (
        <RecipeDetailWrapper
          recipeId={paramsRecipe.id}
          onClose={() => setLocation(isCollectionsView ? '/collections' : '/')}
          onCopy={handleCopyRecipe}
          onEdit={() => setLocation(`~/recipes/${paramsRecipe.id}/edit`)}
        />
      )}
    </div>
  );
}

// Wrapper to fetch and display recipe details for deep linking
function RecipeDetailWrapper({ recipeId, onClose, onCopy, onEdit }: { recipeId: string; onClose: () => void; onCopy: (recipe: Recipe) => void; onEdit: () => void }) {
  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => recipeService.getRecipe(recipeId),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <Loader2 className="w-8 h-8 text-terracotta-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading recipe details...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <p className="text-red-600 font-semibold mb-4">Failed to load recipe details.</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <RecipeDetail
      recipe={recipe}
      onClose={onClose}
      onEdit={onEdit}
      onCopy={onCopy}
      onOpenRecipe={(r) => onCopy(r)}
    />
  );
}
