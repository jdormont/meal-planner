import { MealWithRecipes } from '../lib/supabase';
import { Calendar, ChefHat, CheckCircle2, Circle } from 'lucide-react';

type MealListProps = {
  meals: MealWithRecipes[];
  onSelect: (meal: MealWithRecipes) => void;
};

export function MealList({ meals, onSelect }: MealListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCompletionStats = (meal: MealWithRecipes) => {
    const total = meal.recipes.length;
    const completed = meal.recipes.filter(mr => mr.is_completed).length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  if (meals.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-md">
        <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No meals planned yet</h3>
        <p className="text-gray-600">Create your first meal to start planning!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {meals.map((meal) => {
        const stats = getCompletionStats(meal);
        const isComplete = stats.completed === stats.total && stats.total > 0;

        return (
          <button
            key={meal.id}
            onClick={() => onSelect(meal)}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-left border-2 border-transparent hover:border-orange-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{meal.name}</h3>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Calendar className="w-4 h-4" />
                  {formatDate(meal.date)}
                </div>
              </div>
              {isComplete && (
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              )}
            </div>

            {meal.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{meal.description}</p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-gray-700">
                <ChefHat className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">
                  {stats.total} {stats.total === 1 ? 'recipe' : 'recipes'}
                </span>
              </div>

              {stats.total > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isComplete ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {stats.percentage}%
                  </span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
