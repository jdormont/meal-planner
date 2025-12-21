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
        <div className="max-w-2xl w-full bg-cream-50 rounded-3xl shadow-xl p-12 border border-sage-200">
          <div className="text-center mb-10">
            <div className="inline-flex p-5 bg-gradient-to-br from-warmtan-100 to-cream-100 rounded-full mb-6 shadow-sm">
              <Calendar className="w-16 h-16 text-warmtan-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to plan your first meal?
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Group recipes together for dinner parties, weekly meal prep, or special occasions.
            </p>

            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="group relative inline-flex items-center gap-3 bg-gradient-to-br from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white rounded-xl px-8 py-4 transition-all transform hover:scale-105 hover:shadow-xl font-semibold text-lg"
              >
                <Plus className="w-6 h-6" />
                Create Your First Meal Plan
                <Sparkles className="w-5 h-5 animate-pulse" />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors" />
              </button>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-sage-200">
            <div className="text-sm text-gray-600 space-y-3">
              <p className="font-semibold text-gray-900 mb-4 text-center">With meal planning you can:</p>
              <ul className="space-y-3 text-left max-w-lg mx-auto">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Organize multiple recipes for specific dates and events</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Track cooking progress as you prepare each dish</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Plan ahead for stress-free hosting and meal prep</span>
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
