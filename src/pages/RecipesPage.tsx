import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useRecipes } from '../hooks/useRecipes';
import { useAuth } from '../contexts/AuthContext';
import { RecipeSearch } from '../components/RecipeSearch';
import { RecipeList } from '../components/RecipeList';
import { RecipeForm } from '../components/RecipeForm';
import { RecipeDetail } from '../components/RecipeDetail';
import { RecipeImportModal } from '../components/RecipeImportModal';
import { RecipePhotoModal } from '../components/RecipePhotoModal';
import { ProfileNudgeModal } from '../components/ProfileNudgeModal';
import { recipeService } from '../services/recipeService';
import { Recipe } from '../lib/supabase';
import { Plus, BookOpen, Sparkles, Camera, Share2, Globe, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';

export function RecipesPage() {
  const [, setLocation] = useLocation();

  // Route matches for deep linking
  const [matchNew] = useRoute('/new');
  const [matchImport] = useRoute('/import');
  const [matchScan] = useRoute('/scan');
  const [matchDetail, paramsDetail] = useRoute('/:id');
  const [matchEdit, paramsEdit] = useRoute('/:id/edit');

  const {
    recipes,
    loading,
    searchTerm,
    setSearchTerm,
    selectedTags,
    setSelectedTags,
    selectedTimeFilter,
    setSelectedTimeFilter,
    recipeType,
    setRecipeType,
    saveRecipe,
    deleteRecipe,
    copyRecipe,
    getAllTags,
    toggleTag,
    loadMore,
    hasMore,
    executeSearch
  } = useRecipes();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showProfileNudge, setShowProfileNudge] = useState(false);

  // Helper for checking onboarding nudge
  const checkFirstRecipeNudge = () => {
    if (recipes.length === 0) {
      setShowProfileNudge(true);
    }
  };

  const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const isNewRecipe = !paramsEdit?.id;
    const success = await saveRecipe(recipeData, paramsEdit?.id);
    if (success) {
      setLocation('/');
      if (isNewRecipe) {
        checkFirstRecipeNudge();
      }
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      const success = await deleteRecipe(id);
      if (success) {
        setLocation('/');
      } else {
        showError('Failed to delete recipe. Please try again.');
      }
    }
  };

  const handleCopyRecipe = async (recipe: Recipe) => {
    const success = await copyRecipe(recipe);
    if (success) {
      setLocation('/');
      showSuccess('Recipe copied to your collection!');
    }
  };

  return (
    <div className="relative">
      {recipes.length > 0 && (
        <>
          {/* Floating Action Button for Add Recipe - Visible on all devices */}
          <div className="fixed bottom-6 right-6 z-50">
            <div className={`absolute bottom-full right-0 mb-4 flex flex-col items-end gap-3 transition-all duration-200 ${showAddMenu ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <button
                onClick={() => {
                  setLocation('~/chat');
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2 pr-2"
              >
                <span className="bg-white px-3 py-1.5 rounded-lg shadow font-medium text-sm text-gray-700">Generate with AI</span>
                <div className="p-3 bg-indigo-500 text-white rounded-full shadow-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
              </button>
              <button
                onClick={() => {
                  setLocation('/scan');
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2 pr-2"
              >
                <span className="bg-white px-3 py-1.5 rounded-lg shadow font-medium text-sm text-gray-700">Scan Photo</span>
                <div className="p-3 bg-warmtan-500 text-white rounded-full shadow-lg">
                  <Camera className="w-5 h-5" />
                </div>
              </button>
              <button
                onClick={() => {
                  setLocation('/import');
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2 pr-2"
              >
                <span className="bg-white px-3 py-1.5 rounded-lg shadow font-medium text-sm text-gray-700">Import Social</span>
                <div className="p-3 bg-pink-500 text-white rounded-full shadow-lg">
                  <Share2 className="w-5 h-5" />
                </div>
              </button>
              <button
                onClick={() => {
                  setLocation('/import');
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2 pr-2"
              >
                <span className="bg-white px-3 py-1.5 rounded-lg shadow font-medium text-sm text-gray-700">Import Web</span>
                <div className="p-3 bg-sage-500 text-white rounded-full shadow-lg">
                  <Globe className="w-5 h-5" />
                </div>
              </button>
              <button
                onClick={() => {
                  setLocation('/new');
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2 pr-2"
              >
                <span className="bg-white px-3 py-1.5 rounded-lg shadow font-medium text-sm text-gray-700">Manually</span>
                <div className="p-3 bg-terracotta-500 text-white rounded-full shadow-lg">
                  <Plus className="w-5 h-5" />
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={`p-4 rounded-full shadow-xl transition-transform duration-200 ${showAddMenu ? 'bg-gray-800 rotate-45' : 'bg-terracotta-500 hover:bg-terracotta-600'
                } text-white`}
            >
              <Plus className="w-7 h-7" />
            </button>
            {showAddMenu && (
              <div className="fixed inset-0 z-[-1] bg-black/50 backdrop-blur-sm" onClick={() => setShowAddMenu(false)} />
            )}
          </div>
        </>
      )}

      {loading && recipes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-terracotta-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your recipes...</p>
        </div>
      ) : (
        <>
          {recipes.length > 0 && (
            <RecipeSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedTags={selectedTags}
              onTagToggle={toggleTag}
              availableTags={getAllTags(false)}
              recipeType={recipeType}
              selectedTimeFilter={selectedTimeFilter}
              onTimeFilterChange={setSelectedTimeFilter}
              onSearch={executeSearch}
              onRecipeTypeChange={(type) => {
                setRecipeType(type);
                setSelectedTags([]);
                setSelectedTimeFilter('');
              }}
            />
          )}
          <RecipeList
            recipes={recipes}
            isSearching={searchTerm.trim().length > 0 || selectedTags.length > 0 || !!selectedTimeFilter}
            onClearSearch={() => {
              setSearchTerm('');
              setSelectedTags([]);
              setSelectedTimeFilter('');
            }}
            onEdit={(recipe) => setLocation(`/${recipe.id}/edit`)}
            onDelete={handleDeleteRecipe}
            onSelect={(recipe) => setLocation(`/${recipe.id}`)}
            onCreateNew={() => setLocation('/new')}
            onOpenChat={() => setLocation('~/chat')}
            onImportFromWeb={() => setLocation('/import')}
            onLoadMore={loadMore}
            hasMore={hasMore}
            totalRecipeCount={recipes.length}
            onScanPhoto={() => setLocation('/scan')}
          />
        </>
      )}

      {/* Route-Driven Overlay Modals */}
      {matchNew && (
        <RecipeFormNewWrapper
          onSave={handleSaveRecipe}
          onCancel={() => setLocation('/')}
        />
      )}

      {matchEdit && paramsEdit?.id && (
        <RecipeEditWrapper
          recipeId={paramsEdit.id}
          onSave={handleSaveRecipe}
          onCancel={() => setLocation('/')}
          onDelete={handleDeleteRecipe}
        />
      )}

      {matchDetail && paramsDetail?.id && paramsDetail.id !== 'new' && paramsDetail.id !== 'import' && paramsDetail.id !== 'scan' && (
        <RecipeDetailWrapper
          recipeId={paramsDetail.id}
          onClose={() => setLocation('/')}
          onEdit={() => setLocation(`/${paramsDetail.id}/edit`)}
          onCopy={handleCopyRecipe}
        />
      )}

      {matchImport && (
        <RecipeImportModal
          onClose={() => setLocation('/')}
          onImportComplete={(recipe) => {
            sessionStorage.setItem('temp_import_recipe', JSON.stringify(recipe));
            setLocation('/new?source=import');
          }}
        />
      )}

      {matchScan && (
        <RecipePhotoModal
          onClose={() => setLocation('/')}
          onImportComplete={(recipe) => {
            sessionStorage.setItem('temp_import_recipe', JSON.stringify(recipe));
            setLocation('/new?source=scan');
          }}
        />
      )}

      {showProfileNudge && (
        <ProfileNudgeModal
          onClose={() => setShowProfileNudge(false)}
          onGoToSettings={() => {
            setLocation('~/settings');
            setShowProfileNudge(false);
          }}
        />
      )}
    </div>
  );
}

// Wrapper to fetch and display recipe details for deep linking
function RecipeDetailWrapper({ recipeId, onClose, onEdit, onCopy }: { recipeId: string; onClose: () => void; onEdit: () => void; onCopy: (recipe: Recipe) => void }) {
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

// Wrapper to fetch and edit recipe details for deep linking
function RecipeEditWrapper({ recipeId, onSave, onCancel, onDelete }: { recipeId: string; onSave: (recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void; onCancel: () => void; onDelete: (id: string) => void }) {
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
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <RecipeForm
      recipe={recipe}
      onSave={onSave}
      onCancel={onCancel}
      onDelete={() => onDelete(recipeId)}
    />
  );
}

// Wrapper to initialize a new recipe form, pre-filling it if scanned or imported
function RecipeFormNewWrapper({ onSave, onCancel }: { onSave: (recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void; onCancel: () => void }) {
  const { user } = useAuth();
  
  const [initialRecipe] = useState<Recipe | null>(() => {
    const storedStr = sessionStorage.getItem('temp_import_recipe');
    if (storedStr) {
      try {
        const parsed = JSON.parse(storedStr);
        return {
          ...parsed,
          id: parsed.id || `temp-${Date.now()}`,
          user_id: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Recipe;
      } catch (e) {
        console.error('Failed to parse temp_import_recipe', e);
      }
    }
    return null;
  });

  useEffect(() => {
    sessionStorage.removeItem('temp_import_recipe');
  }, []);

  return (
    <RecipeForm
      recipe={initialRecipe}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
