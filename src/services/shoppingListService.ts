import { supabase, ShoppingList, ShoppingListItem, DbShoppingList, DbShoppingListItem } from '../lib/supabase';
import { mapShoppingList, mapShoppingListItem } from '../lib/mappers';

export const shoppingListService = {
  /**
   * Fetches the active shopping list for a user. If none exists, creates one.
   */
  async getOrCreateActiveList(userId: string): Promise<{ list: ShoppingList; items: ShoppingListItem[] }> {
    const { data: fetchedList, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    let list = fetchedList;

    if (!list) {
      const { data: newList, error: createError } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: userId,
          title: 'My Shopping List',
          status: 'active'
        })
        .select()
        .single();

      if (createError) throw createError;
      list = newList;
    }

    // Fetch items for this list
    const { data: itemsData, error: itemsError } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('list_id', list.id)
      .order('created_at', { ascending: true });

    if (itemsError) throw itemsError;

    const items = (itemsData || []).map(mapShoppingListItem);
    const shoppingList = mapShoppingList(list as DbShoppingList, itemsData || []);

    return {
      list: shoppingList,
      items
    };
  },

  /**
   * Adds an item to a shopping list.
   */
  async addListItem(
    listId: string,
    itemData: { name: string; quantity: number; unit: string; recipeId?: string }
  ): Promise<ShoppingListItem> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({
        list_id: listId,
        name: itemData.name,
        quantity: itemData.quantity,
        unit: itemData.unit,
        recipe_id: itemData.recipeId || null
      })
      .select()
      .single();

    if (error) throw error;
    return mapShoppingListItem(data as DbShoppingListItem);
  },

  /**
   * Adds multiple items to a shopping list.
   */
  async addListItems(
    listId: string,
    itemsData: Array<{ name: string; quantity: number; unit: string; recipeId?: string }>
  ): Promise<void> {
    const payload = itemsData.map(item => ({
      list_id: listId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      recipe_id: item.recipeId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('shopping_list_items')
      .insert(payload);

    if (error) throw error;
  },

  /**
   * Removes an item from a shopping list.
   */
  async removeListItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },

  /**
   * Toggles item is_checked state.
   */
  async toggleListItem(itemId: string, isChecked: boolean): Promise<void> {
    const { error } = await supabase
      .from('shopping_list_items')
      .update({ is_checked: isChecked, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) throw error;
  }
};
