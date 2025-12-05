import { useState } from 'react';
import { X, Globe, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { Recipe } from '../lib/supabase';

type ImportStatus = 'idle' | 'importing' | 'creating' | 'done' | 'error';

type RecipeImportModalProps = {
  onClose: () => void;
  onImportComplete: (recipe: Partial<Recipe>) => void;
};

export function RecipeImportModal({ onClose, onImportComplete }: RecipeImportModalProps) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const parseIngredient = (ingredientStr: string) => {
    // Pattern: [quantity] [unit] ingredient [, notes]
    // Examples:
    // "4 tablespoons extra-virgin olive oil, divided"
    // "1/2 pound spaghetti"
    // "Coarsely ground black pepper, to taste"

    const str = ingredientStr.trim();

    // Match quantity at the start (including fractions like 1/2, 1 1/2, etc.)
    const quantityMatch = str.match(/^(\d+(?:\/\d+)?(?:\s+\d+\/\d+)?|\d+\.\d+|\d+)/);
    let quantity = '';
    let remaining = str;

    if (quantityMatch) {
      quantity = quantityMatch[1];
      remaining = str.slice(quantityMatch[0].length).trim();
    }

    // Check for notes at the end (after comma)
    let notes = '';
    const commaIndex = remaining.lastIndexOf(',');
    if (commaIndex !== -1) {
      notes = remaining.slice(commaIndex + 1).trim();
      remaining = remaining.slice(0, commaIndex).trim();
    }

    // Common units (ordered by length to match longer units first)
    const units = [
      'tablespoons', 'tablespoon', 'teaspoons', 'teaspoon', 'cups', 'cup',
      'ounces', 'ounce', 'pounds', 'pound', 'grams', 'gram', 'kilograms', 'kilogram',
      'milliliters', 'milliliter', 'liters', 'liter', 'quarts', 'quart', 'pints', 'pint',
      'gallons', 'gallon', 'cloves', 'clove', 'slices', 'slice', 'pieces', 'piece',
      'pinch', 'dash', 'tbsp', 'tsp', 'oz', 'lb', 'ml', 'l', 'kg', 'g', 'qt', 'pt', 'gal'
    ];

    // Find unit at the start of remaining string
    let unit = '';
    let ingredient = remaining;

    for (const possibleUnit of units) {
      const regex = new RegExp(`^${possibleUnit}\\b`, 'i');
      if (regex.test(remaining)) {
        unit = remaining.match(regex)![0];
        ingredient = remaining.slice(unit.length).trim();
        break;
      }
    }

    // Remove parenthetical notes from ingredient (like "(60ml)")
    ingredient = ingredient.replace(/\([^)]*\)/g, '').trim();

    return {
      quantity: quantity || '',
      unit: unit || '',
      name: ingredient || str, // Fall back to full string if parsing fails
    };
  };

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setStatus('importing');
      setError(null);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-recipe`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import recipe');
      }

      setStatus('creating');
      const recipe = await response.json();

      // Parse string ingredients into structured objects
      const parsedIngredients = recipe.ingredients.map((ing: string | object) => {
        // If already an object, return as-is
        if (typeof ing === 'object' && ing !== null) {
          return ing;
        }
        // Otherwise parse the string
        return parseIngredient(String(ing));
      });

      // Update the recipe with parsed ingredients and default fields
      const recipeWithParsedIngredients = {
        ...recipe,
        ingredients: parsedIngredients,
        is_shared: false
      };

      setStatus('done');

      setTimeout(() => {
        onImportComplete(recipeWithParsedIngredients);
        onClose();
      }, 1000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to import recipe');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'importing':
        return 'Fetching recipe from website...';
      case 'creating':
        return 'Parsing recipe data...';
      case 'done':
        return 'Recipe imported successfully!';
      case 'error':
        return error || 'There were issues importing this recipe';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'importing':
      case 'creating':
        return <Loader className="w-6 h-6 text-blue-600 animate-spin" />;
      case 'done':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Globe className="w-6 h-6 text-orange-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Import Recipe</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={status === 'importing' || status === 'creating'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="recipe-url" className="block text-sm font-medium text-gray-700 mb-2">
              Recipe URL
            </label>
            <input
              id="recipe-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={status === 'importing' || status === 'creating'}
            />
            <p className="mt-2 text-sm text-gray-500">
              Paste the URL of any recipe webpage to import it
            </p>
          </div>

          {status !== 'idle' && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              status === 'error' ? 'bg-red-50' :
              status === 'done' ? 'bg-green-50' :
              'bg-blue-50'
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon()}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  status === 'error' ? 'text-red-800' :
                  status === 'done' ? 'text-green-800' :
                  'text-blue-800'
                }`}>
                  {getStatusMessage()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            disabled={status === 'importing' || status === 'creating'}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!url.trim() || status === 'importing' || status === 'creating' || status === 'done'}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === 'importing' || status === 'creating' ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Recipe'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
