import { supabase, Recipe, RecipeRating, DbRecipeInsert, DbRecipeUpdate, DbRecipeRatingInsert, DbRecipeRatingUpdate } from '../lib/supabase';
import { mapRecipe } from '../lib/mappers';

const ITEMS_PER_PAGE = 12;

export type RecipeFilterParams = {
  userId: string;
  page: number;
  recipeType: 'food' | 'cocktail';
  searchTerm?: string;
  selectedTags?: string[];
  selectedTimeFilter?: string;
};

export const recipeService = {
  /**
   * Fetches a paginated page of recipes for a user, applying filters.
   */
  async getRecipes({
    userId,
    page,
    recipeType,
    searchTerm = '',
    selectedTags = [],
    selectedTimeFilter = ''
  }: RecipeFilterParams): Promise<{ recipes: Recipe[]; hasMore: boolean }> {
    let query = supabase
      .from('recipes')
      .select('*')
      .eq('user_id', userId)
      .eq('recipe_type', recipeType)
      .order('created_at', { ascending: false })
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

    if (searchTerm) {
      const safeTerm = encodeURIComponent(searchTerm);
      query = query.or(`title.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%`);
    }

    if (selectedTags.length > 0) {
      query = query.contains('tags', selectedTags);
    }

    if (selectedTimeFilter) {
      switch (selectedTimeFilter) {
        case 'quick':
          query = query.lte('total_time', 30);
          break;
        case 'medium':
          query = query.gt('total_time', 30).lte('total_time', 45);
          break;
        case 'hour':
          query = query.gt('total_time', 45).lte('total_time', 90);
          break;
        case 'project':
          query = query.gt('total_time', 90);
          break;
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    let recipesList = (data || []).map(mapRecipe);

    // Fetch ratings for the retrieved recipes
    const visibleRecipeIds = recipesList.map(r => r.id);
    if (visibleRecipeIds.length > 0) {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('recipe_ratings')
        .select('recipe_id, rating')
        .eq('user_id', userId)
        .in('recipe_id', visibleRecipeIds);

      if (!ratingsError && ratingsData) {
        const ratingsMap = new Map<string, 'thumbs_up' | 'thumbs_down'>(
          ratingsData.map(r => [r.recipe_id, r.rating as 'thumbs_up' | 'thumbs_down'])
        );
        recipesList = recipesList.map(recipe => ({
          ...recipe,
          rating: ratingsMap.get(recipe.id) || null
        }));
      }
    }

    // Client-side fallback for ingredient filtering
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      recipesList = recipesList.filter(recipe => {
        const inTitle = recipe.title?.toLowerCase().includes(termLower);
        const inDesc = recipe.description?.toLowerCase().includes(termLower);
        const inIngredients = recipe.ingredients?.some((ing) =>
          ing.name?.toLowerCase().includes(termLower)
        );
        return inTitle || inDesc || inIngredients;
      });
    }

    return {
      recipes: recipesList,
      hasMore: (data?.length || 0) === ITEMS_PER_PAGE
    };
  },

  /**
   * Fetches community recipes.
   */
  async getCommunityRecipes(limit = 24): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_shared', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapRecipe);
  },

  /**
   * Fetches unique tags for a user.
   */
  async getUserTags(userId: string, recipeType: 'food' | 'cocktail'): Promise<string[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('tags')
      .eq('user_id', userId)
      .eq('recipe_type', recipeType);

    if (error) throw error;

    const tagSet = new Set<string>();
    data?.forEach(row => {
      row.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  },

  /**
   * Saves a new recipe or updates an existing one.
   */
  async saveRecipe(
    userId: string,
    recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    editingId?: string
  ): Promise<Recipe> {
    const dbPayload: DbRecipeInsert | DbRecipeUpdate = {
      title: recipeData.title,
      description: recipeData.description,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      total_time: recipeData.total_time,
      servings: recipeData.servings,
      tags: recipeData.tags,
      image_url: recipeData.image_url || null,
      source_url: recipeData.source_url || null,
      notes: recipeData.notes,
      is_shared: recipeData.is_shared,
      recipe_type: recipeData.recipe_type,
      cocktail_metadata: recipeData.cocktail_metadata || null,
      updated_at: new Date().toISOString()
    };

    if (editingId && !editingId.startsWith('temp-')) {
      const { data, error } = await supabase
        .from('recipes')
        .update(dbPayload as DbRecipeUpdate)
        .eq('id', editingId)
        .select()
        .single();

      if (error) throw error;
      return mapRecipe(data);
    } else {
      const insertPayload: DbRecipeInsert = {
        title: recipeData.title,
        user_id: userId,
        description: recipeData.description || null,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        total_time: recipeData.total_time || null,
        servings: recipeData.servings || null,
        tags: recipeData.tags || [],
        image_url: recipeData.image_url || null,
        source_url: recipeData.source_url || null,
        notes: recipeData.notes || null,
        is_shared: recipeData.is_shared || false,
        recipe_type: recipeData.recipe_type,
        cocktail_metadata: recipeData.cocktail_metadata || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('recipes')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return mapRecipe(data);
    }
  },

  /**
   * Deletes a recipe.
   */
  async deleteRecipe(recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) throw error;
  },

  /**
   * Fetches a single recipe by its ID.
   */
  async getRecipe(recipeId: string): Promise<Recipe | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapRecipe(data);
  },

  /**
   * Copies a shared community recipe into the user's cookbook.
   */
  async copyRecipe(userId: string, recipe: Recipe): Promise<Recipe> {
    const insertPayload: DbRecipeInsert = {
      user_id: userId,
      title: `${recipe.title} (Copy)`,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      total_time: recipe.total_time,
      servings: recipe.servings,
      tags: recipe.tags,
      image_url: recipe.image_url || null,
      source_url: recipe.source_url || null,
      notes: recipe.notes,
      is_shared: false,
      recipe_type: recipe.recipe_type,
      cocktail_metadata: recipe.cocktail_metadata || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('recipes')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    return mapRecipe(data);
  },

  /**
   * Fetches dashboard data: quick wins, favorites, recent, and older (rediscover).
   */
  async getDashboardData(userId: string, thirtyDaysAgoStr: string): Promise<{
    quickWins: Recipe[];
    favorites: Recipe[];
    recent: Recipe[];
    older: Recipe[];
  }> {
    const [quickWinsRes, favoritesRes, recentRes, olderRes] = await Promise.all([
      // Quick Wins: time <= 30
      supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .lte('total_time', 30)
        .order('created_at', { ascending: false })
        .limit(10),

      // Favorites: fetch ratings with thumbs_up
      supabase
        .from('recipe_ratings')
        .select('recipe_id')
        .eq('user_id', userId)
        .eq('rating', 'thumbs_up')
        .limit(20),

      // Recent
      supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15),

      // Older (Rediscover)
      supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .lt('created_at', thirtyDaysAgoStr)
        .limit(20)
    ]);

    if (quickWinsRes.error) throw quickWinsRes.error;
    if (favoritesRes.error) throw favoritesRes.error;
    if (recentRes.error) throw recentRes.error;
    if (olderRes.error) throw olderRes.error;

    // Process Favorites
    let favorites: Recipe[] = [];
    if (favoritesRes.data && favoritesRes.data.length > 0) {
      const favIds = favoritesRes.data.map(r => r.recipe_id);
      const uniqueFavIds = [...new Set(favIds)];

      const { data: favRecipes, error: favErr } = await supabase
        .from('recipes')
        .select('*')
        .in('id', uniqueFavIds)
        .limit(20);

      if (favErr) throw favErr;
      favorites = (favRecipes || []).map(mapRecipe);
    }

    return {
      quickWins: (quickWinsRes.data || []).map(mapRecipe),
      favorites,
      recent: (recentRes.data || []).map(mapRecipe),
      older: (olderRes.data || []).map(mapRecipe)
    };
  },

  /**
   * Fetches the current user rating for a recipe.
   */
  async getRecipeRating(recipeId: string, userId: string): Promise<RecipeRating | null> {
    const { data, error } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      recipe_id: data.recipe_id,
      user_id: data.user_id,
      rating: data.rating as 'thumbs_up' | 'thumbs_down',
      feedback: data.feedback || '',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  },

  /**
   * Saves or updates a recipe rating.
   */
  async saveRecipeRating(
    userId: string,
    recipeId: string,
    ratingValue: 'thumbs_up' | 'thumbs_down',
    feedback: string,
    existingRatingId?: string
  ): Promise<RecipeRating> {
    if (existingRatingId) {
      const dbPayload: DbRecipeRatingUpdate = {
        recipe_id: recipeId,
        user_id: userId,
        rating: ratingValue,
        feedback: feedback.trim(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('recipe_ratings')
        .update(dbPayload)
        .eq('id', existingRatingId)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        recipe_id: data.recipe_id,
        user_id: data.user_id,
        rating: data.rating as 'thumbs_up' | 'thumbs_down',
        feedback: data.feedback || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };
    } else {
      const insertPayload: DbRecipeRatingInsert = {
        recipe_id: recipeId,
        user_id: userId,
        rating: ratingValue,
        feedback: feedback.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('recipe_ratings')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        recipe_id: data.recipe_id,
        user_id: data.user_id,
        rating: data.rating as 'thumbs_up' | 'thumbs_down',
        feedback: data.feedback || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };
    }
  }
};
