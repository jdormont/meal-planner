import { MealCalendar, MealType } from './components/MealCalendar';

import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useRecipes } from './hooks/useRecipes';
import { useMeals } from './hooks/useMeals';
import { useAnalytics } from './hooks/useAnalytics';
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
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { Layout, View } from './components/Layout';
import { supabase, Recipe, Meal, MealWithRecipes } from './lib/supabase';
import { Plus, BookOpen, Globe, Camera, Users, Calendar, ChevronDown, Sparkles } from 'lucide-react';
import { parseAIRecipe, parseIngredient } from './utils/recipeParser';
import { RecipeSuggestion } from './components/RecipeSuggestionCard';
import { ProfileNudgeModal } from './components/ProfileNudgeModal';

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
    toggleTag,
    loadMore,
    hasMore
  } = useRecipes();

  const {
    meals,
    loading: mealsLoading,
    saveMeal,
    deleteMeal,
    moveMeal,
    removeRecipeFromMeal,
    toggleRecipeCompletion
  } = useMeals();

  // Combined loading state
  const [loading, setLoading] = useState(true);

  // Sync loading state
  useEffect(() => {
    setLoading(authLoading || recipesLoading || mealsLoading);
  }, [authLoading, recipesLoading, mealsLoading]);

  // Initial load handled by useRecipes and useMeals hooks
  const { pageView } = useAnalytics();

  const [view, setView] = useState<View>('recipes');
  const [mealViewMode, setMealViewMode] = useState<'calendar' | 'list'>('calendar');

  // Track page views for virtual routing
  useEffect(() => {
    let virtualPath = '/';
    switch (view) {
      case 'recipes':
        virtualPath = '/recipes';
        break;
      case 'meals':
        virtualPath = mealViewMode === 'calendar' ? '/calendar' : '/collections';
        break;
      case 'chat':
        virtualPath = '/ai-chat';
        break;
      case 'community':
        virtualPath = '/community';
        break;
      case 'admin':
        virtualPath = '/admin';
        break;
      case 'settings':
        virtualPath = '/settings';
        break;
      default:
        virtualPath = `/${view}`;
    }

    // Construct simplified URL without query params for cleaner analytics
    pageView(virtualPath);
  }, [view, mealViewMode, pageView]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealWithRecipes | null>(null);
  const [editingMealRecipeIds, setEditingMealRecipeIds] = useState<string[]>([]);

  // Default values for new meals from calendar
  const [defaultMealDate, setDefaultMealDate] = useState<string>('');
  const [defaultMealType, setDefaultMealType] = useState<MealType>('dinner');

  const [showImportModal, setShowImportModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // ... (keeping existing checkAndShowOnboarding, markOnboardingSeen, handleSaveRecipe, etc. as they are mostly unchanged logic-wise, just need to ensure imports are right) ...

  const checkAndShowOnboarding = async () => {
    if (!user || !userProfile) return;

    if (userProfile.has_seen_onboarding === false) {
      setShowOnboardingWizard(true);
      // Do NOT mark seen yet - wait for wizard completion
    }
  };

  // Check for onboarding on initial load
  useEffect(() => {
    if (!loading && user && userProfile) {
      checkAndShowOnboarding();
    }
  }, [loading, user, userProfile]);

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

  const handleWizardComplete = async (suggestion: RecipeSuggestion) => {
      setShowOnboardingWizard(false);
      await markOnboardingSeen();
      
      // Open the suggestion
      handleViewAIRecipe(suggestion);
  };

  const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    // Check if this is likely the first recipe (before saving)
    const isFirstRecipe = recipes.length === 0;

    const success = await saveRecipe(recipeData, editingRecipe?.id);
    if (success) {
      setShowForm(false);
      setEditingRecipe(null);

      const isNewRecipe = !editingRecipe || !editingRecipe.id || editingRecipe.id.startsWith('temp-');
      
      // If it's a new recipe AND it was the first one, show nudge
      if (isNewRecipe && isFirstRecipe) {
          setShowProfileNudge(true);
      }
      
      // Legacy onboarding check (can leave or remove if redundant)
      if (isNewRecipe) {
       // await checkAndShowOnboarding(); // We've moved away from generic onboarding check on save, trusting the Wizard flow instead or this Nudge.
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
      setDefaultMealDate(''); // Reset defaults
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
      // Optimistically update handled by hook re-fetch
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
      total_time: parsed.totalTime,
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

  const handleViewAIRecipe = (suggestion: RecipeSuggestion) => {
    // Convert AI suggestion with full_details to a Recipe object
    const tempRecipe: Recipe = {
      id: `temp-view-${Date.now()}`,
      user_id: user?.id || '',
      title: suggestion.title,
      description: suggestion.description,
      ingredients: suggestion.full_details?.ingredients.map((line: string) => parseIngredient(line)) || [],
      instructions: suggestion.full_details?.instructions || [],
      total_time: parseInt(suggestion.time_estimate) || 0, // Approximate
      servings: 4, // Default
      tags: ['AI Generated'],
      image_url: suggestion.image_url || '',
      source_url: '',
      notes: suggestion.full_details?.nutrition_notes || '',
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recipe_type: 'food' // Fixed type to match allowed values
    };

    setEditingRecipe(tempRecipe);
    setShowForm(true);
  };

  const handleCalendarAddMeal = (date: string, type: MealType) => {
    setDefaultMealDate(date);
    setDefaultMealType(type);
    setEditingMeal(null);
    setEditingMealRecipeIds([]);
    setShowMealForm(true);
  };

  // Filter meals for "Collections" view (is_event = true)
  const collectionMeals = meals.filter(meal => meal.is_event);

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
        setDefaultMealDate(new Date().toISOString().split('T')[0]);
        setShowMealForm(true);
      }}
    >
      {view === 'admin' ? (
        <AdminDashboard />
      ) : view === 'settings' ? (
        <Settings />
      ) : view === 'chat' ? (
        <div className="h-[calc(100vh-10rem)]">
          <AIChat
            onSaveRecipe={handleAIRecipe}
            onFirstAction={checkAndShowOnboarding}
            onViewRecipe={handleViewAIRecipe}
          />
        </div>
      ) : view === 'community' ? (
        <div>
          {/* ... existing community view ... */}
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
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMealViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition ${mealViewMode === 'calendar'
                ? 'bg-terracotta-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              Weekly Plan
            </button>
            <button
              onClick={() => setMealViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition ${mealViewMode === 'list'
                ? 'bg-terracotta-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              Collections
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-terracotta-500 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading your meals...</p>
            </div>
          ) : mealViewMode === 'calendar' ? (
            <MealCalendar
              meals={meals.filter(m => !m.is_event)}
              onMoveMeal={moveMeal}
              onAddMeal={handleCalendarAddMeal}
              onMealClick={setSelectedMeal}
              onRecipeClick={setSelectedRecipe}
              onRemoveRecipe={removeRecipeFromMeal}
            />
          ) : (
            <MealList
              meals={collectionMeals}
              onSelect={setSelectedMeal}
              onCreateNew={() => {
                setEditingMeal(null);
                setEditingMealRecipeIds([]);
                setShowMealForm(true);
                // Note: The form handles defaulting is_event based on user input, 
                // but we could set a default here if we wanted "New Collection" specifically
              }}
            />
          )}
        </div>
      ) : (
        <div>
          {/* ... existing recipes view ... */}
          {loading ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-terracotta-500 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading your recipes...</p>
            </div>
          ) : (
            <>
              {recipes.length > 0 && (
                <>
                  {/* Floating Action Button for Add Recipe - Visible on all devices */}
                  <div className="fixed bottom-6 right-6 z-50">
                    <div className={`absolute bottom-full right-0 mb-4 flex flex-col items-end gap-3 transition-all duration-200 ${showAddMenu ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                      <button
                        onClick={() => {
                          setView('chat');
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
                          setShowPhotoModal(true);
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
                          setShowImportModal(true);
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
                          setEditingRecipe(null);
                          setShowForm(true);
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
                  onRecipeTypeChange={(type) => {
                    setRecipeType(type);
                    if (type === 'cocktail') {
                      setSelectedTags([]);
                      setSelectedTimeFilter('');
                    } else {
                      setSelectedTags([]);
                      setSelectedTimeFilter('');
                    }
                  }}
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
                onLoadMore={loadMore}
                hasMore={hasMore}
                totalRecipeCount={recipes.length}
                onScanPhoto={() => setShowPhotoModal(true)}
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
            // Default reset
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
            setDefaultMealDate('');
            setDefaultMealType('dinner');
          }}
          initialDate={defaultMealDate}
          initialMealType={defaultMealType}
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
            setDefaultMealDate(selectedMeal.date);
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

      {showProfileNudge && (
        <ProfileNudgeModal 
            onClose={() => setShowProfileNudge(false)}
            onGoToSettings={() => {
                setView('settings');
                setShowProfileNudge(false);
            }}
        />
      )}

      {showOnboardingWizard && (
        <OnboardingWizard onComplete={handleWizardComplete} />
      )}
    </Layout>
  );
}



export default App;
