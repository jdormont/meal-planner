import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Coffee, Sun, Moon, X } from 'lucide-react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, subWeeks, isSameDay, isToday as isDateToday, startOfDay } from 'date-fns';
import { MealWithRecipes, Recipe } from '../lib/supabase';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DraggableMeal } from './DraggableMeal';
import { DroppableSlot } from './DroppableSlot';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

type MealCalendarProps = {
  meals: MealWithRecipes[];
  onMoveMeal?: (mealId: string, newDate: string, newMealType: MealType) => void;
  onAddMeal: (date: string, mealType: MealType) => void;
  onMealClick?: (meal: MealWithRecipes) => void;
  onRecipeClick?: (recipe: Recipe) => void;
  onRemoveRecipe?: (mealId: string, recipeId: string) => void;
};

const MEAL_TYPES: { type: MealType; label: string; icon: React.ReactNode }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: <Coffee className="w-4 h-4" /> },
  { type: 'lunch', label: 'Lunch', icon: <Sun className="w-4 h-4" /> },
  { type: 'dinner', label: 'Dinner', icon: <Moon className="w-4 h-4" /> },
];

export function MealCalendar({ meals, onMoveMeal, onAddMeal, onMealClick, onRecipeClick, onRemoveRecipe }: MealCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = React.useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const mealId = active.id.toString().replace('meal-', '');
    const [dateStr, type] = over.id.toString().split('::');

    if (mealId && dateStr && type) {
      // Find the meal to verify it actually moved
      const meal = meals.find(m => m.id === mealId);
      if (meal && (meal.date !== dateStr || meal.meal_type !== type)) {
        onMoveMeal?.(mealId, dateStr, type as MealType);
      }
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const isCurrentWeek = isSameDay(currentWeekStart, startOfWeek(new Date(), { weekStartsOn: 0 }));

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-terracotta-600" />
            <h2 className="text-2xl font-bold text-gray-900">Weekly Meal Plan</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-sage-100 rounded-lg transition"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={goToToday}
              disabled={isCurrentWeek}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${isCurrentWeek
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-terracotta-600 hover:bg-terracotta-50'
                }`}
            >
              This Week
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-sage-100 rounded-lg transition"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 text-center md:text-left">
          {format(currentWeekStart, 'MMMM d')} - {format(weekDays[6], 'MMMM d, yyyy')}
        </div>

        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-sage-200 overflow-hidden">
          <div className="grid grid-cols-8 divide-x divide-sage-200">
            <div className="bg-sage-50 p-4">
              <div className="text-sm font-semibold text-gray-600">Meal</div>
            </div>
            {weekDays.map(day => (
              <div
                key={day.toISOString()}
                className={`p-4 ${isDateToday(day) ? 'bg-terracotta-50' : 'bg-sage-50'
                  }`}
              >
                <div className="text-center">
                  <div className={`text-xs font-semibold uppercase ${isDateToday(day) ? 'text-terracotta-600' : 'text-gray-600'
                    }`}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${isDateToday(day) ? 'text-terracotta-700' : 'text-gray-900'
                    }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="divide-y divide-sage-200">
            {MEAL_TYPES.map(({ type, label, icon }) => (
              <div key={type} className="grid grid-cols-8 divide-x divide-sage-200">
                <div className="bg-sage-50 p-4 flex items-center gap-2">
                  <div className="text-sage-600">{icon}</div>
                  <div className="text-sm font-medium text-gray-700">{label}</div>
                </div>
                {weekDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const slotMeals = meals.filter(meal =>
                    meal.date === dateStr &&
                    meal.meal_type === type
                  );

                  return (
                    <div
                      key={`${day.toISOString()}-${type}`}
                      className={`min-h-[120px] ${isDateToday(day) ? 'bg-cream-50' : 'bg-white'
                        }`}
                    >
                      <DroppableSlot id={`${dateStr}::${type}`}>
                        <div className="p-3 h-full space-y-2">
                          {slotMeals.length > 0 ? (
                            slotMeals.map(meal => (
                              <DraggableMeal key={meal.id} id={`meal-${meal.id}`}>
                                <div className="space-y-2 cursor-grab active:cursor-grabbing">
                                  {meal.recipes.map((mealRecipe) => (
                                    <div
                                      key={mealRecipe.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRecipeClick?.(mealRecipe.recipe);
                                      }}
                                      className="relative group block"
                                    >
                                      <div className="border-2 border-sage-200 rounded-lg p-2 hover:border-terracotta-400 hover:shadow-md transition bg-white">
                                        {mealRecipe.recipe.image_url && (
                                          <div className="w-full aspect-video rounded overflow-hidden mb-2">
                                            <img
                                              src={mealRecipe.recipe.image_url}
                                              alt={mealRecipe.recipe.title}
                                              className="w-full h-full object-cover group-hover:scale-105 transition"
                                            />
                                          </div>
                                        )}
                                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                          {mealRecipe.recipe.title}
                                        </div>
                                      </div>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm('Are you sure you want to remove this recipe from the meal?')) {
                                            onRemoveRecipe?.(meal.id, mealRecipe.recipe_id);
                                          }
                                        }}
                                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50 border border-gray-100"
                                        title="Remove recipe"
                                      >
                                        <X className="w-3 h-3 text-red-500" />
                                      </button>
                                    </div>
                                  ))}
                                  {/* Fallback if no recipes (legacy/edge case) */}
                                  {meal.recipes.length === 0 && (
                                    <div className="border-2 border-sage-200 rounded-lg p-2 bg-white">
                                      <div className="text-sm font-medium text-gray-900">{meal.name}</div>
                                    </div>
                                  )}
                                </div>
                              </DraggableMeal>
                            ))
                          ) : (
                            <button
                              onClick={() => onAddMeal(dateStr, type)}
                              className="w-full h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-sage-200 rounded-lg hover:border-terracotta-400 hover:bg-terracotta-50 transition group"
                            >
                              <Plus className="w-6 h-6 text-gray-400 group-hover:text-terracotta-600 transition" />
                            </button>
                          )}

                          {slotMeals.length > 0 && (
                            <button
                              onClick={() => onAddMeal(dateStr, type)}
                              className="w-full py-1 text-xs text-sage-500 hover:text-terracotta-600 hover:bg-terracotta-50 rounded dash-border border-dashed border border-transparent hover:border-terracotta-300 transition flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add another
                            </button>
                          )}
                        </div>
                      </DroppableSlot>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="md:hidden space-y-4">
          {/* Mobile view not deeply optimized for DND yet, but content renders. 
              Ideally we add DND here too or keep it simple. 
              The task list said 'Optimize layout for responsiveness' checked, but DND on mobile needs care.
              We'll leave the existing mobile layout non-dnd for now unless requested to preserve stability. */}
          {weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isToday = isDateToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${isToday ? 'border-terracotta-500' : 'border-sage-200'
                  }`}
              >
                <div className={`p-4 ${isToday ? 'bg-terracotta-50' : 'bg-sage-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-semibold uppercase ${isToday ? 'text-terracotta-600' : 'text-gray-600'
                        }`}>
                        {format(day, 'EEEE')}
                      </div>
                      <div className={`text-xl font-bold ${isToday ? 'text-terracotta-700' : 'text-gray-900'
                        }`}>
                        {format(day, 'MMMM d, yyyy')}
                      </div>
                    </div>
                    {isToday && (
                      <div className="px-3 py-1 bg-terracotta-600 text-white text-xs font-bold rounded-full">
                        TODAY
                      </div>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-sage-200">
                  {MEAL_TYPES.map(({ type, label, icon }) => {
                    const slotMeals = meals.filter(meal =>
                      meal.date === dateStr &&
                      meal.meal_type === type
                    );

                    return (
                      <div key={type} className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-sage-600">{icon}</div>
                          <div className="text-sm font-semibold text-gray-700">{label}</div>
                        </div>

                        {slotMeals.length > 0 ? (
                          <div className="space-y-3">
                            {slotMeals.map(meal => (
                              <button
                                key={meal.id}
                                onClick={() => onMealClick?.(meal)}
                                className="w-full text-left group block"
                              >
                                <div className="border-2 border-sage-200 rounded-lg overflow-hidden hover:border-terracotta-400 hover:shadow-md transition bg-white">
                                  {meal.recipes[0]?.recipe.image_url && (
                                    <div className="w-full aspect-video">
                                      <img
                                        src={meal.recipes[0].recipe.image_url}
                                        alt={meal.recipes[0].recipe.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition"
                                      />
                                    </div>
                                  )}
                                  <div className="p-3">
                                    <div className="font-medium text-gray-900 mb-1">
                                      {meal.recipes[0]?.recipe.title || meal.name}
                                    </div>
                                    {meal.recipes.length > 1 && (
                                      <div className="text-sm text-gray-500">
                                        +{meal.recipes.length - 1} more recipe{meal.recipes.length > 2 ? 's' : ''}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                            <button
                              onClick={() => onAddMeal(dateStr, type)}
                              className="w-full py-2 border-2 border-dashed border-sage-200 rounded-lg hover:border-terracotta-400 hover:bg-terracotta-50 transition text-sm text-gray-500 hover:text-terracotta-600"
                            >
                              + Add another {label.toLowerCase()}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onAddMeal(dateStr, type)}
                            className="w-full py-8 flex items-center justify-center border-2 border-dashed border-sage-200 rounded-lg hover:border-terracotta-400 hover:bg-terracotta-50 transition group"
                          >
                            <div className="text-center">
                              <Plus className="w-8 h-8 text-gray-400 group-hover:text-terracotta-600 transition mx-auto mb-2" />
                              <div className="text-sm text-gray-500 group-hover:text-terracotta-600 transition">
                                Add {label.toLowerCase()}
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
