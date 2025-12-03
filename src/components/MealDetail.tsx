import { useState } from 'react';
import { MealWithRecipes, Recipe } from '../lib/supabase';
import { X, Calendar, CheckCircle2, Circle, Clock, Users, Eye, Edit2, Trash2 } from 'lucide-react';

type MealDetailProps = {
  meal: MealWithRecipes;
  onClose: () => void;
  onToggleRecipeCompletion: (mealRecipeId: string, isCompleted: boolean) => void;
  onViewRecipe: (recipe: Recipe) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function MealDetail({
  meal,
  onClose,
  onToggleRecipeCompletion,
  onViewRecipe,
  onEdit,
  onDelete
}: MealDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sortedRecipes = [...meal.recipes].sort((a, b) => a.sort_order - b.sort_order);
  const completedCount = sortedRecipes.filter(mr => mr.is_completed).length;
  const totalCount = sortedRecipes.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{meal.name}</h1>
              <div className="flex items-center gap-2 text-orange-100">
                <Calendar className="w-5 h-5" />
                <span className="text-lg">{formatDate(meal.date)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cooking Progress</span>
              <span className="text-lg font-bold">{completedCount} of {totalCount}</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {meal.description && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-gray-700">{meal.description}</p>
            </div>
          )}

          {totalCount === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No recipes added to this meal yet</p>
              <button
                onClick={onEdit}
                className="mt-4 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium"
              >
                Add Recipes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedRecipes.map((mealRecipe) => {
                const recipe = mealRecipe.recipe;
                const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;

                return (
                  <div
                    key={mealRecipe.id}
                    className={`border-2 rounded-xl p-6 transition-all ${
                      mealRecipe.is_completed
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start gap-6">
                      <button
                        onClick={() => onToggleRecipeCompletion(mealRecipe.id, !mealRecipe.is_completed)}
                        className="flex-shrink-0 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg"
                      >
                        {mealRecipe.is_completed ? (
                          <CheckCircle2 className="w-10 h-10 text-green-600" />
                        ) : (
                          <Circle className="w-10 h-10 text-gray-400 hover:text-orange-500 transition" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h3 className={`text-2xl font-bold mb-3 ${
                          mealRecipe.is_completed ? 'text-green-900 line-through' : 'text-gray-900'
                        }`}>
                          {recipe.title}
                        </h3>

                        <div className="flex flex-wrap gap-4 mb-4">
                          {totalTime > 0 && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-5 h-5 text-orange-600" />
                              <span className="font-medium">{totalTime} min</span>
                            </div>
                          )}
                          {recipe.servings > 0 && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Users className="w-5 h-5 text-orange-600" />
                              <span className="font-medium">{recipe.servings} servings</span>
                            </div>
                          )}
                        </div>

                        {recipe.description && (
                          <p className="text-gray-600 mb-4 line-clamp-2">{recipe.description}</p>
                        )}

                        <button
                          onClick={() => onViewRecipe(recipe)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium text-lg"
                        >
                          <Eye className="w-5 h-5" />
                          View Full Recipe
                        </button>
                      </div>

                      {recipe.image_url && (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-32 h-32 object-cover rounded-lg flex-shrink-0 hidden sm:block"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {meal.notes && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Planning Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{meal.notes}</p>
            </div>
          )}
        </div>

        <div className="border-t bg-gray-50 p-6">
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Edit Meal
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition font-medium flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Meal?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{meal.name}"? This will not delete the recipes themselves, only the meal plan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
              >
                Delete Meal
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
