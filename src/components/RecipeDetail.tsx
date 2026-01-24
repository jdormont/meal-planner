import { useState, useEffect, useCallback } from 'react';
import { Recipe, RecipeRating, Meal, supabase } from '../lib/supabase';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { X, Clock, Users, Edit2, ExternalLink, ThumbsUp, ThumbsDown, Calendar, Copy, Share2, ShoppingCart } from 'lucide-react';
import { marked } from 'marked';
import { useAuth } from '../contexts/AuthContext';

type RecipeDetailProps = {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
  onCopy?: (recipe: Recipe) => void;
  onFirstAction?: () => void;
};

export function RecipeDetail({ recipe, onClose, onEdit, onCopy, onFirstAction }: RecipeDetailProps) {
  const { user } = useAuth();
  const isOwner = user?.id === recipe.user_id;
  const { addItem } = useShoppingList();
  const [currentRating, setCurrentRating] = useState<RecipeRating | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [pendingRating, setPendingRating] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [availableMeals, setAvailableMeals] = useState<Meal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [addingToMeal, setAddingToMeal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const totalTime = recipe.total_time;

  const handleAddToShoppingList = async () => {
    if (!user) return;
    setAddingToCart(true);
    try {
      const promises = recipe.ingredients.map(ingredient => {
        // Combined unit and name for better Instacart compatibility
        // e.g. unit="Sesame", name="seeds" -> "Sesame seeds"
        const combinedName = ingredient.unit 
          ? `${ingredient.unit} ${ingredient.name}`
          : ingredient.name;
          
        return addItem(combinedName, parseFloat(ingredient.quantity) || 1, 'each', recipe.id);
      });
      await Promise.all(promises);
      alert('Ingredients added to shopping list!');
    } catch (error) {
      console.error('Error adding to list:', error);
      alert('Failed to add ingredients to list.');
    } finally {
      setAddingToCart(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return { __html: marked(text, { breaks: true, gfm: true }) as string };
  };


  const loadCurrentRating = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('recipe_id', recipe.id)
      .eq('user_id', user.id)
      .maybeSingle();

    setCurrentRating(data);
  }, [user, recipe.id]);

  const loadAvailableMeals = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('is_archived', false)
      .order('date', { ascending: true });

    setAvailableMeals(data || []);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCurrentRating();
      loadAvailableMeals();
    }
  }, [user, loadCurrentRating, loadAvailableMeals]);

  const addRecipeToMeal = async () => {
    if (!user || !selectedMealId) return;

    setAddingToMeal(true);
    try {
      const { data: existingMealRecipes } = await supabase
        .from('meal_recipes')
        .select('sort_order')
        .eq('meal_id', selectedMealId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = existingMealRecipes && existingMealRecipes.length > 0
        ? existingMealRecipes[0].sort_order + 1
        : 0;

      const { error } = await supabase
        .from('meal_recipes')
        .insert({
          meal_id: selectedMealId,
          recipe_id: recipe.id,
          user_id: user.id,
          sort_order: nextSortOrder,
          is_completed: false,
        });

      if (error) {
        if (error.code === '23505') {
          alert('This recipe is already in the selected meal.');
        } else {
          throw error;
        }
      } else {
        setShowMealSelector(false);
        setSelectedMealId(null);
        alert('Recipe added to meal successfully!');
      }
    } catch (error) {
      console.error('Error adding recipe to meal:', error);
      alert('Failed to add recipe to meal. Please try again.');
    } finally {
      setAddingToMeal(false);
    }
  };

  const handleRatingClick = (rating: 'thumbs_up' | 'thumbs_down') => {
    setPendingRating(rating);
    setFeedback(currentRating?.feedback || '');
    setShowFeedbackDialog(true);
  };

  const submitRating = async () => {
    if (!user || !pendingRating) return;

    setLoading(true);
    const isFirstRating = !currentRating;
    try {
      if (currentRating) {
        await supabase
          .from('recipe_ratings')
          .update({
            rating: pendingRating,
            feedback: feedback.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentRating.id);
      } else {
        await supabase
          .from('recipe_ratings')
          .insert({
            recipe_id: recipe.id,
            user_id: user.id,
            rating: pendingRating,
            feedback: feedback.trim(),
          });
      }

      await loadCurrentRating();
      setShowFeedbackDialog(false);
      setPendingRating(null);
      setFeedback('');

      if (isFirstRating && onFirstAction) {
        onFirstAction();
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col texture-subtle">
        <div className="relative">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-terracotta-100 to-cream-100 flex items-center justify-center">
              <span className="text-9xl">🍽️</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg transition shadow-lg"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-6">
            {recipe.is_shared && !isOwner && (
              <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700">
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Community {recipe.recipe_type === 'cocktail' ? 'Cocktail' : 'Recipe'}</span>
              </div>
            )}
            <h1
              className="text-4xl font-bold text-gray-900 mb-3"
              dangerouslySetInnerHTML={renderMarkdown(recipe.title)}
            />
            {recipe.description && (
              <p className="text-gray-600 text-lg">
                {recipe.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 mb-6 pb-6 border-b">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-5 h-5 text-terracotta-600" />
              <div>
                <div className="text-sm text-gray-500">Total Time</div>
                <div className="font-semibold">{totalTime} minutes</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-5 h-5 text-terracotta-600" />
              <div>
                <div className="text-sm text-gray-500">{recipe.recipe_type === 'cocktail' ? 'Servings/Drinks' : 'Servings'}</div>
                <div className="font-semibold">{recipe.servings}</div>
              </div>
            </div>

          </div>

          {recipe.recipe_type === 'cocktail' && recipe.cocktail_metadata && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Cocktail Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {recipe.cocktail_metadata.spiritBase && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Base Spirit</div>
                    <div className="font-medium text-gray-900 capitalize">{recipe.cocktail_metadata.spiritBase}</div>
                  </div>
                )}
                {recipe.cocktail_metadata.glassType && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Glass</div>
                    <div className="font-medium text-gray-900 capitalize">{recipe.cocktail_metadata.glassType}</div>
                  </div>
                )}
                {recipe.cocktail_metadata.method && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Method</div>
                    <div className="font-medium text-gray-900 capitalize">{recipe.cocktail_metadata.method}</div>
                  </div>
                )}
                {recipe.cocktail_metadata.ice && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Ice</div>
                    <div className="font-medium text-gray-900 capitalize">{recipe.cocktail_metadata.ice}</div>
                  </div>
                )}
                {recipe.cocktail_metadata.garnish && (
                  <div className="col-span-2 sm:col-span-3">
                    <div className="text-xs text-gray-500 mb-1">Garnish</div>
                    <div className="font-medium text-gray-900">{recipe.cocktail_metadata.garnish}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {recipe.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, idx) => {
                  const isStructured = tag.includes(':');
                  const displayTag = isStructured
                    ? tag.split(':')[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : tag;
                  const tagColor = isStructured
                    ? 'bg-sage-100 text-sage-700'
                    : 'bg-terracotta-100 text-terracotta-700';

                  return (
                    <span
                      key={idx}
                      className={`px-3 py-1 ${tagColor} rounded-full text-sm font-medium`}
                    >
                      {displayTag}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="md:grid md:grid-cols-[minmax(250px,35%)_1fr] md:gap-12">
            {/* Ingredients Column */}
            <div className="md:sticky md:top-8 md:self-start md:h-[calc(100vh-4rem)] md:overflow-y-auto custom-scrollbar">
              {recipe.ingredients.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    Ingredients
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {recipe.ingredients.length} items
                    </span>
                  </h2>
                  <ul className="space-y-3">
                    {recipe.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-terracotta-50 transition-colors group">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-terracotta-400 group-hover:bg-terracotta-600 transition-colors" />
                        <span className="text-gray-700 font-medium text-lg leading-relaxed">
                          {ingredient.quantity} {ingredient.unit} {ingredient.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Instructions Column */}
            <div>
              {recipe.instructions.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Instructions
                  </h2>
                  <ol className="space-y-8">
                    {recipe.instructions.map((instruction, idx) => (
                      <li key={idx} className="flex gap-6 group">
                        <span className="flex-shrink-0 w-10 h-10 bg-terracotta-100 text-terracotta-700 rounded-full flex items-center justify-center font-bold text-xl group-hover:bg-terracotta-600 group-hover:text-white transition-colors">
                          {idx + 1}
                        </span>
                        <div
                          className="text-gray-700 pt-1 leading-relaxed prose prose-lg max-w-none"
                          dangerouslySetInnerHTML={renderMarkdown(instruction)}
                        />
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>

          {recipe.notes && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <div
                className="text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={renderMarkdown(recipe.notes)}
              />
            </div>
          )}

          {recipe.source_url && (
            <div className="mb-6">
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-terracotta-600 hover:text-terracotta-700 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View Original Source
              </a>
            </div>
          )}

          {user && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Rate this recipe</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRatingClick('thumbs_up')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${currentRating?.rating === 'thumbs_up'
                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="font-medium">Good</span>
                </button>
                <button
                  onClick={() => handleRatingClick('thumbs_down')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${currentRating?.rating === 'thumbs_down'
                    ? 'bg-red-100 text-red-700 border-2 border-red-500'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span className="font-medium">Not Good</span>
                </button>
              </div>
              {currentRating && (
                <p className="mt-3 text-sm text-gray-600">
                  {currentRating.feedback && (
                    <span>
                      <strong>Your feedback:</strong> {currentRating.feedback}
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t">
            {isOwner ? (
              <button
                onClick={onEdit}
                className="flex-1 px-6 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl transition font-medium flex items-center justify-center gap-2"
              >
                <Edit2 className="w-5 h-5" />
                Edit Recipe
              </button>
            ) : onCopy ? (
              <button
                onClick={() => onCopy(recipe)}
                className="flex-1 px-6 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl transition font-medium flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copy Recipe
              </button>
            ) : null}
            
            <button
               onClick={handleAddToShoppingList}
               disabled={addingToCart}
               className="flex-1 px-6 py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-xl transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingCart className="w-5 h-5" />
              {addingToCart ? 'Adding...' : 'Add Ingredients'}
            </button>

            <button
              onClick={() => setShowMealSelector(true)}
              className="flex-1 px-6 py-3 border-2 border-sage-600 text-sage-600 rounded-xl hover:bg-sage-50 transition font-medium flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Add to Meal
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showFeedbackDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Tell us more about your rating
            </h3>
            <p className="text-gray-600 mb-4">
              Your feedback helps improve future recipe recommendations.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What did you like or dislike about this recipe? (optional)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={submitRating}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl transition font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Submit Rating'}
              </button>
              <button
                onClick={() => {
                  setShowFeedbackDialog(false);
                  setPendingRating(null);
                  setFeedback('');
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showMealSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add to Meal</h3>
            <p className="text-gray-600 mb-4">
              Select which meal you'd like to add "{recipe.title}" to:
            </p>
            {availableMeals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No meals available. Create a meal first!
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg mb-4">
                {availableMeals.map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => setSelectedMealId(meal.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 ${selectedMealId === meal.id
                      ? 'bg-terracotta-50 font-medium text-terracotta-900'
                      : 'text-gray-700'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{meal.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(meal.date).toLocaleDateString()}
                        </div>
                      </div>
                      {selectedMealId === meal.id && (
                        <span className="text-terracotta-600">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={addRecipeToMeal}
                disabled={!selectedMealId || addingToMeal}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToMeal ? 'Adding...' : 'Add to Meal'}
              </button>
              <button
                onClick={() => {
                  setShowMealSelector(false);
                  setSelectedMealId(null);
                }}
                disabled={addingToMeal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
