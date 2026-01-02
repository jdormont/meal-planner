import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useRecipes } from './hooks/useRecipes';
import { useMeals } from './hooks/useMeals';
import { Auth } from './components/Auth';
import { AccountStatus } from './components/AccountStatus';
import { AdminDashboard } from './components/AdminDashboard';
import { RecipeList } from './components/RecipeList';
import { RecipeForm } from './components/RecipeForm';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeSearch } from './components/RecipeSearch';
import { AIChat } from './components/AIChat';
import Settings from './components/Settings';
import { MealList } from './components/MealList';
import { MealForm } from './components/MealForm';
import { MealDetail } from './components/MealDetail';
import { CommunityRecipes } from './components/CommunityRecipes';
import { RecipeImportModal } from './components/RecipeImportModal';
import { RecipePhotoModal } from './components/RecipePhotoModal';
import { OnboardingInterstitial } from './components/OnboardingInterstitial';
import { Layout, View } from './components/Layout';
import { supabase, Recipe, Meal, MealWithRecipes } from './lib/supabase';
import { Plus, ChefHat, BookOpen, Globe, Wine, Camera, Users, Calendar } from 'lucide-react';
import { parseAIRecipe } from './utils/recipeParser';

function App() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth();

  const {
    recipes,
    communityRecipes,
    filteredRecipes,
    filteredCommunityRecipes,
    loading: recipesLoading,
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
    toggleTag
  } = useRecipes();

  const {
    meals,
    loading: mealsLoading,
    saveMeal,
    deleteMeal,
    toggleRecipeCompletion
  } = useMeals();

  // Combined loading state
  const [loading, setLoading] = useState(true);

  // Sync loading state
  useEffect(() => {
    setLoading(authLoading || recipesLoading || mealsLoading);
  }, [authLoading, recipesLoading, mealsLoading]);

  // Initial load handled by useRecipes and useMeals hooks

  // Initial load handled by useRecipes and useMeals hooks

  const [view, setView] = useState<View>('recipes');
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealWithRecipes | null>(null);
  const [editingMealRecipeIds, setEditingMealRecipeIds] = useState<string[]>([]);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showOnboardingInterstitial, setShowOnboardingInterstitial] = useState(false);


  // Removed filter effects as they are in the hook

  const checkAndShowOnboarding = async () => {
    if (!user || !userProfile) return;

    if (userProfile.has_seen_onboarding === false) {
      setShowOnboardingInterstitial(true);
      await markOnboardingSeen();
    }
  };

  const markOnboardingSeen = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_profiles')
        .update({ has_seen_onboarding: true })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error marking onboarding as seen:', error);
    }
  };

  // Removed filterRecipes, filterCommunityRecipes, getAllTags, toggleTag as they are in the hook

  const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const success = await saveRecipe(recipeData, editingRecipe?.id);
    if (success) {
      setShowForm(false);
      setEditingRecipe(null);

      const isNewRecipe = !editingRecipe || !editingRecipe.id || editingRecipe.id.startsWith('temp-');
      if (isNewRecipe) {
        await checkAndShowOnboarding();
      }
    }
  };

  const handleCopyRecipe = async (recipe: Recipe) => {
    const success = await copyRecipe(recipe);
    if (success) {
      setView('recipes');
      alert('Recipe copied to your collection!');
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    const success = await deleteRecipe(id);
    if (!success) {
      alert('Failed to delete recipe. Please try again.');
    }
  };

  const handleSaveMeal = async (
    mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    recipeIds: string[]
  ) => {
    const success = await saveMeal(mealData, recipeIds, editingMeal?.id);
    if (success) {
      setShowMealForm(false);
      setEditingMeal(null);
      setEditingMealRecipeIds([]);
    } else {
      alert('Failed to save meal. Please try again.');
    }
  };

  const handleDeleteMeal = async (id: string) => {
    const success = await deleteMeal(id);
    if (success) {
      setSelectedMeal(null);
    } else {
      alert('Failed to delete meal. Please try again.');
    }
  };

  const handleToggleRecipeCompletion = async (mealRecipeId: string, isCompleted: boolean) => {
    const success = await toggleRecipeCompletion(mealRecipeId, isCompleted);
    if (success && selectedMeal) {
      // Optimistically update or re-select from meals
      // Since loadMeals is triggered in hook, meals will update
      // We rely on the hook's update to reflect changes, but we might need to update selectedMeal separately if it is not derived
      // Actually, selectedMeal is just the view state. The list will update.
    }
  };

  const handleAIRecipe = (text: string) => {
    const parsed = parseAIRecipe(text);

    setEditingRecipe({
      id: `temp-${Date.now()}`,
      user_id: user?.id || '',
      title: parsed.title,
      description: parsed.description,
      ingredients: parsed.ingredients,
      instructions: parsed.instructions,
      prep_time_minutes: parsed.prepTime,
      cook_time_minutes: parsed.cookTime,
      servings: 4,
      tags: ['AI Generated'],
      image_url: '',
      source_url: '',
      notes: '',
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recipe_type: recipeType
    });

    setShowForm(true);
  };



  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream-200 texture-linen flex items-center justify-center">
        <div className="text-center">
          <img src="/gemini_generated_image_9fuv9w9fuv9w9fuv-remove-background.com.png" alt="Sous" className="h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-cream-200 texture-linen flex items-center justify-center">
        <div className="text-center">
          <img src="/gemini_generated_image_9fuv9w9fuv9w9fuv-remove-background.com.png" alt="Sous" className="h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (userProfile.status === 'PENDING' || userProfile.status === 'REJECTED') {
    return <AccountStatus />;
  }

  return (

    <Layout
      currentView={view}
      onViewChange={(newView) => {
        setView(newView);
        if (newView !== 'recipes') {
          setSelectedRecipe(null);
          setEditingRecipe(null);
          setShowForm(false);
        }
        if (newView !== 'meals') {
          setSelectedMeal(null);
          setEditingMeal(null);
          setShowMealForm(false);
        }
      }}
      userProfile={userProfile}
      signOut={signOut}
      onNewRecipe={() => {
        setEditingRecipe(null);
        setShowForm(true);
      }}
      onNewMeal={() => {
        setEditingMeal(null);
        setEditingMealRecipeIds([]);
        setShowMealForm(true);
      }}
    >
      {view === 'admin' ? (
        <AdminDashboard />
      ) : view === 'settings' ? (
        <Settings />
      ) : view === 'chat' ? (
        <div className="h-[calc(100vh-10rem)]">
          <AIChat onSaveRecipe={handleAIRecipe} onFirstAction={checkAndShowOnboarding} />
        </div>
      ) : view === 'community' ? (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-terracotta-500 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading community recipes...</p>
            </div>
          ) : (
            <>
              {communityRecipes.length > 0 && (
                <div className="mb-6">
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
                />
              )}
              <CommunityRecipes
                recipes={filteredCommunityRecipes}
                onSelect={setSelectedRecipe}
                onCopy={copyRecipe}
                onEdit={(recipe) => {
                  setEditingRecipe(recipe);
                  setShowForm(true);
                  setView('recipes');
                }}
                currentUserId={user!.id}
              />
            </>
          )}
        </div>
      ) : view === 'meals' ? (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-terracotta-500 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading your meals...</p>
            </div>
          ) : (
            <MealList
              meals={meals}
              onSelect={setSelectedMeal}
              onCreateNew={() => {
                setEditingMeal(null);
                setEditingMealRecipeIds([]);
                setShowMealForm(true);
              }}
            />
          )}
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-terracotta-500 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading your recipes...</p>
            </div>
          ) : (
            <>
              {recipes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">My Recipes</h2>
                      <p className="text-gray-600 mt-1">
                        {filteredRecipes.length} {filteredRecipes.length === 1 ? (recipeType === 'cocktail' ? 'cocktail' : 'recipe') : (recipeType === 'cocktail' ? 'cocktails' : 'recipes')}
                      </p>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <button
                        onClick={() => setShowPhotoModal(true)}
                        className="px-3 sm:px-4 py-2 min-h-[44px] bg-warmtan-500 hover:bg-warmtan-600 text-white rounded-xl transition flex items-center gap-2 font-medium shadow-sm touch-manipulation"
                        title="Import from Photo"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="hidden sm:inline">Photo</span>
                      </button>
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="px-3 sm:px-4 py-2 min-h-[44px] bg-sage-500 hover:bg-sage-600 text-white rounded-xl transition flex items-center gap-2 font-medium shadow-sm touch-manipulation"
                        title="Import from Web"
                      >
                        <Globe className="w-5 h-5" />
                        <span className="hidden sm:inline">Web</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingRecipe(null);
                          setShowForm(true);
                        }}
                        className="px-3 sm:px-4 py-2 min-h-[44px] bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl transition flex items-center gap-2 font-medium shadow-sm touch-manipulation"
                        title={`New ${recipeType === 'cocktail' ? 'Cocktail' : 'Recipe'}`}
                      >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">New</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 p-1 bg-sage-100 rounded-xl w-fit">
                    <button
                      onClick={() => {
                        setRecipeType('food');
                        setSearchTerm('');
                        setSelectedTags([]);
                        setSelectedTimeFilter('');
                      }}
                      className={`px-3 sm:px-4 py-2 min-h-[44px] rounded-lg transition flex items-center gap-2 font-medium touch-manipulation ${recipeType === 'food'
                        ? 'bg-cream-50 text-terracotta-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                      title="Food Recipes"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span className="hidden sm:inline">Food Recipes</span>
                      <span className="sm:hidden">Food</span>
                    </button>
                    <button
                      onClick={() => {
                        setRecipeType('cocktail');
                        setSearchTerm('');
                        setSelectedTags([]);
                        setSelectedTimeFilter('');
                      }}
                      className={`px-3 sm:px-4 py-2 min-h-[44px] rounded-lg transition flex items-center gap-2 font-medium touch-manipulation ${recipeType === 'cocktail'
                        ? 'bg-cream-50 text-terracotta-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                      title="Cocktails"
                    >
                      <Wine className="w-4 h-4" />
                      Cocktails
                    </button>
                  </div>
                </div>
              )}
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
                />
              )}
              <RecipeList
                recipes={filteredRecipes}
                onEdit={(recipe) => {
                  setEditingRecipe(recipe);
                  setShowForm(true);
                }}
                onDelete={handleDeleteRecipe}
                onSelect={setSelectedRecipe}
                onCreateNew={() => {
                  setEditingRecipe(null);
                  setShowForm(true);
                }}
                onOpenChat={() => {
                  setView('chat');
                }}
                onImportFromWeb={() => {
                  setShowImportModal(true);
                }}
              />
            </>
          )}
        </div>
      )}

      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onSave={handleSaveRecipe}
          onCancel={() => {
            setShowForm(false);
            setEditingRecipe(null);
          }}
          onDelete={editingRecipe && editingRecipe.id && !editingRecipe.id.startsWith('temp-') ? async () => {
            if (confirm('Are you sure you want to delete this recipe?')) {
              const success = await deleteRecipe(editingRecipe.id);
              if (success) {
                setShowForm(false);
                setEditingRecipe(null);
              } else {
                alert('Failed to delete recipe. Please try again.');
              }
            }
          } : undefined}
        />
      )}



      {showMealForm && (
        <MealForm
          meal={editingMeal}
          recipes={[...recipes, ...communityRecipes]}
          selectedRecipeIds={editingMealRecipeIds}
          onSave={handleSaveMeal}
          onCancel={() => {
            setShowMealForm(false);
            setEditingMeal(null);
            setEditingMealRecipeIds([]);
          }}
        />
      )}

      {selectedMeal && (
        <MealDetail
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onToggleRecipeCompletion={handleToggleRecipeCompletion}
          onViewRecipe={(recipe) => {
            setSelectedRecipe(recipe);
          }}
          onEdit={() => {
            setEditingMeal(selectedMeal);
            setEditingMealRecipeIds(selectedMeal.recipes.map(mr => mr.recipe_id));
            setSelectedMeal(null);
            setShowMealForm(true);
          }}
          onDelete={() => selectedMeal && handleDeleteMeal(selectedMeal.id)}
        />
      )}

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={() => {
            setEditingRecipe(selectedRecipe);
            setSelectedRecipe(null);
            setShowForm(true);
          }}
          onCopy={handleCopyRecipe}
          onFirstAction={checkAndShowOnboarding}
        />
      )}

      {showImportModal && (
        <RecipeImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={(recipe) => {
            setEditingRecipe({
              ...recipe,
              id: `temp-${Date.now()}`,
              user_id: user!.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Recipe);
            setShowForm(true);
          }}
        />
      )}

      {showPhotoModal && (
        <RecipePhotoModal
          onClose={() => setShowPhotoModal(false)}
          onImportComplete={(recipe) => {
            setEditingRecipe({
              ...recipe,
              id: `temp-photo-${Date.now()}`,
              user_id: user!.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Recipe);
            setShowForm(true);
          }}
        />
      )}

      {showOnboardingInterstitial && (
        <OnboardingInterstitial onClose={() => setShowOnboardingInterstitial(false)} />
      )}
    </Layout>
  );
}

export default App;
