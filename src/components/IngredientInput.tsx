import { Plus, Minus } from 'lucide-react';

export type Ingredient = { name: string; quantity: string; unit: string };

type IngredientInputProps = {
  ingredients: Ingredient[];
  recipeType: 'food' | 'cocktail';
  onChange: (ingredients: Ingredient[]) => void;
};

export function IngredientInput({ ingredients, recipeType, onChange }: IngredientInputProps) {
  const addIngredient = () => {
    onChange([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Ingredients
      </label>
      <div className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={ingredient.quantity}
              onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
              placeholder={recipeType === 'cocktail' ? '2' : '1'}
              className="w-20 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
            />
            <input
              type="text"
              value={ingredient.unit}
              onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
              placeholder={recipeType === 'cocktail' ? 'oz' : 'cup'}
              className="w-24 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
            />
            <input
              type="text"
              value={ingredient.name}
              onChange={(e) => updateIngredient(index, 'name', e.target.value)}
              placeholder={recipeType === 'cocktail' ? 'bourbon' : 'flour'}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
            />
            <button
              type="button"
              onClick={() => removeIngredient(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addIngredient}
        className="mt-2 px-4 py-2 text-terracotta-600 hover:bg-terracotta-50 rounded-xl transition flex items-center gap-2 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Ingredient
      </button>
    </div>
  );
}
