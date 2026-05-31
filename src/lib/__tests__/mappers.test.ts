import { describe, it, expect } from 'vitest';
import { mapRecipe, mapUserProfile, mapMeal, mapShoppingListItem, mapShoppingList } from '../mappers';
import { DbRecipe, DbMeal, DbUserProfile, DbShoppingList, DbShoppingListItem } from '../supabase';

describe('Mappers Unit Tests', () => {
  describe('mapRecipe', () => {
    it('correctly maps a recipe with populated data', () => {
      const dbRow: DbRecipe = {
        id: 'recipe-1',
        user_id: 'user-123',
        title: 'Delicious Pasta',
        description: 'A simple tomato pasta',
        ingredients: [
          { name: 'Spaghetti', quantity: '200', unit: 'g' },
          { name: 'Tomato Sauce', quantity: '1', unit: 'cup' }
        ],
        instructions: ['Boil pasta', 'Mix with sauce'],
        total_time: 25,
        servings: 2,
        tags: ['italian', 'pasta'],
        image_url: 'http://example.com/image.jpg',
        source_url: 'http://example.com/recipe',
        notes: 'Best served hot',
        is_shared: true,
        recipe_type: 'food',
        cocktail_metadata: null,
        created_at: '2026-05-31T00:00:00Z',
        updated_at: '2026-05-31T00:00:00Z'
      };

      const result = mapRecipe(dbRow);

      expect(result.id).toBe('recipe-1');
      expect(result.user_id).toBe('user-123');
      expect(result.title).toBe('Delicious Pasta');
      expect(result.description).toBe('A simple tomato pasta');
      expect(result.ingredients).toEqual([
        { name: 'Spaghetti', quantity: '200', unit: 'g' },
        { name: 'Tomato Sauce', quantity: '1', unit: 'cup' }
      ]);
      expect(result.instructions).toEqual(['Boil pasta', 'Mix with sauce']);
      expect(result.total_time).toBe(25);
      expect(result.servings).toBe(2);
      expect(result.tags).toEqual(['italian', 'pasta']);
      expect(result.image_url).toBe('http://example.com/image.jpg');
      expect(result.source_url).toBe('http://example.com/recipe');
      expect(result.notes).toBe('Best served hot');
      expect(result.is_shared).toBe(true);
      expect(result.recipe_type).toBe('food');
      expect(result.cocktail_metadata).toBeNull();
      expect(result.rating).toBeNull();
    });

    it('handles nullable/missing database fields with default fallbacks', () => {
      const dbRow: DbRecipe = {
        id: 'recipe-2',
        user_id: 'user-123',
        title: 'Minimal Recipe',
        description: null,
        ingredients: null,
        instructions: null,
        total_time: null,
        servings: null,
        tags: null,
        image_url: null,
        source_url: null,
        notes: null,
        is_shared: false,
        recipe_type: 'cocktail',
        cocktail_metadata: { spiritBase: 'gin', glassType: 'martini' },
        created_at: null,
        updated_at: null
      };

      const result = mapRecipe(dbRow);

      expect(result.title).toBe('Minimal Recipe');
      expect(result.description).toBe('');
      expect(result.ingredients).toEqual([]);
      expect(result.instructions).toEqual([]);
      expect(result.total_time).toBe(0);
      expect(result.servings).toBe(0);
      expect(result.tags).toEqual([]);
      expect(result.image_url).toBeUndefined();
      expect(result.source_url).toBeUndefined();
      expect(result.notes).toBe('');
      expect(result.is_shared).toBe(false);
      expect(result.recipe_type).toBe('cocktail');
      expect(result.cocktail_metadata).toEqual({
        spiritBase: 'gin',
        glassType: 'martini',
        garnish: undefined,
        method: undefined,
        ice: undefined
      });
    });
  });

  describe('mapUserProfile', () => {
    it('correctly maps user profile and applies default values', () => {
      const dbRow = {
        id: 'profile-1',
        user_id: 'user-123',
        full_name: 'John Doe',
        status: 'APPROVED',
        is_admin: true,
        assigned_model_id: 'model-xyz',
        has_seen_onboarding: true,
        created_at: '2026-05-31T00:00:00Z',
        updated_at: '2026-05-31T00:00:00Z',
        login_count: 5,
        recipe_count: 10,
        chat_count: 2,
        meal_count: 3
      } as any as DbUserProfile;

      const result = mapUserProfile(dbRow);

      expect(result.id).toBe('profile-1');
      expect(result.user_id).toBe('user-123');
      expect(result.full_name).toBe('John Doe');
      expect(result.status).toBe('APPROVED');
      expect(result.is_admin).toBe(true);
      expect(result.assigned_model_id).toBe('model-xyz');
      expect(result.has_seen_onboarding).toBe(true);
      expect(result.login_count).toBe(5);
      expect(result.recipe_count).toBe(10);
    });

    it('falls back to PENDING and defaults when status is unknown or null', () => {
      const dbRow = {
        id: 'profile-2',
        user_id: 'user-123',
        full_name: '',
        status: 'UNKNOWN_STATUS',
        is_admin: false,
        assigned_model_id: null,
        has_seen_onboarding: null,
        created_at: '2026-05-31T00:00:00Z',
        updated_at: '2026-05-31T00:00:00Z',
        login_count: null,
        recipe_count: null,
        chat_count: null,
        meal_count: null
      } as any as DbUserProfile;

      const result = mapUserProfile(dbRow);

      expect(result.status).toBe('PENDING');
      expect(result.is_admin).toBe(false);
      expect(result.has_seen_onboarding).toBe(false);
      expect(result.login_count).toBe(0);
      expect(result.recipe_count).toBe(0);
      expect(result.chat_count).toBe(0);
      expect(result.meal_count).toBe(0);
    });
  });

  describe('mapMeal', () => {
    it('correctly maps a meal and filters out null recipe associations', () => {
      const mealRow: DbMeal = {
        id: 'meal-1',
        user_id: 'user-123',
        name: 'Family Dinner',
        date: '2026-05-31',
        meal_type: 'dinner',
        is_event: false,
        description: 'Sunday roast',
        notes: 'Prep oven early',
        is_archived: false,
        created_at: '2026-05-31T00:00:00Z',
        updated_at: '2026-05-31T00:00:00Z'
      };

      const dbRecipeRow: DbRecipe = {
        id: 'recipe-1',
        user_id: 'user-123',
        title: 'Roast Chicken',
        description: 'Classic roast chicken',
        ingredients: [],
        instructions: [],
        total_time: 90,
        servings: 4,
        tags: [],
        image_url: null,
        source_url: null,
        notes: '',
        is_shared: false,
        recipe_type: 'food',
        cocktail_metadata: null,
        created_at: null,
        updated_at: null
      };

      const mealRecipeRows = [
        {
          id: 'mr-1',
          meal_id: 'meal-1',
          recipe_id: 'recipe-1',
          user_id: 'user-123',
          sort_order: 1,
          is_completed: false,
          created_at: '2026-05-31T00:00:00Z',
          updated_at: '2026-05-31T00:00:00Z',
          recipe: dbRecipeRow
        },
        {
          id: 'mr-2',
          meal_id: 'meal-1',
          recipe_id: 'recipe-missing',
          user_id: 'user-123',
          sort_order: 2,
          is_completed: true,
          created_at: '2026-05-31T00:00:00Z',
          updated_at: '2026-05-31T00:00:00Z',
          recipe: null // Should be filtered out
        }
      ];

      const result = mapMeal(mealRow, mealRecipeRows);

      expect(result.id).toBe('meal-1');
      expect(result.name).toBe('Family Dinner');
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].recipe_id).toBe('recipe-1');
      expect(result.recipes[0].recipe.title).toBe('Roast Chicken');
      expect(result.recipes[0].is_completed).toBe(false);
    });
  });

  describe('mapShoppingListItem & mapShoppingList', () => {
    it('correctly maps list and items', () => {
      const itemRow: DbShoppingListItem = {
        id: 'item-1',
        list_id: 'list-1',
        name: 'Eggs',
        quantity: 12,
        unit: 'count',
        display_text: 'Buy organic eggs',
        is_checked: true,
        recipe_id: 'recipe-1',
        product_id: 'prod-123',
        upc: 'upc-999',
        meta_data: { filters: { brand_filters: ['OrganicBrand'] } },
        created_at: '2026-05-31T00:00:00Z',
        updated_at: '2026-05-31T00:00:00Z'
      };

      const mappedItem = mapShoppingListItem(itemRow);
      expect(mappedItem.name).toBe('Eggs');
      expect(mappedItem.quantity).toBe(12);
      expect(mappedItem.is_checked).toBe(true);
      expect(mappedItem.meta_data?.filters?.brand_filters).toEqual(['OrganicBrand']);

      const listRow: DbShoppingList = {
        id: 'list-1',
        user_id: 'user-123',
        title: 'Weekly Groceries',
        status: 'active',
        created_at: '2026-05-31T00:00:00Z',
        updated_at: '2026-05-31T00:00:00Z'
      };

      const resultList = mapShoppingList(listRow, [itemRow]);
      expect(resultList.title).toBe('Weekly Groceries');
      expect(resultList.items).toHaveLength(1);
      expect(resultList.items?.[0].name).toBe('Eggs');
    });
  });
});
