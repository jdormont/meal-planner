import { Recipe } from '../lib/supabase';
import { Clock, Users, Copy, Eye, Edit2 } from 'lucide-react';

type CommunityRecipesProps = {
  recipes: Recipe[];
  onSelect: (recipe: Recipe) => void;
  onCopy: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  currentUserId: string;
};

export function CommunityRecipes({ recipes, onSelect, onCopy, onEdit, currentUserId }: CommunityRecipesProps) {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Community Recipes Yet</h3>
        <p className="text-gray-600">
          When other users share their recipes, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => {
        const isOwner = recipe.user_id === currentUserId;
        return (
          <div
            key={recipe.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div onClick={() => onSelect(recipe)}>
              {recipe.image_url ? (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isOwner && (
                    <div className="absolute top-2 right-2 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
                      Your Recipe
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center relative">
                  <Users className="w-16 h-16 text-orange-300" />
                  {isOwner && (
                    <div className="absolute top-2 right-2 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
                      Your Recipe
                    </div>
                  )}
                </div>
              )}

              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                  {recipe.title}
                </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {recipe.description || 'No description'}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {recipe.prep_time_minutes + recipe.cook_time_minutes} min
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{recipe.servings} servings</span>
                </div>
              </div>

              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-xs"
                    >
                      {tag.includes(':') ? tag.split(':')[1] : tag}
                    </span>
                  ))}
                  {recipe.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{recipe.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

            <div className="px-5 pb-4 flex gap-2">
              <button
                onClick={() => onSelect(recipe)}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              {isOwner ? (
                <button
                  onClick={() => onEdit(recipe)}
                  className="flex-1 px-4 py-2 border border-orange-600 text-orange-600 hover:bg-orange-50 rounded-lg transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => onCopy(recipe)}
                  className="flex-1 px-4 py-2 border border-orange-600 text-orange-600 hover:bg-orange-50 rounded-lg transition font-medium flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
