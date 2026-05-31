import { supabase, UserProfile, DbUserProfile, UserPreferences, DbUserPreferencesInsert, DbUserPreferencesUpdate } from '../lib/supabase';
import { mapUserProfile } from '../lib/mappers';

export const profileService = {
  /**
   * Loads a user profile by user ID.
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapUserProfile(data as DbUserProfile);
  },

  /**
   * Loads a user's preferences by user ID.
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      favorite_cuisines: data.favorite_cuisines || [],
      favorite_dishes: data.favorite_dishes || [],
      food_restrictions: data.food_restrictions || [],
      time_preference: data.time_preference || 'moderate',
      skill_level: data.skill_level || 'intermediate',
      household_size: data.household_size || 2,
      spice_preference: data.spice_preference || 'medium',
      cooking_equipment: data.cooking_equipment || [],
      dietary_style: data.dietary_style || 'omnivore',
      additional_notes: data.additional_notes || '',
    };
  },

  /**
   * Saves or updates a user's preferences.
   */
  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    const { data: existing, error: findError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const dbPayload: DbUserPreferencesUpdate = {
        ...preferences,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from('user_preferences')
        .update(dbPayload)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const insertPayload: DbUserPreferencesInsert = {
        user_id: userId,
        ...preferences,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from('user_preferences')
        .insert(insertPayload);

      if (error) throw error;
    }
  }
};
