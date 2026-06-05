import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useRecipes } from '../hooks/useRecipes';
import { useMeals } from '../hooks/useMeals';
import { useAuth } from '../contexts/AuthContext';
import { WeeklyMealCarousel } from '../components/WeeklyMealCarousel';
import { RecipeSearch } from '../components/RecipeSearch';
import { CommunityRecipes } from '../components/CommunityRecipes';
import { RecipeDetail } from '../components/RecipeDetail';
import { recipeService } from '../services/recipeService';
import { Recipe } from '../lib/supabase';
import { Users, Loader2 } from 'lucide-react';
import { showSuccess } from '../utils/toast';

export function CommunityPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { loadMeals } = useMeals();

  const [matchDetail, paramsDetail] = useRoute('/recipes/:id');

  const {
    communityRecipes,
    filteredCommunityRecipes,
    loading,
    searchTerm,
    setSearchTerm,
    selectedTags,
    recipeType,
    selectedTimeFilter,
    setSelectedTimeFilter,
    toggleTag,
    getAllTags,
    executeSearch,
    copyRecipe,
  } = useRecipes();

  const handleCopyRecipe = async (recipe: Recipe) => {
    const success = await copyRecipe(recipe);
    if (success) {
      setLocation('~/recipes');
      showSuccess('Recipe copied to your collection!');
    }
  };

  return (
    <div>
      {loading && communityRecipes.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-terracotta-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading community recipes...</p>
        </div>
      ) : (
        <>
          <WeeklyMealCarousel onMealAdded={loadMeals} />

          {communityRecipes.length > 0 && (
            <div className="mb-6 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Recipes</h2>
              <p className="text-gray-600">
                Discover and copy recipes shared by other users
              </p>
            </div>
          )}

          {communityRecipes.length > 0 && (
            <RecipeSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedTags={selectedTags}
              onTagToggle={toggleTag}
              availableTags={getAllTags(true)}
              recipeType={recipeType}
              selectedTimeFilter={selectedTimeFilter}
              onTimeFilterChange={setSelectedTimeFilter}
              onSearch={executeSearch}
            />
          )}

          <CommunityRecipes
            recipes={filteredCommunityRecipes}
            onSelect={(recipe) => setLocation(`/recipes/${recipe.id}`)}
            onCopy={handleCopyRecipe}
            onEdit={(recipe) => setLocation(`~/recipes/${recipe.id}/edit`)}
            currentUserId={user!.id}
          />
        </>
      )}

      {/* Community Detail Overlay Modal */}
      {matchDetail && paramsDetail?.id && (
        <RecipeDetailWrapper
          recipeId={paramsDetail.id}
          onClose={() => setLocation('/')}
          onCopy={handleCopyRecipe}
          onEdit={() => setLocation(`~/recipes/${paramsDetail.id}/edit`)}
        />
      )}
    </div>
  );
}

function RecipeDetailWrapper({ recipeId, onClose, onCopy, onEdit }: { recipeId: string; onClose: () => void; onCopy: (recipe: Recipe) => void; onEdit: () => void }) {
  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => recipeService.getRecipe(recipeId),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <Loader2 className="w-8 h-8 text-terracotta-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading recipe details...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <p className="text-red-600 font-semibold mb-4">Failed to load recipe details.</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <RecipeDetail
      recipe={recipe}
      onClose={onClose}
      onEdit={onEdit}
      onCopy={onCopy}
      onOpenRecipe={(r) => onCopy(r)}
    />
  );
}
