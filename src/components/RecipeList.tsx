import { useState } from 'react';
import { Edit2, Trash2, Clock, Users, ArrowRight } from 'lucide-react';
import { Recipe } from '../lib/supabase';
import { RecipeLane } from './RecipeLane';
import { FeaturedBanner } from './FeaturedBanner';
import { useRecipeDashboard } from '../hooks/useRecipeDashboard';
import { OnboardingLaunchpad } from './OnboardingLaunchpad';

type RecipeListProps = {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onSelect: (recipe: Recipe) => void;
  onCreateNew?: () => void;
  onOpenChat?: () => void;
  onImportFromWeb?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalRecipeCount?: number;
  onScanPhoto?: () => void;
};

export function RecipeList({
  recipes,
  onEdit,
  onDelete,
  onSelect,
  onCreateNew,
  onOpenChat,
  onImportFromWeb,
  onLoadMore,
  hasMore,
  totalRecipeCount,
  onScanPhoto
}: RecipeListProps) {
  const [viewMode, setViewMode] = useState<'dashboard' | 'grid'>('dashboard');
  const {
    quickWins,
    favorites,
    recent,
    featured,
    loading: dashboardLoading
  } = useRecipeDashboard();

  if (viewMode === 'dashboard') {
    if (dashboardLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500"></div>
        </div>
      );
    }

    return (
      <div className="pb-20">
        {!dashboardLoading && totalRecipeCount === 0 ? (
          <OnboardingLaunchpad
            onScan={onScanPhoto || (() => { })}
            onChat={onOpenChat || (() => { })}
            onImport={onImportFromWeb || (() => { })}
          />
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* Empty State reused */}
            <div className="bg-terracotta-50 p-6 rounded-full mb-4">
              <Clock className="w-12 h-12 text-terracotta-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No recipes found</h3>
            <p className="text-gray-600 max-w-sm mb-8">
              Try adjusting your filters or add a new recipe to get started.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {/* Buttons reused from original empty state if needed, or we just show simpler msg */}
              <button onClick={onCreateNew} className="px-4 py-2 bg-terracotta-500 text-white rounded-lg">Create New</button>
            </div>
          </div>
        ) : (
          <>
            {featured && (
              <FeaturedBanner
                recipe={featured}
                onClick={() => onSelect(featured)}
              />
            )}

            <RecipeLane
              title="Quick Wins ⚡️"
              recipes={quickWins}
              onRecipeClick={onSelect}
            />

            <RecipeLane
              title="Your Favorites 🌟"
              recipes={favorites}
              onRecipeClick={onSelect}
            />

            <RecipeLane
              title="Recently Added 🆕"
              recipes={recent}
              onRecipeClick={onSelect}
            />

            <div className="mt-8 px-4 sm:px-0">
              <h3 className="text-xl font-bold text-gray-900 mb-4">All Recipes</h3>
              <button
                onClick={() => setViewMode('grid')}
                className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-terracotta-200 text-terracotta-700 font-semibold rounded-xl hover:bg-terracotta-50 hover:border-terracotta-300 transition shadow-sm flex items-center justify-center gap-2"
              >
                <span>Browse Full Library</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Grid View
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-terracotta-50 p-6 rounded-full mb-4">
          <Clock className="w-12 h-12 text-terracotta-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No recipes found</h3>
        <p className="text-gray-600 max-w-sm mb-8">
          Try adjusting your filters or add a new recipe to get started.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={onImportFromWeb}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Import from Web
          </button>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition shadow-sm"
          >
            Create Manually
          </button>
          <button
            onClick={onOpenChat}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition shadow-sm"
          >
            Generate with AI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">All Recipes</h3>
        <button
          onClick={() => setViewMode('dashboard')}
          className="text-terracotta-600 font-medium hover:underline"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => onSelect(recipe)}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer texture-subtle"
          >
            <div className="h-48 overflow-hidden relative">
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <span className="text-4xl">🍳</span>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900 leading-tight flex-1">{recipe.title}</h3>
                <div className="flex gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(recipe);
                    }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit Recipe"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => onDelete(recipe.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Recipe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{recipe.servings}</span>
                </div>
              </div>

              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {recipe.description || 'No description provided.'}
              </p>

              <div className="flex flex-wrap gap-2">
                {recipe.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                    {tag}
                  </span>
                ))}
                {(recipe.tags?.length || 0) > 3 && (
                  <span className="px-2 py-1 bg-gray-50 text-gray-400 rounded-md text-xs">
                    +{recipe.tags!.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-white border-2 border-terracotta-200 text-terracotta-700 font-semibold rounded-xl hover:bg-terracotta-50 hover:border-terracotta-300 transition shadow-sm"
          >
            Load More Recipes
          </button>
        </div>
      )}
    </div>
  );
}
