import { MealWithRecipes } from '../lib/supabase';
import { Calendar, ChefHat, CheckCircle2, Circle, Plus, Sparkles } from 'lucide-react';

type MealListProps = {
  meals: MealWithRecipes[];
  onSelect: (meal: MealWithRecipes) => void;
  onCreateNew?: () => void;
};

export function MealList({ meals, onSelect, onCreateNew }: MealListProps) {
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
      <div className="flex items-center justify-center py-16">
        <div className="max-w-xl w-full bg-cream-50 rounded-3xl shadow-lg p-12 texture-subtle">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-terracotta-100 to-cream-100 rounded-full mb-6">
              <Calendar className="w-16 h-16 text-terracotta-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Start Planning Your Meals
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Organize your recipes into meal plans to stay on track with your cooking goals
            </p>

            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="group relative inline-flex items-center gap-3 bg-gradient-to-br from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white rounded-xl px-8 py-4 transition-all transform hover:scale-105 hover:shadow-xl font-semibold text-lg"
              >
                <Plus className="w-6 h-6" />
                Create Your First Meal
                <Sparkles className="w-5 h-5" />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors" />
              </button>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium text-gray-900 mb-3">With meal planning you can:</p>
              <ul className="space-y-2 text-left max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Organize recipes for specific dates and events</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Track which recipes you've completed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Stay organized with your cooking schedule</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
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
