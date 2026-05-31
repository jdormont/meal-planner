import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, ShoppingList, ShoppingListItem, MealWithRecipes } from '../lib/supabase';
import { useAuth } from './AuthContext';

type ShoppingListContextType = {
  currentList: ShoppingList | null;
  items: ShoppingListItem[];
  isLoading: boolean;
  refreshList: () => Promise<void>;
  addItem: (name: string, quantity: number, unit: string, recipeId?: string) => Promise<void>;
  addItemsFromMeals: (meals: MealWithRecipes[]) => Promise<number>;
  removeItem: (itemId: string) => Promise<void>;
  toggleItem: (itemId: string, isChecked: boolean) => Promise<void>;
  createInstacartLink: () => Promise<string | null>;
};

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export function useShoppingList() {
  const context = useContext(ShoppingListContext);
  if (context === undefined) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider');
  }
  return context;
}

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshList = useCallback(async () => {
    if (!user) {
      setCurrentList(null);
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Get active list
      // eslint-disable-next-line prefer-const
      let { data: list, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // 2. If no list, create one
      if (!list) {
        const { data: newList, error: createError } = await supabase
          .from('shopping_lists')
          .insert({
            user_id: user.id,
            title: 'My Shopping List',
            status: 'active'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        list = newList;
      }

      setCurrentList(list);

      // 3. fetch items
      if (list) {
        const { data: listItems, error: itemsError } = await supabase
          .from('shopping_list_items')
          .select('*')
          .eq('list_id', list.id)
          .order('created_at', { ascending: true });

        if (itemsError) throw itemsError;
        setItems(listItems || []);
      }

    } catch (err) {
      console.error('Error fetching shopping list:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const addItem = async (name: string, quantity: number, unit: string, recipeId?: string) => {
    if (!currentList) return;

    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .insert({
          list_id: currentList.id,
          name,
          quantity,
          unit,
          recipe_id: recipeId
        });

      if (error) throw error;
      await refreshList();
    } catch (err) {
      console.error('Error adding item:', err);
      throw err;
    }
  };

  const addItemsFromMeals = async (meals: MealWithRecipes[]): Promise<number> => {
    if (!currentList) return 0;

    // Aggregate all ingredients from all recipes, deduplicating by lowercased name
    const aggregated = new Map<string, { quantity: number; unit: string; recipeId: string }>();

    for (const meal of meals) {
      for (const mealRecipe of meal.recipes) {
        const recipe = mealRecipe.recipe;
        for (const ingredient of recipe.ingredients) {
          const key = ingredient.name.toLowerCase().trim();
          const parsed = parseFloat(ingredient.quantity);
          const qty = isNaN(parsed) ? 1 : parsed;
          const existing = aggregated.get(key);
          if (existing && existing.unit === ingredient.unit) {
            existing.quantity += qty;
          } else if (existing) {
            // Different units — keep separate entry with disambiguated key
            aggregated.set(`${key} (${ingredient.unit})`, {
              quantity: qty,
              unit: ingredient.unit,
              recipeId: recipe.id,
            });
          } else {
            aggregated.set(key, {
              quantity: qty,
              unit: ingredient.unit,
              recipeId: recipe.id,
            });
          }
        }
      }
    }

    if (aggregated.size === 0) return 0;

    await Promise.all(
      Array.from(aggregated.entries()).map(([name, { quantity, unit, recipeId }]) =>
        supabase.from('shopping_list_items').insert({
          list_id: currentList.id,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          quantity,
          unit,
          recipe_id: recipeId,
        })
      )
    );

    await refreshList();
    return aggregated.size;
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error('Error removing item:', err);
      throw err;
    }
  };

  const toggleItem = async (itemId: string, isChecked: boolean) => {
    try {
      // Optimistic update
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_checked: isChecked } : i));

      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked: isChecked })
        .eq('id', itemId);

      if (error) {
        // Revert on error
        await refreshList();
        throw error;
      }
    } catch (err) {
      console.error('Error toggling item:', err);
      throw err;
    }
  };

  const createInstacartLink = async () => {
    if (items.length === 0) return null;

    try {
      // Filter unchecked items? Or send all? sending all for MVP unless checked logic implies "done".
      // Usually "checked" means "in basket" or "already have". Let's assume we send Unchecked items?
      // Or just send everything? Let's send EVERYTHING for now, or maybe only unchecked. 
      // Logic: User checks off what they HAVE. So we shop for unchecked.
      const itemsToShop = items.filter(i => !i.is_checked);

      if (itemsToShop.length === 0) {
        alert("All items are checked off!");
        return null;
      }

      console.log("Sending items to Instacart:", itemsToShop);
      const { data, error } = await supabase.functions.invoke('instacart-integration', {
        body: { items: itemsToShop }
      });

      if (error) throw error;
      
      console.log("Instacart response:", data);
      return data.products_link_url;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error interacting with Instacart:', err);
      
      // Try to extract detailed error message
      let errorMessage = 'Failed to create Instacart link.';
      
      if (err && typeof err === 'object') {
        // Handle FunctionsHttpError explicitly if possible, or check for message property
        if (err.context && typeof err.context.json === 'function') {
           try {
             const errorBody = await err.context.json();
             if (errorBody.error) errorMessage += ` ${errorBody.error}`;
           } catch { /* ignore */ }
        } else if (err.message) {
           errorMessage += ` ${err.message}`;
        }
      }
      
      alert(errorMessage);
      return null;
    }
  };

  const value = {
    currentList,
    items,
    isLoading,
    refreshList,
    addItem,
    addItemsFromMeals,
    removeItem,
    toggleItem,
    createInstacartLink
  };

  return (
    <ShoppingListContext.Provider value={value}>
      {children}
    </ShoppingListContext.Provider>
  );
}
