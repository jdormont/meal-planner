import { useState, useEffect } from 'react';
import { Recipe, CocktailMetadata } from '../lib/supabase';
import { X, Plus, Minus, Loader2, Trash2 } from 'lucide-react';

type RecipeFormProps = {
  recipe?: Recipe | null;
  onSave: (recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

export function RecipeForm({ recipe, onSave, onCancel, onDelete }: RecipeFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<Array<{ name: string; quantity: string; unit: string }>>([
    { name: '', quantity: '', unit: '' },
  ]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [totalTime, setTotalTime] = useState(0);
  const [servings, setServings] = useState(4);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);
  const [recipeType, setRecipeType] = useState<'food' | 'cocktail'>('food');
  const [cocktailMetadata, setCocktailMetadata] = useState<CocktailMetadata>({
    spiritBase: '',
    glassType: '',
    garnish: '',
    method: '',
    ice: '',
  });

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setDescription(recipe.description);
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', quantity: '', unit: '' }]);
      setInstructions(recipe.instructions.length > 0 ? recipe.instructions : ['']);
      setTotalTime(recipe.total_time);
      setServings(recipe.servings);
      setTags(recipe.tags);
      setImageUrl(recipe.image_url || '');
      setSourceUrl(recipe.source_url || '');
      setNotes(recipe.notes);
      setIsShared(recipe.is_shared);
      setRecipeType(recipe.recipe_type);
      if (recipe.cocktail_metadata) {
        setCocktailMetadata({
          spiritBase: recipe.cocktail_metadata.spiritBase || '',
          glassType: recipe.cocktail_metadata.glassType || '',
          garnish: recipe.cocktail_metadata.garnish || '',
          method: recipe.cocktail_metadata.method || '',
          ice: recipe.cocktail_metadata.ice || '',
        });
      }
    }
  }, [recipe]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const fetchRecipeImage = async (recipeName: string) => {
    if (!recipeName.trim()) return null;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recipe-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: recipeName,
            description,
            ingredients: ingredients.filter(i => i.name.trim()),
          }),
        }
      );

      const data = await response.json();
      return data.imageUrl || null;
    } catch (error) {
      console.error('Error fetching recipe image:', error);
      return null;
    }
  };

  const regenerateImage = async () => {
    if (!title.trim()) return;

    setIsRegeneratingImage(true);
    const fetchedImageUrl = await fetchRecipeImage(title);
    if (fetchedImageUrl) {
      setImageUrl(fetchedImageUrl);
    }
    setIsRegeneratingImage(false);
  };

  const autoTagRecipe = async () => {
    if (!title.trim()) return;

    setIsAutoTagging(true);
    try {
      const payload = {
        title,
        description,
        ingredients: ingredients.filter(i => i.name.trim()),
        instructions: instructions.filter(i => i.trim()),
        totalTime,
        recipeType,
      };
      console.log('Sending auto-tag request:', payload);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-tag-recipe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.tags && Object.keys(data.tags).length > 0) {
        let newTags = [...tags];

        // Remove incompatible tags based on recipe type
        if (recipeType === 'cocktail') {
          // Remove food-specific tags from cocktails
          newTags = newTags.filter(t =>
            !t.startsWith('technique:') &&
            !t.startsWith('grain:') &&
            !t.startsWith('protein:') &&
            !t.startsWith('cuisine:') &&
            !t.startsWith('meal:')
          );
        } else {
          // Remove cocktail-specific tags from food recipes
          newTags = newTags.filter(t =>
            !t.startsWith('base:') &&
            !t.startsWith('flavor:') &&
            !t.startsWith('strength:') &&
            !t.startsWith('method:') &&
            !t.startsWith('occasion:')
          );
        }

        // Handle food tags
        if (data.tags.technique) {
          const techniqueTag = `technique:${data.tags.technique}`;
          const filtered = newTags.filter(t => !t.startsWith('technique:'));
          filtered.push(techniqueTag);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (data.tags.grain) {
          const grainTag = `grain:${data.tags.grain}`;
          const filtered = newTags.filter(t => !t.startsWith('grain:'));
          filtered.push(grainTag);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (data.tags.protein) {
          const proteinTag = `protein:${data.tags.protein}`;
          const filtered = newTags.filter(t => !t.startsWith('protein:'));
          filtered.push(proteinTag);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (data.tags.cuisine) {
          const cuisineTag = `cuisine:${data.tags.cuisine}`;
          const filtered = newTags.filter(t => !t.startsWith('cuisine:'));
          filtered.push(cuisineTag);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (data.tags.meal) {
          const mealTag = `meal:${data.tags.meal}`;
          const filtered = newTags.filter(t => !t.startsWith('meal:'));
          filtered.push(mealTag);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        // Handle cocktail tags
        if (data.tags.base) {
          const baseTag = `base:${data.tags.base}`;
          const filtered = newTags.filter(t => !t.startsWith('base:'));
          filtered.push(baseTag);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (data.tags.flavor) {
          const flavorTag = `flavor:${data.tags.flavor}`;
          const filtered = newTags.filter(t => !t.startsWith('flavor:'));
          filtered.push(flavorTag);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (data.tags.strength) {
          const strengthTag = `strength:${data.tags.strength}`;
          const filtered = newTags.filter(t => !t.startsWith('strength:'));
          filtered.push(strengthTag);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (data.tags.method) {
          const methodTag = `method:${data.tags.method}`;
          const filtered = newTags.filter(t => !t.startsWith('method:'));
          filtered.push(methodTag);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (data.tags.occasion) {
          const occasionTag = `occasion:${data.tags.occasion}`;
          const filtered = newTags.filter(t => !t.startsWith('occasion:'));
          filtered.push(occasionTag);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        setTags(newTags);
      }

      // Populate cocktail detail fields if present
      if (data.cocktailDetails && recipeType === 'cocktail') {
        setCocktailMetadata({
          spiritBase: data.cocktailDetails.baseSpirit || '',
          glassType: data.cocktailDetails.glassType || '',
          method: data.cocktailDetails.method || '',
          ice: data.cocktailDetails.ice || '',
          garnish: data.cocktailDetails.garnish || ''
        });
      }
    } catch (error) {
      console.error('Error auto-tagging recipe:', error);
    } finally {
      setIsAutoTagging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalImageUrl = imageUrl;

    if (!finalImageUrl) {
      setIsFetchingImage(true);
      const fetchedImageUrl = await fetchRecipeImage(title);
      if (fetchedImageUrl) {
        finalImageUrl = fetchedImageUrl;
      }
      setIsFetchingImage(false);
    }

    const cocktailMetadataToSave = recipeType === 'cocktail' && (
      cocktailMetadata.spiritBase ||
      cocktailMetadata.glassType ||
      cocktailMetadata.garnish ||
      cocktailMetadata.method ||
      cocktailMetadata.ice
    ) ? cocktailMetadata : null;

    onSave({
      title,
      description,
      ingredients: ingredients.filter((i) => i.name.trim()),
      instructions: instructions.filter((i) => i.trim()),
      total_time: totalTime,
      servings,
      tags,
      image_url: finalImageUrl || undefined,
      source_url: sourceUrl || undefined,
      notes,
      is_shared: isShared,
      recipe_type: recipeType,
      cocktail_metadata: cocktailMetadataToSave,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col texture-subtle">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {recipe?.id.startsWith('temp-')
                ? `Review AI ${recipeType === 'cocktail' ? 'Cocktail' : 'Recipe'}`
                : recipe
                  ? `Edit ${recipeType === 'cocktail' ? 'Cocktail' : 'Recipe'}`
                  : `New ${recipeType === 'cocktail' ? 'Cocktail' : 'Recipe'}`}
            </h2>
            {recipe?.id.startsWith('temp-') && (
              <p className="text-sm text-gray-600 mt-1">Review and edit the {recipeType === 'cocktail' ? 'cocktail' : 'recipe'} before saving</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {recipe?.id.startsWith('temp-') && (
            <div className="bg-sage-50 border border-sage-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecipeType('food')}
                  className={`flex-1 px-4 py-2 rounded-xl font-medium transition ${
                    recipeType === 'food'
                      ? 'bg-terracotta-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Food Recipe
                </button>
                <button
                  type="button"
                  onClick={() => setRecipeType('cocktail')}
                  className={`flex-1 px-4 py-2 rounded-xl font-medium transition ${
                    recipeType === 'cocktail'
                      ? 'bg-terracotta-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Cocktail
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                The AI classified this as a {recipeType}. Change it if incorrect.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {recipeType === 'cocktail' ? 'Cocktail Name' : 'Recipe Title'} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              placeholder={recipeType === 'cocktail' ? 'Classic Old Fashioned' : 'Delicious Pasta Carbonara'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none resize-none"
              placeholder="A brief description of your recipe..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Time (min)
              </label>
              <input
                type="number"
                value={totalTime}
                onChange={(e) => setTotalTime(Number(e.target.value))}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {recipeType === 'cocktail' ? 'Servings/Drinks' : 'Servings'}
              </label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {recipeType === 'cocktail' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Cocktail Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Base Spirit
                  </label>
                  <select
                    value={cocktailMetadata.spiritBase}
                    onChange={(e) => setCocktailMetadata({ ...cocktailMetadata, spiritBase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="vodka">Vodka</option>
                    <option value="gin">Gin</option>
                    <option value="rum">Rum</option>
                    <option value="tequila">Tequila</option>
                    <option value="whiskey">Whiskey</option>
                    <option value="bourbon">Bourbon</option>
                    <option value="brandy">Brandy</option>
                    <option value="mezcal">Mezcal</option>
                    <option value="non-alcoholic">Non-Alcoholic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Glass Type
                  </label>
                  <select
                    value={cocktailMetadata.glassType}
                    onChange={(e) => setCocktailMetadata({ ...cocktailMetadata, glassType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="rocks">Rocks/Old Fashioned</option>
                    <option value="highball">Highball</option>
                    <option value="martini">Martini</option>
                    <option value="coupe">Coupe</option>
                    <option value="collins">Collins</option>
                    <option value="hurricane">Hurricane</option>
                    <option value="champagne">Champagne Flute</option>
                    <option value="shot">Shot Glass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Method
                  </label>
                  <select
                    value={cocktailMetadata.method}
                    onChange={(e) => setCocktailMetadata({ ...cocktailMetadata, method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="shaken">Shaken</option>
                    <option value="stirred">Stirred</option>
                    <option value="built">Built</option>
                    <option value="blended">Blended</option>
                    <option value="muddled">Muddled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Ice
                  </label>
                  <select
                    value={cocktailMetadata.ice}
                    onChange={(e) => setCocktailMetadata({ ...cocktailMetadata, ice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="cubed">Cubed</option>
                    <option value="crushed">Crushed</option>
                    <option value="neat">Neat (No Ice)</option>
                    <option value="rocks">On the Rocks</option>
                    <option value="large-cube">Large Cube</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Garnish
                  </label>
                  <input
                    type="text"
                    value={cocktailMetadata.garnish}
                    onChange={(e) => setCocktailMetadata({ ...cocktailMetadata, garnish: e.target.value })}
                    placeholder="e.g., lemon twist, cherry, mint sprig"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <div className="space-y-2">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-gray-500 font-medium">
                    {index + 1}.
                  </span>
                  <textarea
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={2}
                    placeholder="Describe this step..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addInstruction}
              className="mt-2 px-4 py-2 text-terracotta-600 hover:bg-terracotta-50 rounded-xl transition flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Recipe Categories
              </label>
              <button
                type="button"
                onClick={autoTagRecipe}
                disabled={isAutoTagging || !title.trim()}
                className="px-3 py-1.5 text-sm bg-terracotta-100 hover:bg-terracotta-200 text-terracotta-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAutoTagging && <Loader2 className="w-4 h-4 animate-spin" />}
                {isAutoTagging ? 'Auto-tagging...' : 'Auto-tag'}
              </button>
            </div>

            <div className="space-y-4">
              {recipeType === 'cocktail' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Base Spirit
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const tag = `base:${e.target.value}`;
                          if (!tags.includes(tag)) {
                            setTags([...tags.filter(t => !t.startsWith('base:')), tag]);
                          }
                        }
                      }}
                      value={tags.find(t => t.startsWith('base:'))?.replace('base:', '') || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select base...</option>
                      <option value="vodka">Vodka</option>
                      <option value="gin">Gin</option>
                      <option value="rum">Rum</option>
                      <option value="tequila">Tequila</option>
                      <option value="whiskey">Whiskey</option>
                      <option value="bourbon">Bourbon</option>
                      <option value="brandy">Brandy</option>
                      <option value="mezcal">Mezcal</option>
                      <option value="non-alcoholic">Non-Alcoholic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Flavor Profile
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const tag = `flavor:${e.target.value}`;
                          if (!tags.includes(tag)) {
                            setTags([...tags.filter(t => !t.startsWith('flavor:')), tag]);
                          }
                        }
                      }}
                      value={tags.find(t => t.startsWith('flavor:'))?.replace('flavor:', '') || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select flavor...</option>
                      <option value="citrus">Citrus</option>
                      <option value="herbal">Herbal</option>
                      <option value="fruity">Fruity</option>
                      <option value="bitter">Bitter</option>
                      <option value="sweet">Sweet</option>
                      <option value="spicy">Spicy</option>
                      <option value="sour">Sour</option>
                      <option value="tropical">Tropical</option>
                      <option value="creamy">Creamy</option>
                      <option value="smoky">Smoky</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Strength
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const tag = `strength:${e.target.value}`;
                          if (!tags.includes(tag)) {
                            setTags([...tags.filter(t => !t.startsWith('strength:')), tag]);
                          }
                        }
                      }}
                      value={tags.find(t => t.startsWith('strength:'))?.replace('strength:', '') || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select strength...</option>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="strong">Strong</option>
                      <option value="very-strong">Very Strong</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Occasion
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const tag = `occasion:${e.target.value}`;
                          if (!tags.includes(tag)) {
                            setTags([...tags.filter(t => !t.startsWith('occasion:')), tag]);
                          }
                        }
                      }}
                      value={tags.find(t => t.startsWith('occasion:'))?.replace('occasion:', '') || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select occasion...</option>
                      <option value="aperitif">Aperitif</option>
                      <option value="digestif">Digestif</option>
                      <option value="party">Party</option>
                      <option value="brunch">Brunch</option>
                      <option value="summer">Summer</option>
                      <option value="winter">Winter</option>
                      <option value="classic">Classic</option>
                      <option value="modern">Modern</option>
                    </select>
                  </div>
                </>
              )}
              {recipeType === 'food' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Main Technique
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const tag = `technique:${e.target.value}`;
                          if (!tags.includes(tag)) {
                            setTags([...tags.filter(t => !t.startsWith('technique:')), tag]);
                          }
                        }
                      }}
                      value={tags.find(t => t.startsWith('technique:'))?.replace('technique:', '') || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select technique...</option>
                      <option value="saute">Sauté</option>
                      <option value="bake">Bake</option>
                      <option value="broil">Broil</option>
                      <option value="grill">Grill</option>
                      <option value="roast">Roast</option>
                      <option value="steam">Steam</option>
                      <option value="boil">Boil</option>
                      <option value="fry">Fry</option>
                      <option value="slow-cook">Slow Cook</option>
                      <option value="pressure-cook">Pressure Cook</option>
                      <option value="raw">Raw/No Cook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Grain/Starch
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const tag = `grain:${e.target.value}`;
                          if (!tags.includes(tag)) {
                            setTags([...tags.filter(t => !t.startsWith('grain:')), tag]);
                          }
                        }
                      }}
                      value={tags.find(t => t.startsWith('grain:'))?.replace('grain:', '') || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select grain/starch...</option>
                      <option value="none">None</option>
                      <option value="rice">Rice</option>
                      <option value="pasta">Pasta</option>
                      <option value="noodles">Noodles</option>
                      <option value="quinoa">Quinoa</option>
                      <option value="couscous">Couscous</option>
                      <option value="bread">Bread</option>
                      <option value="potatoes">Potatoes</option>
                      <option value="polenta">Polenta</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Main Protein
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const tag = `protein:${e.target.value}`;
                          if (!tags.includes(tag)) {
                            setTags([...tags.filter(t => !t.startsWith('protein:')), tag]);
                          }
                        }
                      }}
                      value={tags.find(t => t.startsWith('protein:'))?.replace('protein:', '') || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select protein...</option>
                      <option value="none">None/Vegetarian</option>
                      <option value="fish">Fish</option>
                      <option value="shellfish">Shellfish</option>
                      <option value="chicken">Chicken</option>
                      <option value="turkey">Turkey</option>
                      <option value="pork">Pork</option>
                      <option value="beef">Beef</option>
                      <option value="lamb">Lamb</option>
                      <option value="eggs">Eggs</option>
                      <option value="tofu">Tofu</option>
                      <option value="legumes">Legumes</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Cuisine
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const tag = `cuisine:${e.target.value}`;
                          if (!tags.includes(tag)) {
                            setTags([...tags.filter(t => !t.startsWith('cuisine:')), tag]);
                          }
                        }
                      }}
                      value={tags.find(t => t.startsWith('cuisine:'))?.replace('cuisine:', '') || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select cuisine...</option>
                      <option value="american">American</option>
                      <option value="italian">Italian</option>
                      <option value="mexican">Mexican</option>
                      <option value="chinese">Chinese</option>
                      <option value="japanese">Japanese</option>
                      <option value="thai">Thai</option>
                      <option value="indian">Indian</option>
                      <option value="french">French</option>
                      <option value="mediterranean">Mediterranean</option>
                      <option value="middle-eastern">Middle Eastern</option>
                      <option value="greek">Greek</option>
                      <option value="spanish">Spanish</option>
                      <option value="korean">Korean</option>
                      <option value="vietnamese">Vietnamese</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Meal Type
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const tag = `meal:${e.target.value}`;
                          if (!tags.includes(tag)) {
                            setTags([...tags.filter(t => !t.startsWith('meal:')), tag]);
                          }
                        }
                      }}
                      value={tags.find(t => t.startsWith('meal:'))?.replace('meal:', '') || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select meal type...</option>
                      <option value="breakfast">Breakfast</option>
                      <option value="brunch">Brunch</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                      <option value="appetizer">Appetizer</option>
                      <option value="dessert">Dessert</option>
                      <option value="side">Side Dish</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Additional Tags (optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.filter(t => !t.includes(':')).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-terracotta-100 text-terracotta-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-orange-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add custom tag (e.g., spicy, kid-friendly, quick)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              placeholder="https://example.com/image.jpg"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank to automatically generate an image with DALL-E when saving
            </p>
            {recipe && !recipe.id.startsWith('temp-') && (
              <button
                type="button"
                onClick={regenerateImage}
                disabled={isRegeneratingImage || !title.trim()}
                className="mt-3 px-4 py-2 bg-sage-100 hover:bg-sage-200 text-sage-800 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                {isRegeneratingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                {isRegeneratingImage ? 'Generating...' : 'Regenerate Image with DALL-E'}
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source URL (optional)
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              placeholder="https://example.com/recipe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none resize-none"
              placeholder="Any personal notes or modifications..."
            />
          </div>

          <div className="bg-terracotta-50 border border-terracotta-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="mt-1 w-5 h-5 text-terracotta-600 border-gray-300 rounded focus:ring-terracotta-500"
              />
              <div>
                <div className="font-medium text-gray-900">Share with Community</div>
                <div className="text-sm text-gray-600 mt-1">
                  Allow other users to view and copy this recipe. You can unshare it at any time.
                </div>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            {recipe && !recipe.id.startsWith('temp-') && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition font-medium flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            )}
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFetchingImage}
              className="px-6 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetchingImage && <Loader2 className="w-5 h-5 animate-spin" />}
              {isFetchingImage ? 'Generating image...' : 'Save Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
