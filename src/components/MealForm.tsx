import { useState, useEffect } from 'react';
import { Meal, Recipe } from '../lib/supabase';
import { X, Plus, Trash2 } from 'lucide-react';

type MealFormProps = {
  meal: Meal | null;
  recipes: Recipe[];
  selectedRecipeIds: string[];
  initialDate?: string;
  initialMealType?: Meal['meal_type'];
  onSave: (mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>, recipeIds: string[]) => void;
  onCancel: () => void;
};

export function MealForm({ meal, recipes, selectedRecipeIds, onSave, onCancel, initialDate, initialMealType }: MealFormProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(initialDate || '');
  const [mealType, setMealType] = useState<Meal['meal_type']>(initialMealType || 'dinner');
  const [isEvent, setIsEvent] = useState(false);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (meal) {
      setName(meal.name);
      setDate(meal.date);
      setMealType(meal.meal_type || 'dinner');
      setIsEvent(meal.is_event || false);
      setDescription(meal.description);
      setNotes(meal.notes);
    } else {
      if (!date && !initialDate) {
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
      }
    }
    setSelectedRecipes(selectedRecipeIds);
  }, [meal, selectedRecipeIds, initialDate, initialMealType]);

  // Deduplicate recipes (in case a user's recipe is also in community recipes)
  const uniqueRecipes = Array.from(new Map(recipes.map(r => [r.id, r])).values());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const finalName = name.trim() || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;

    onSave(
      {
        name: finalName,
        date,
        meal_type: mealType,
        is_event: isEvent,
        description: description.trim(),
        notes: notes.trim(),
        is_archived: false,
      },
      selectedRecipes
    );
  };

  const toggleRecipe = (recipeId: string) => {
    setSelectedRecipes(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const filteredRecipes = uniqueRecipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRecipeObjects = uniqueRecipes.filter(r => selectedRecipes.includes(r.id));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {meal ? 'Edit Meal' : 'Plan Meal'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-sage-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-5">
            {/* Top Row: Date & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none transition font-medium"
                  required
                />
              </div>
              <div>
                <label htmlFor="mealType" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Type
                </label>
                <select
                  id="mealType"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as Meal['meal_type'])}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none transition font-medium appearance-none"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
            </div>

            {/* Name & Collection Toggle */}
            <div className="space-y-3">
              <label htmlFor="name" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                Meal Title <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="flex gap-3 items-start">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none transition"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer w-fit p-1 -ml-1 hover:bg-gray-50 rounded-lg transition">
                <input
                  type="checkbox"
                  checked={isEvent}
                  onChange={(e) => setIsEvent(e.target.checked)}
                  className="w-4 h-4 text-terracotta-600 rounded focus:ring-terracotta-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-600">Save as Collection</span>
              </label>
            </div>

            {/* Recipes Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Recipes
                </label>
                <span className="text-xs font-medium text-terracotta-600 bg-terracotta-50 px-2 py-0.5 rounded-full">
                  {selectedRecipes.length} selected
                </span>
              </div>

              {selectedRecipeObjects.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedRecipeObjects.map(recipe => (
                    <div
                      key={`selected-${recipe.id}`}
                      className="flex items-center justify-between bg-white border border-gray-200 shadow-sm rounded-xl p-3 group hover:border-terracotta-200 transition"
                    >
                      <span className="font-medium text-gray-900 truncate pr-2">{recipe.title}</span>
                      <button
                        type="button"
                        onClick={() => toggleRecipe(recipe.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowRecipeSelector(!showRecipeSelector)}
                className={`w-full px-4 py-3 border-2 border-dashed rounded-xl transition font-medium flex items-center justify-center gap-2 ${showRecipeSelector
                  ? 'border-terracotta-300 bg-terracotta-50 text-terracotta-700'
                  : 'border-gray-200 hover:border-terracotta-300 hover:text-terracotta-600 text-gray-500'
                  }`}
              >
                <Plus className="w-4 h-4" />
                {showRecipeSelector ? 'Close Recipe Search' : 'Add Recipe'}
              </button>

              {showRecipeSelector && (
                <div className="mt-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search your recipes..."
                      className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-terracotta-500 outline-none text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredRecipes.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        No matching recipes
                      </div>
                    ) : (
                      filteredRecipes.map(recipe => (
                        <button
                          key={`option-${recipe.id}`}
                          type="button"
                          onClick={() => {
                            toggleRecipe(recipe.id);
                            if (!selectedRecipes.includes(recipe.id)) {
                              setShowRecipeSelector(false);
                              setSearchTerm('');
                            }
                          }}
                          className={`w-full px-4 py-2.5 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50 transition ${selectedRecipes.includes(recipe.id)
                            ? 'bg-terracotta-50 text-terracotta-900'
                            : 'text-gray-700'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm truncate">{recipe.title}</span>
                            {selectedRecipes.includes(recipe.id) && (
                              <span className="text-terracotta-600 text-xs font-bold">ADDED</span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section - Compact */}
            <div>
              <label htmlFor="notes" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add shopping list items or prep notes..."
                rows={2}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none resize-none transition"
              />
            </div>
          </div>
        </form>

        <div className="p-5 border-t bg-gray-50 rounded-b-3xl flex gap-3 shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 shadow-sm text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 bg-terracotta-600 shadow-sm text-white rounded-xl hover:bg-terracotta-700 transition font-medium"
          >
            Save Meal
          </button>
        </div>
      </div>
    </div>
  );
}
