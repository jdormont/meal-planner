import { Recipe } from '../lib/supabase';
import { Clock, Users, Edit2, Trash2, Plus, MessageSquare, Sparkles, ChefHat, Globe } from 'lucide-react';

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
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-lg p-12 texture-subtle">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-terracotta-100 to-cream-100 rounded-full mb-6">
              <ChefHat className="w-16 h-16 text-terracotta-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to Your Recipe Collection
            </h2>
            <p className="text-lg text-gray-600">
              Get started by creating your first recipe or let our AI assistant help you brainstorm ideas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="group relative bg-gradient-to-br from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Create Recipe</h3>
                    <p className="text-sm text-terracotta-50">
                      Start from scratch with your own recipe
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors" />
              </button>
            )}

            {onImportFromWeb && (
              <button
                onClick={onImportFromWeb}
                className="group relative bg-gradient-to-br from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700 text-white rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Import from Web</h3>
                    <p className="text-sm text-sage-50">
                      Scrape a recipe from any website
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors" />
              </button>
            )}

            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="group relative bg-gradient-to-br from-warmtan-500 to-warmtan-600 hover:from-warmtan-600 hover:to-warmtan-700 text-white rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-lg relative">
                    <MessageSquare className="w-8 h-8" />
                    <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">AI Assistant</h3>
                    <p className="text-sm text-warmtan-50">
                      Get recipe ideas and cooking tips
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors" />
              </button>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
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
