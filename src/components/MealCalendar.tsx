import React, { useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, ChefHat } from 'lucide-react';
import { MealWithRecipes } from '../lib/supabase';

type MealCalendarProps = {
  meals: MealWithRecipes[];
  onMoveMeal?: (mealId: string, newDate: string) => void;
  onMealClick: (meal: MealWithRecipes) => void;
};

export function MealCalendar({ meals, onMoveMeal, onMealClick }: MealCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth, startDayOfWeek]);

  const getMealsForDate = (date: Date | null): MealWithRecipes[] => {
    if (!date) return [];

    const dateStr = date.toISOString().split('T')[0];
    return meals.filter(meal => meal.date === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const upcomingMeals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return meals
      .filter(meal => {
        const mealDate = new Date(meal.date);
        mealDate.setHours(0, 0, 0, 0);
        return mealDate >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [meals]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-terracotta-600" />
          <h2 className="text-2xl font-bold text-gray-900">Meal Calendar</h2>
        </div>
        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm font-medium text-terracotta-600 hover:bg-terracotta-50 rounded-lg transition"
        >
          Today
        </button>
      </div>

      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-sage-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">{monthName}</h3>
          <div className="flex gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-sage-100 rounded-lg transition"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-sage-100 rounded-lg transition"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-sage-200 rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="bg-sage-50 px-2 py-3 text-center text-xs font-semibold text-gray-600"
            >
              {day}
            </div>
          ))}

          {calendarDays.map((date, index) => {
            const mealsForDay = getMealsForDate(date);
            const isCurrentDay = isToday(date);
            const isPast = isPastDate(date);

            return (
              <div
                key={index}
                className={`bg-white min-h-[120px] p-2 ${
                  date ? 'cursor-pointer hover:bg-cream-100 transition' : ''
                } ${isCurrentDay ? 'ring-2 ring-terracotta-500 ring-inset' : ''}`}
              >
                {date && (
                  <>
                    <div
                      className={`text-sm font-medium mb-2 ${
                        isCurrentDay
                          ? 'text-terracotta-600'
                          : isPast
                          ? 'text-gray-400'
                          : 'text-gray-700'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {mealsForDay.map(meal => (
                        <button
                          key={meal.id}
                          onClick={() => onMealClick(meal)}
                          className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition truncate ${
                            isPast
                              ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              : 'bg-terracotta-100 text-terracotta-700 hover:bg-terracotta-200'
                          }`}
                          title={meal.name}
                        >
                          <div className="flex items-center gap-1">
                            <ChefHat className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{meal.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-sage-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Meals</h3>
          <Clock className="w-5 h-5 text-sage-600" />
        </div>

        {upcomingMeals.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No upcoming meals planned</p>
            <p className="text-gray-400 text-xs mt-1">Tap the + button to create your first meal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeals.map(meal => {
              const mealDate = new Date(meal.date);
              const dateStr = mealDate.toLocaleDateString('default', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const isCurrentDay = isToday(mealDate);

              return (
                <button
                  key={meal.id}
                  onClick={() => onMealClick(meal)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${
                    isCurrentDay
                      ? 'border-terracotta-500 bg-terracotta-50'
                      : 'border-sage-200 bg-white hover:bg-sage-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{meal.name}</h4>
                      {meal.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{meal.description}</p>
                      )}
                    </div>
                    <div
                      className={`text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap ${
                        isCurrentDay
                          ? 'bg-terracotta-600 text-white'
                          : 'bg-sage-100 text-sage-700'
                      }`}
                    >
                      {dateStr}
                    </div>
                  </div>

                  {meal.recipes.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <ChefHat className="w-4 h-4" />
                      <span>
                        {meal.recipes.length} {meal.recipes.length === 1 ? 'recipe' : 'recipes'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
