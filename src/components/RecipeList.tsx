import { Recipe } from '../lib/supabase';
import { Clock, Users, Edit2, Trash2, Plus, Sparkles, ChefHat, Globe, Camera, ThumbsUp, ThumbsDown } from 'lucide-react';

type RecipeListProps = {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onSelect: (recipe: Recipe) => void;
  onCreateNew?: () => void;
  onOpenChat?: () => void;
  onImportFromWeb?: () => void;
};

export function RecipeList({ recipes, onEdit, onDelete, onSelect, onCreateNew, onOpenChat, onImportFromWeb }: RecipeListProps) {
  if (recipes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="max-w-3xl w-full bg-cream-50 rounded-3xl shadow-xl p-12 border border-sage-200">
          <div className="text-center mb-12">
            <div className="inline-flex p-5 bg-gradient-to-br from-terracotta-100 to-cream-100 rounded-full mb-6 shadow-sm">
              <img src="/image copy.png" alt="Sous" className="h-16" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your recipe collection starts here
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Save your favorite recipes, import them from the web or photos, and plan meals with help from AI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-warmtan-50 hover:to-cream-50 border-2 border-warmtan-200 hover:border-warmtan-300 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ animationDelay: '0ms' }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white text-xs font-semibold rounded-full shadow-md">
                    <Sparkles className="w-3 h-3" />
                    Suggested starting point
                  </span>
                </div>
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 bg-gradient-to-br from-warmtan-100 to-warmtan-200 rounded-2xl group-hover:scale-110 transition-transform duration-300 relative">
                    <ChefHat className="w-10 h-10 text-warmtan-700" />
                    <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-warmtan-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ask the Chef</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Get recipe ideas, cooking tips, or meal-planning help.
                    </p>
                  </div>
                </div>
              </button>
            )}

            {onImportFromWeb && (
              <button
                onClick={onImportFromWeb}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-sage-50 hover:to-cream-50 border-2 border-sage-200 hover:border-sage-300 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ animationDelay: '100ms' }}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 bg-gradient-to-br from-sage-100 to-sage-200 rounded-2xl group-hover:scale-110 transition-transform duration-300 relative">
                    <Globe className="w-10 h-10 text-sage-700" />
                    <Camera className="w-5 h-5 text-sage-600 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Import from Web or Photo</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Paste a link or upload a photo and we'll do the parsing.
                    </p>
                  </div>
                </div>
              </button>
            )}

            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-terracotta-50 hover:to-cream-50 border-2 border-terracotta-200 hover:border-terracotta-300 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ animationDelay: '200ms' }}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 bg-gradient-to-br from-terracotta-100 to-terracotta-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-10 h-10 text-terracotta-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Create a Recipe</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Add a recipe from scratch — food or cocktails.
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-sage-200">
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              Once you add recipes, they'll appear here for easy access and organization
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer texture-subtle"
          onClick={() => onSelect(recipe)}
        >
          <div className="relative">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-terracotta-100 to-cream-100 flex items-center justify-center">
                <span className="text-6xl">🍽️</span>
              </div>
            )}
            {recipe.rating && (
              <div className={`absolute top-2 left-2 p-1.5 rounded-full shadow-lg ${
                recipe.rating === 'thumbs_up'
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}>
                {recipe.rating === 'thumbs_up' ? (
                  <ThumbsUp className="w-4 h-4 text-white" />
                ) : (
                  <ThumbsDown className="w-4 h-4 text-white" />
                )}
              </div>
            )}
            {recipe.source_url && (
              <div className="absolute top-2 right-2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-lg">
                Imported
              </div>
            )}
          </div>

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
                    className="px-2 py-1 bg-terracotta-50 text-terracotta-700 text-xs rounded-full"
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
                className="flex-1 px-3 py-2 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-xl transition flex items-center justify-center gap-2 text-sm font-medium"
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
                className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition flex items-center justify-center gap-2 text-sm font-medium"
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
