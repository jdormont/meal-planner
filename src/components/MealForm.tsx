import { useState, useEffect } from 'react';
import { Meal, Recipe } from '../lib/supabase';
import { X, Plus, Trash2 } from 'lucide-react';

type MealFormProps = {
  meal: Meal | null;
  recipes: Recipe[];
  selectedRecipeIds: string[];
  onSave: (mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>, recipeIds: string[]) => void;
  onCancel: () => void;
};

export function MealForm({ meal, recipes, selectedRecipeIds, onSave, onCancel }: MealFormProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [mealType, setMealType] = useState<Meal['meal_type']>('dinner');
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
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
    setSelectedRecipes(selectedRecipeIds);
  }, [meal, selectedRecipeIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    onSave(
      {
        name: name.trim(),
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

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRecipeObjects = recipes.filter(r => selectedRecipes.includes(r.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {meal ? 'Edit Meal' : 'Create New Meal'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-sage-100 rounded-xl transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Meal Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Tuesday Dinner"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div className="flex items-center pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEvent}
                    onChange={(e) => setIsEvent(e.target.checked)}
                    className="w-5 h-5 text-terracotta-600 rounded focus:ring-terracotta-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Save as Collection</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="mealType" className="block text-sm font-semibold text-gray-700 mb-2">
                  Meal Type
                </label>
                <select
                  id="mealType"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as Meal['meal_type'])}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the meal..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Recipes ({selectedRecipes.length})
              </label>

              {selectedRecipeObjects.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedRecipeObjects.map(recipe => (
                    <div
                      key={recipe.id}
                      className="flex items-center justify-between bg-cream-50 border border-terracotta-200 rounded-xl p-3"
                    >
                      <span className="font-medium text-gray-900">{recipe.title}</span>
                      <button
                        type="button"
                        onClick={() => toggleRecipe(recipe.id)}
                        className="p-1 hover:bg-terracotta-200 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4 text-terracotta-700" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowRecipeSelector(!showRecipeSelector)}
                className="w-full px-4 py-3 border-2 border-dashed border-sage-300 rounded-xl hover:border-terracotta-400 hover:bg-cream-50 transition text-gray-600 font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Recipes
              </button>

              {showRecipeSelector && (
                <div className="mt-3 border border-sage-300 rounded-xl overflow-hidden">
                  <div className="p-3 bg-sage-50 border-b">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search recipes..."
                      className="w-full px-3 py-2 border border-sage-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredRecipes.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        No recipes found
                      </div>
                    ) : (
                      filteredRecipes.map(recipe => (
                        <button
                          key={recipe.id}
                          type="button"
                          onClick={() => toggleRecipe(recipe.id)}
                          className={`w-full px-4 py-3 text-left hover:bg-sage-50 transition border-b border-gray-100 ${selectedRecipes.includes(recipe.id)
                              ? 'bg-cream-50 font-medium text-terracotta-900'
                              : 'text-gray-700'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{recipe.title}</span>
                            {selectedRecipes.includes(recipe.id) && (
                              <span className="text-terracotta-600">✓</span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional planning notes, shopping lists, etc..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl transition font-medium"
            >
              {meal ? 'Update Meal' : 'Create Meal'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-sage-300 text-gray-700 rounded-xl hover:bg-sage-50 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
