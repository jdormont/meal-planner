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
import { RecipeImportModal } from './components/RecipeImportModal';
import { RecipePhotoModal } from './components/RecipePhotoModal';
import { supabase, Recipe, Meal, MealWithRecipes } from './lib/supabase';
import { Plus, LogOut, ChefHat, MessageSquare, BookOpen, Settings as SettingsIcon, Calendar, Shield, Users, Menu, User, Globe, Wine, Camera } from 'lucide-react';

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
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('');
  const [meals, setMeals] = useState<MealWithRecipes[]>([]);
  const [showMeals, setShowMeals] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealWithRecipes | null>(null);
  const [editingMealRecipeIds, setEditingMealRecipeIds] = useState<string[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [recipeType, setRecipeType] = useState<'food' | 'cocktail'>('food');

  useEffect(() => {
    if (user) {
      loadRecipes();
      loadCommunityRecipes();
      loadMeals();
    }
  }, [user]);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchTerm, selectedTags, recipeType, selectedTimeFilter]);

  useEffect(() => {
    filterCommunityRecipes();
  }, [communityRecipes, searchTerm, selectedTags, selectedTimeFilter]);

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunityRecipes(data || []);
    } catch (error) {
      console.error('Error loading community recipes:', error);
    }
  };

  const filterRecipes = () => {
    let filtered = [...recipes].filter((recipe) => recipe.recipe_type === recipeType);

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

    if (selectedTimeFilter) {
      filtered = filtered.filter((recipe) => {
        const totalMinutes = recipe.prep_time_minutes + recipe.cook_time_minutes;
        switch (selectedTimeFilter) {
          case 'quick':
            return totalMinutes <= 30;
          case 'medium':
            return totalMinutes > 30 && totalMinutes <= 45;
          case 'hour':
            return totalMinutes > 45 && totalMinutes <= 90;
          case 'project':
            return totalMinutes > 90;
          default:
            return true;
        }
      });
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

    if (selectedTimeFilter) {
      filtered = filtered.filter((recipe) => {
        const totalMinutes = recipe.prep_time_minutes + recipe.cook_time_minutes;
        switch (selectedTimeFilter) {
          case 'quick':
            return totalMinutes <= 30;
          case 'medium':
            return totalMinutes > 30 && totalMinutes <= 45;
          case 'hour':
            return totalMinutes > 45 && totalMinutes <= 90;
          case 'project':
            return totalMinutes > 90;
          default:
            return true;
        }
      });
    }

    setFilteredCommunityRecipes(filtered);
  };

  const getAllTags = () => {
    const tagSet = new Set<string>();
    const recipesToScan = showCommunity ? communityRecipes : recipes;
    recipesToScan
      .filter((recipe) => recipe.recipe_type === recipeType)
      .forEach((recipe) => {
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
      if (editingRecipe && editingRecipe.id && !editingRecipe.id.startsWith('temp-')) {
        const { error } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', editingRecipe.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recipes')
          .insert([{ ...recipeData, user_id: user!.id, recipe_type: recipeData.recipe_type || recipeType }]);

        if (error) throw error;
      }

      await loadRecipes();
      await loadCommunityRecipes();
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
      await loadCommunityRecipes();
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

  const parseAIRecipe = (text: string, userQuery?: string) => {
    const lines = text.split('\n').filter((line) => line.trim());
    let title = 'AI Suggested Recipe';
    let description = '';
    const ingredients: Array<{ name: string; quantity: string; unit: string }> = [];
    const instructions: string[] = [];
    let section: 'none' | 'ingredients' | 'instructions' = 'none';
    let prepTime = 0;
    let cookTime = 0;
    let titleFound = false;
    const descriptionLines: string[] = [];

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();

      // Parse prep time - handle formats like "**Prep Time:** 10 minutes" or "Prep Time: 10 minutes"
      const prepMatch = line.match(/\*?\*?prep\s+time:?\*?\*?\s*(\d+)/i);
      if (prepMatch) {
        prepTime = parseInt(prepMatch[1]);
        return;
      }

      // Parse cook time - handle formats like "**Cook Time:** 30 minutes" or "Cook Time: 30 minutes"
      const cookMatch = line.match(/\*?\*?cook\s+time:?\*?\*?\s*(\d+)/i);
      if (cookMatch) {
        cookTime = parseInt(cookMatch[1]);
        return;
      }

      // Look for the first markdown heading as the recipe title
      if (!titleFound && line.match(/^#{1,3}\s+/)) {
        title = line.replace(/^#+\s+/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
        titleFound = true;
        return;
      }

      if (lowerLine.includes('ingredient')) {
        section = 'ingredients';
        // Convert accumulated description lines to description
        if (descriptionLines.length > 0) {
          description = descriptionLines.join(' ').trim();
        }
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
      } else if (section === 'none' && titleFound && !lowerLine.includes('prep time') && !lowerLine.includes('cook time') && !lowerLine.includes('servings')) {
        // Collect lines after the title but before ingredients as description
        descriptionLines.push(line.trim());
      }
    });

    // Check if the user explicitly asked for a drink or cocktail
    const userQueryLower = userQuery?.toLowerCase() || '';
    const userAskedForDrink = userQueryLower.includes('drink') ||
                               userQueryLower.includes('cocktail') ||
                               userQueryLower.includes('beverage') ||
                               userQueryLower.includes('martini') ||
                               userQueryLower.includes('mojito') ||
                               userQueryLower.includes('margarita');

    // If user didn't ask for a drink/cocktail, default to food
    let isCocktail = false;

    if (userAskedForDrink) {
      const titleLower = title.toLowerCase();

      // Only classify as cocktail if there's explicit cocktail terminology in the title
      const hasCocktailTitle = titleLower.includes('cocktail') ||
                                titleLower.includes('martini') ||
                                titleLower.includes('margarita') ||
                                titleLower.includes('mojito') ||
                                titleLower.includes('daiquiri') ||
                                titleLower.includes('old fashioned') ||
                                titleLower.includes('negroni') ||
                                titleLower.includes('manhattan') ||
                                titleLower.includes('gimlet') ||
                                titleLower.includes('cosmopolitan') ||
                                titleLower.includes('sidecar') ||
                                titleLower.includes('mai tai');

      // Count spirit-based ingredients (be very specific to avoid false positives)
      const spiritKeywords = [
        'vodka', 'gin', 'rum', 'tequila', 'whiskey', 'whisky',
        'bourbon', 'scotch', 'cognac', 'brandy', 'vermouth',
        'aperol', 'campari', 'amaretto',
        'benedictine', 'chartreuse', 'mezcal', 'pisco'
      ];

      const hasSpirit = ingredients.some(ing => {
        const ingLower = ing.name.toLowerCase();
        return spiritKeywords.some(spirit => {
          const regex = new RegExp(`\\b${spirit}\\b`, 'i');
          return regex.test(ingLower);
        });
      });

      // Check for classic cocktail-only ingredients
      const hasCocktailIngredients = ingredients.some(ing => {
        const ingLower = ing.name.toLowerCase();
        return ingLower.includes('simple syrup') ||
               ingLower.match(/\b(bitters?|maraschino|orgeat|falernum)\b/) !== null;
      });

      // Only classify as cocktail if it's very obvious
      isCocktail = hasCocktailTitle || (hasSpirit && hasCocktailIngredients);
    }

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
      recipe_type: isCocktail ? 'cocktail' : 'food',
      cocktail_metadata: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEditingRecipe(parsedRecipe);
    setShowForm(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream-200 texture-linen flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-terracotta-500 mx-auto mb-4 animate-pulse" />
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
          <ChefHat className="w-16 h-16 text-terracotta-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (userProfile.status === 'PENDING' || userProfile.status === 'REJECTED') {
    return <AccountStatus />;
  }

  return (
    <div className="min-h-screen bg-cream-200 texture-linen">
      <header className="bg-cream-50 shadow-sm border-b border-sage-200">
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-6 lg:px-8 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-sage-200 rounded-2xl flex-shrink-0">
                <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-sage-700" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Recipe Manager</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Organize, plan, and discover recipes</p>
              </div>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setShowMeals(false);
                  setShowChat(false);
                  setShowSettings(false);
                  setShowAdmin(false);
                  setShowCommunity(false);
                  setSelectedRecipe(null);
                }}
                className={`px-2 sm:px-3 py-2 min-h-[44px] rounded-xl transition flex items-center gap-1 sm:gap-2 font-medium touch-manipulation ${
                  !showMeals && !showChat && !showSettings && !showAdmin && !showCommunity
                    ? 'bg-terracotta-500 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-sage-100'
                }`}
                title="My Recipes"
              >
                <BookOpen className="w-5 h-5" />
                <span className="hidden md:inline">My Recipes</span>
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
                className={`px-2 sm:px-3 py-2 min-h-[44px] rounded-xl transition flex items-center gap-1 sm:gap-2 font-medium touch-manipulation ${
                  showCommunity
                    ? 'bg-terracotta-500 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-sage-100'
                }`}
                title="Community Recipes"
              >
                <Users className="w-5 h-5" />
                <span className="hidden md:inline">Community</span>
              </button>
              <button
                onClick={() => {
                  setShowMeals(!showMeals);
                  setShowChat(false);
                  setShowSettings(false);
                  setShowAdmin(false);
                  setShowCommunity(false);
                }}
                className={`px-2 sm:px-3 py-2 min-h-[44px] rounded-xl transition flex items-center gap-1 sm:gap-2 font-medium touch-manipulation ${
                  showMeals
                    ? 'bg-terracotta-500 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-sage-100'
                }`}
                title="Meal Planning"
              >
                <Calendar className="w-5 h-5" />
                <span className="hidden md:inline">Meals</span>
              </button>
              <button
                onClick={() => {
                  setShowChat(!showChat);
                  setShowSettings(false);
                  setShowMeals(false);
                  setShowAdmin(false);
                  setShowCommunity(false);
                }}
                className={`px-2 sm:px-3 py-2 min-h-[44px] rounded-xl transition flex items-center gap-1 sm:gap-2 font-medium touch-manipulation ${
                  showChat
                    ? 'bg-terracotta-500 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-sage-100'
                }`}
                title="AI Assistant"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="hidden md:inline">AI</span>
              </button>

              <div className="hidden sm:block h-6 w-px bg-gray-300 mx-1"></div>

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
                  className="px-2 sm:px-3 py-2 min-h-[44px] bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl transition flex items-center gap-1 sm:gap-2 font-medium shadow-sm touch-manipulation"
                  title={showMeals ? 'New Meal' : 'New Recipe'}
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden lg:inline">{showMeals ? 'New' : 'New'}</span>
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 min-h-[44px] min-w-[44px] text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition flex items-center justify-center touch-manipulation"
                  title="User menu"
                >
                  <User className="w-5 h-5" />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      {userProfile.is_admin && (
                        <button
                          onClick={() => {
                            setShowAdmin(!showAdmin);
                            setShowMeals(false);
                            setShowChat(false);
                            setShowSettings(false);
                            setShowCommunity(false);
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowSettings(!showSettings);
                          setShowChat(false);
                          setShowMeals(false);
                          setShowAdmin(false);
                          setShowCommunity(false);
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        Settings
                      </button>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={signOut}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
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
                    availableTags={getAllTags()}
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
                    setShowCommunity(false);
                  }}
                  currentUserId={user!.id}
                />
              </>
            )}
          </div>
        ) : showMeals ? (
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
                        className={`px-3 sm:px-4 py-2 min-h-[44px] rounded-lg transition flex items-center gap-2 font-medium touch-manipulation ${
                          recipeType === 'food'
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
                        className={`px-3 sm:px-4 py-2 min-h-[44px] rounded-lg transition flex items-center gap-2 font-medium touch-manipulation ${
                          recipeType === 'cocktail'
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
                    availableTags={getAllTags()}
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
                  onDelete={deleteRecipe}
                  onSelect={setSelectedRecipe}
                  onCreateNew={() => {
                    setEditingRecipe(null);
                    setShowForm(true);
                  }}
                  onOpenChat={() => {
                    setShowChat(true);
                  }}
                  onImportFromWeb={() => {
                    setShowImportModal(true);
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
          onDelete={editingRecipe && editingRecipe.id && !editingRecipe.id.startsWith('temp-') ? async () => {
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
    </div>
  );
}

export default App;
