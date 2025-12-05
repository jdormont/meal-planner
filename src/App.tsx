import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
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
import { supabase, Recipe, Meal, MealWithRecipes } from './lib/supabase';
import { Plus, LogOut, ChefHat, MessageSquare, BookOpen, Settings as SettingsIcon, Calendar, Shield, Users } from 'lucide-react';

function App() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [communityRecipes, setCommunityRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [filteredCommunityRecipes, setFilteredCommunityRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [meals, setMeals] = useState<MealWithRecipes[]>([]);
  const [showMeals, setShowMeals] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealWithRecipes | null>(null);
  const [editingMealRecipeIds, setEditingMealRecipeIds] = useState<string[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecipes();
      loadCommunityRecipes();
      loadMeals();
    }
  }, [user]);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchTerm, selectedTags]);

  useEffect(() => {
    filterCommunityRecipes();
  }, [communityRecipes, searchTerm, selectedTags]);

  const loadRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_shared', true)
        .neq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunityRecipes(data || []);
    } catch (error) {
      console.error('Error loading community recipes:', error);
    }
  };

  const filterRecipes = () => {
    let filtered = [...recipes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((recipe) => {
        const titleMatch = recipe.title.toLowerCase().includes(term);
        const descMatch = recipe.description.toLowerCase().includes(term);
        const ingredientMatch = recipe.ingredients.some((ing) =>
          ing.name.toLowerCase().includes(term)
        );
        return titleMatch || descMatch || ingredientMatch;
      });
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((recipe) =>
        selectedTags.some((tag) => recipe.tags.includes(tag))
      );
    }

    setFilteredRecipes(filtered);
  };

  const filterCommunityRecipes = () => {
    let filtered = [...communityRecipes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((recipe) => {
        const titleMatch = recipe.title.toLowerCase().includes(term);
        const descMatch = recipe.description.toLowerCase().includes(term);
        const ingredientMatch = recipe.ingredients.some((ing) =>
          ing.name.toLowerCase().includes(term)
        );
        return titleMatch || descMatch || ingredientMatch;
      });
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((recipe) =>
        selectedTags.some((tag) => recipe.tags.includes(tag))
      );
    }

    setFilteredCommunityRecipes(filtered);
  };

  const getAllTags = () => {
    const tagSet = new Set<string>();
    const recipesToScan = showCommunity ? communityRecipes : recipes;
    recipesToScan.forEach((recipe) => {
      recipe.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const saveRecipe = async (recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingRecipe && !editingRecipe.id.startsWith('temp-')) {
        const { error } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', editingRecipe.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recipes')
          .insert([{ ...recipeData, user_id: user!.id }]);

        if (error) throw error;
      }

      await loadRecipes();
      setShowForm(false);
      setEditingRecipe(null);
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id);

      if (error) throw error;
      await loadRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe. Please try again.');
    }
  };

  const copyRecipe = async (recipe: Recipe) => {
    try {
      const { error } = await supabase.from('recipes').insert([{
        user_id: user!.id,
        title: `${recipe.title} (Copy)`,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        servings: recipe.servings,
        tags: recipe.tags,
        image_url: recipe.image_url,
        source_url: recipe.source_url,
        notes: recipe.notes,
        is_shared: false,
      }]);

      if (error) throw error;
      await loadRecipes();
      setShowCommunity(false);
      alert('Recipe copied to your collection!');
    } catch (error) {
      console.error('Error copying recipe:', error);
      alert('Failed to copy recipe. Please try again.');
    }
  };

  const loadMeals = async () => {
    try {
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .eq('is_archived', false)
        .order('date', { ascending: true });

      if (mealsError) throw mealsError;

      const mealsWithRecipes: MealWithRecipes[] = await Promise.all(
        (mealsData || []).map(async (meal) => {
          const { data: mealRecipes, error: mrError } = await supabase
            .from('meal_recipes')
            .select('*, recipe:recipes(*)')
            .eq('meal_id', meal.id)
            .order('sort_order', { ascending: true });

          if (mrError) throw mrError;

          return {
            ...meal,
            recipes: mealRecipes || [],
          };
        })
      );

      setMeals(mealsWithRecipes);
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  };

  const saveMeal = async (
    mealData: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    recipeIds: string[]
  ) => {
    try {
      let mealId: string;

      if (editingMeal) {
        const { error } = await supabase
          .from('meals')
          .update({ ...mealData, updated_at: new Date().toISOString() })
          .eq('id', editingMeal.id);

        if (error) throw error;
        mealId = editingMeal.id;

        await supabase.from('meal_recipes').delete().eq('meal_id', mealId);
      } else {
        const { data, error } = await supabase
          .from('meals')
          .insert([{ ...mealData, user_id: user!.id }])
          .select()
          .single();

        if (error) throw error;
        mealId = data.id;
      }

      if (recipeIds.length > 0) {
        const mealRecipes = recipeIds.map((recipeId, index) => ({
          meal_id: mealId,
          recipe_id: recipeId,
          user_id: user!.id,
          sort_order: index,
          is_completed: false,
        }));

        const { error: mrError } = await supabase
          .from('meal_recipes')
          .insert(mealRecipes);

        if (mrError) throw mrError;
      }

      await loadMeals();
      setShowMealForm(false);
      setEditingMeal(null);
      setEditingMealRecipeIds([]);
    } catch (error) {
      console.error('Error saving meal:', error);
      alert('Failed to save meal. Please try again.');
    }
  };

  const deleteMeal = async (id: string) => {
    try {
      const { error } = await supabase.from('meals').delete().eq('id', id);

      if (error) throw error;
      await loadMeals();
      setSelectedMeal(null);
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal. Please try again.');
    }
  };

  const toggleRecipeCompletion = async (mealRecipeId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('meal_recipes')
        .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
        .eq('id', mealRecipeId);

      if (error) throw error;
      await loadMeals();

      if (selectedMeal) {
        const updatedMeal = meals.find(m => m.id === selectedMeal.id);
        if (updatedMeal) {
          setSelectedMeal(updatedMeal);
        }
      }
    } catch (error) {
      console.error('Error toggling recipe completion:', error);
    }
  };

  const parseAIRecipe = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim());
    let title = 'AI Suggested Recipe';
    let description = '';
    const ingredients: Array<{ name: string; quantity: string; unit: string }> = [];
    const instructions: string[] = [];
    let section: 'none' | 'ingredients' | 'instructions' = 'none';
    let prepTime = 0;
    let cookTime = 0;

    lines.forEach((line) => {
      const lowerLine = line.toLowerCase();

      // Parse prep time
      const prepMatch = line.match(/\*?\*?prep\s+time\*?\*?:?\s*(\d+)\s*(?:min|minutes?)/i);
      if (prepMatch) {
        prepTime = parseInt(prepMatch[1]);
        return;
      }

      // Parse cook time
      const cookMatch = line.match(/\*?\*?cook\s+time\*?\*?:?\s*(\d+)\s*(?:min|minutes?)/i);
      if (cookMatch) {
        cookTime = parseInt(cookMatch[1]);
        return;
      }

      if (lines.indexOf(line) === 0 && !lowerLine.includes('ingredient') && !lowerLine.includes('instruction')) {
        title = line.replace(/^#+ /, '').trim();
      } else if (lowerLine.includes('ingredient')) {
        section = 'ingredients';
      } else if (lowerLine.includes('instruction') || lowerLine.includes('direction') || lowerLine.includes('step')) {
        section = 'instructions';
      } else if (section === 'ingredients' && line.match(/^[-*•]\s/)) {
        const cleaned = line.replace(/^[-*•]\s/, '').trim();
        const parts = cleaned.match(/^([\d./]+)?\s*([a-z]+)?\s*(.+)$/i);
        if (parts) {
          ingredients.push({
            quantity: parts[1]?.trim() || '1',
            unit: parts[2]?.trim() || '',
            name: parts[3]?.trim() || cleaned,
          });
        } else {
          ingredients.push({ quantity: '', unit: '', name: cleaned });
        }
      } else if (section === 'instructions' && line.match(/^(\d+\.|-|\*|•)/)) {
        instructions.push(line.replace(/^(\d+\.|-|\*|•)\s*/, '').trim());
      } else if (section === 'none' && !lowerLine.includes('recipe') && !lowerLine.includes('prep time') && !lowerLine.includes('cook time')) {
        description += (description ? ' ' : '') + line.trim();
      }
    });

    const parsedRecipe: Recipe = {
      id: 'temp-ai-recipe',
      user_id: user!.id,
      title,
      description: description.substring(0, 500),
      ingredients: ingredients.length > 0 ? ingredients : [{ name: '', quantity: '', unit: '' }],
      instructions: instructions.length > 0 ? instructions : [''],
      prep_time_minutes: prepTime,
      cook_time_minutes: cookTime,
      servings: 4,
      tags: ['AI Generated'],
      notes: 'Recipe generated by AI assistant',
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEditingRecipe(parsedRecipe);
    setShowForm(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-pulse" />
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (userProfile.status === 'PENDING' || userProfile.status === 'REJECTED') {
    return <AccountStatus />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChefHat className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recipe Manager</h1>
                <p className="text-sm text-gray-600">Organize, plan, and discover recipes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {userProfile.is_admin && (
                <button
                  onClick={() => {
                    setShowAdmin(!showAdmin);
                    setShowMeals(false);
                    setShowChat(false);
                    setShowSettings(false);
                  }}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium ${
                    showAdmin
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Admin
                </button>
              )}
              <button
                onClick={() => {
                  setShowMeals(false);
                  setShowChat(false);
                  setShowSettings(false);
                  setShowAdmin(false);
                  setShowCommunity(false);
                  setSelectedRecipe(null);
                }}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium ${
                  !showMeals && !showChat && !showSettings && !showAdmin && !showCommunity
                    ? 'bg-orange-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                My Recipes
              </button>
              <button
                onClick={() => {
                  setShowCommunity(!showCommunity);
                  setShowMeals(false);
                  setShowChat(false);
                  setShowSettings(false);
                  setShowAdmin(false);
                  setSearchTerm('');
                  setSelectedTags([]);
                }}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium ${
                  showCommunity
                    ? 'bg-orange-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                Community
              </button>
              <button
                onClick={() => {
                  setShowMeals(!showMeals);
                  setShowChat(false);
                  setShowSettings(false);
                  setShowAdmin(false);
                  setShowCommunity(false);
                }}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium ${
                  showMeals
                    ? 'bg-orange-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-5 h-5" />
                Meals
              </button>
              <button
                onClick={() => {
                  setShowChat(!showChat);
                  setShowSettings(false);
                  setShowMeals(false);
                  setShowAdmin(false);
                  setShowCommunity(false);
                }}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium ${
                  showChat
                    ? 'bg-orange-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                AI Assistant
              </button>
              {!showCommunity && (
                <button
                  onClick={() => {
                    if (showMeals) {
                      setEditingMeal(null);
                      setEditingMealRecipeIds([]);
                      setShowMealForm(true);
                    } else {
                      setEditingRecipe(null);
                      setShowForm(true);
                    }
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  {showMeals ? 'New Meal' : 'New Recipe'}
                </button>
              )}
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowChat(false);
                  setShowMeals(false);
                  setShowAdmin(false);
                  setShowCommunity(false);
                }}
                className={`p-2 rounded-lg transition ${
                  showSettings
                    ? 'bg-orange-100 text-orange-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Settings"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
              <button
                onClick={signOut}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {showAdmin ? (
          <AdminDashboard />
        ) : showSettings ? (
          <Settings />
        ) : showChat ? (
          <div className="h-[calc(100vh-10rem)]">
            <AIChat onSaveRecipe={parseAIRecipe} />
          </div>
        ) : showCommunity ? (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Loading community recipes...</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Recipes</h2>
                  <p className="text-gray-600">
                    Discover and copy recipes shared by other users
                  </p>
                </div>
                <RecipeSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedTags={selectedTags}
                  onTagToggle={toggleTag}
                  availableTags={getAllTags()}
                />
                <CommunityRecipes
                  recipes={filteredCommunityRecipes}
                  onSelect={setSelectedRecipe}
                  onCopy={copyRecipe}
                  currentUserId={user!.id}
                />
              </>
            )}
          </div>
        ) : showMeals ? (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-pulse" />
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
                <BookOpen className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Loading your recipes...</p>
              </div>
            ) : (
              <>
                <RecipeSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedTags={selectedTags}
                  onTagToggle={toggleTag}
                  availableTags={getAllTags()}
                />
                <RecipeList
                  recipes={filteredRecipes}
                  onEdit={(recipe) => {
                    setEditingRecipe(recipe);
                    setShowForm(true);
                  }}
                  onDelete={deleteRecipe}
                  onSelect={setSelectedRecipe}
                  onCreateNew={() => {
                    setEditingRecipe(null);
                    setShowForm(true);
                  }}
                  onOpenChat={() => {
                    setShowChat(true);
                  }}
                />
              </>
            )}
          </div>
        )}
      </main>

      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onSave={saveRecipe}
          onCancel={() => {
            setShowForm(false);
            setEditingRecipe(null);
          }}
          onDelete={editingRecipe && !editingRecipe.id.startsWith('temp-') ? async () => {
            if (confirm('Are you sure you want to delete this recipe?')) {
              await deleteRecipe(editingRecipe.id);
              setShowForm(false);
              setEditingRecipe(null);
            }
          } : undefined}
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
          onCopy={copyRecipe}
        />
      )}

      {showMealForm && (
        <MealForm
          meal={editingMeal}
          recipes={[...recipes, ...communityRecipes]}
          selectedRecipeIds={editingMealRecipeIds}
          onSave={saveMeal}
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
          onToggleRecipeCompletion={toggleRecipeCompletion}
          onViewRecipe={(recipe) => {
            setSelectedRecipe(recipe);
          }}
          onEdit={() => {
            setEditingMeal(selectedMeal);
            setEditingMealRecipeIds(selectedMeal.recipes.map(mr => mr.recipe_id));
            setSelectedMeal(null);
            setShowMealForm(true);
          }}
          onDelete={() => deleteMeal(selectedMeal.id)}
        />
      )}
    </div>
  );
}

export default App;
