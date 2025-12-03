import { Recipe } from '../lib/supabase';
import { Clock, Users, Edit2, Trash2 } from 'lucide-react';

type RecipeListProps = {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onSelect: (recipe: Recipe) => void;
};

export function RecipeList({ recipes, onEdit, onDelete, onSelect }: RecipeListProps) {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No recipes yet. Create your first recipe or chat with AI for ideas!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer"
          onClick={() => onSelect(recipe)}
        >
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}

          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
              {recipe.title.replace(/\*\*/g, '')}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {recipe.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{recipe.prep_time_minutes + recipe.cook_time_minutes} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{recipe.servings} servings</span>
              </div>
            </div>

            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {recipe.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{recipe.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(recipe);
                }}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this recipe?')) {
                    onDelete(recipe.id);
                  }
                }}
                className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
