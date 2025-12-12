import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Loader2 } from 'lucide-react';

interface UserPreferences {
  favorite_cuisines: string[];
  favorite_dishes: string[];
  food_restrictions: string[];
  time_preference: string;
  skill_level: string;
  household_size: number;
  spice_preference: string;
  cooking_equipment: string[];
  dietary_style: string;
  additional_notes: string;
}

const cuisineOptions = [
  'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian',
  'French', 'Mediterranean', 'Middle Eastern', 'Greek', 'Spanish', 'Korean',
  'Vietnamese', 'Other'
];

const equipmentOptions = [
  'Oven', 'Stovetop', 'Microwave', 'Slow Cooker', 'Pressure Cooker',
  'Air Fryer', 'Blender', 'Food Processor', 'Stand Mixer', 'Grill', 'Toaster Oven'
];

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [preferences, setPreferences] = useState<UserPreferences>({
    favorite_cuisines: [],
    favorite_dishes: [],
    food_restrictions: [],
    time_preference: 'moderate',
    skill_level: 'intermediate',
    household_size: 2,
    spice_preference: 'medium',
    cooking_equipment: [],
    dietary_style: 'omnivore',
    additional_notes: '',
  });

  const [dishInput, setDishInput] = useState('');
  const [restrictionInput, setRestrictionInput] = useState('');

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
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
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage('');

    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_preferences')
          .update({
            ...preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert([
            {
              user_id: user?.id,
              ...preferences,
            },
          ]);

        if (error) throw error;
      }

      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCuisine = (cuisine: string) => {
    setPreferences(prev => ({
      ...prev,
      favorite_cuisines: prev.favorite_cuisines.includes(cuisine)
        ? prev.favorite_cuisines.filter(c => c !== cuisine)
        : [...prev.favorite_cuisines, cuisine]
    }));
  };

  const toggleEquipment = (equipment: string) => {
    setPreferences(prev => ({
      ...prev,
      cooking_equipment: prev.cooking_equipment.includes(equipment)
        ? prev.cooking_equipment.filter(e => e !== equipment)
        : [...prev.cooking_equipment, equipment]
    }));
  };

  const addDish = () => {
    if (dishInput.trim()) {
      setPreferences(prev => ({
        ...prev,
        favorite_dishes: [...prev.favorite_dishes, dishInput.trim()]
      }));
      setDishInput('');
    }
  };

  const removeDish = (dish: string) => {
    setPreferences(prev => ({
      ...prev,
      favorite_dishes: prev.favorite_dishes.filter(d => d !== dish)
    }));
  };

  const addRestriction = () => {
    if (restrictionInput.trim()) {
      setPreferences(prev => ({
        ...prev,
        food_restrictions: [...prev.food_restrictions, restrictionInput.trim()]
      }));
      setRestrictionInput('');
    }
  };

  const removeRestriction = (restriction: string) => {
    setPreferences(prev => ({
      ...prev,
      food_restrictions: prev.food_restrictions.filter(r => r !== restriction)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Preferences</h1>
        <p className="text-gray-600 mb-8">
          Customize your recipe recommendations by sharing your cooking preferences.
        </p>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Favorite Cuisines
            </label>
            <p className="text-sm text-gray-600 mb-3">Select all that apply</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {cuisineOptions.map(cuisine => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => toggleCuisine(cuisine)}
                  className={`px-4 py-2 rounded-xl border-2 transition text-sm font-medium ${
                    preferences.favorite_cuisines.includes(cuisine)
                      ? 'border-terracotta-500 bg-cream-50 text-terracotta-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-sage-300'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Favorite Dishes
            </label>
            <p className="text-sm text-gray-600 mb-3">Add specific dishes you love</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={dishInput}
                onChange={(e) => setDishInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDish()}
                placeholder="e.g., Pad Thai, Chicken Tikka Masala"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={addDish}
                className="px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition"
              >
                Add
              </button>
            </div>
            {preferences.favorite_dishes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preferences.favorite_dishes.map(dish => (
                  <span
                    key={dish}
                    className="px-3 py-1 bg-terracotta-100 text-terracotta-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {dish}
                    <button
                      onClick={() => removeDish(dish)}
                      className="text-terracotta-500 hover:text-terracotta-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Dietary Style
            </label>
            <select
              value={preferences.dietary_style}
              onChange={(e) => setPreferences(prev => ({ ...prev, dietary_style: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
            >
              <option value="omnivore">Omnivore</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="pescatarian">Pescatarian</option>
              <option value="flexitarian">Flexitarian</option>
              <option value="keto">Keto</option>
              <option value="paleo">Paleo</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Food Restrictions & Allergies
            </label>
            <p className="text-sm text-gray-600 mb-3">Add any dietary restrictions or allergies</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={restrictionInput}
                onChange={(e) => setRestrictionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRestriction()}
                placeholder="e.g., Gluten-free, Dairy-free, Nut allergy"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={addRestriction}
                className="px-4 py-2 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition"
              >
                Add
              </button>
            </div>
            {preferences.food_restrictions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preferences.food_restrictions.map(restriction => (
                  <span
                    key={restriction}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {restriction}
                    <button
                      onClick={() => removeRestriction(restriction)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Cooking Time Preference
              </label>
              <select
                value={preferences.time_preference}
                onChange={(e) => setPreferences(prev => ({ ...prev, time_preference: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              >
                <option value="quick">Quick (under 30 min)</option>
                <option value="moderate">Moderate (30-60 min)</option>
                <option value="relaxed">Relaxed (60+ min)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Cooking Skill Level
              </label>
              <select
                value={preferences.skill_level}
                onChange={(e) => setPreferences(prev => ({ ...prev, skill_level: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Household Size
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={preferences.household_size}
                onChange={(e) => setPreferences(prev => ({ ...prev, household_size: parseInt(e.target.value) || 2 }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Number of people you typically cook for</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Spice Preference
              </label>
              <select
                value={preferences.spice_preference}
                onChange={(e) => setPreferences(prev => ({ ...prev, spice_preference: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none"
              >
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="hot">Hot</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Available Cooking Equipment
            </label>
            <p className="text-sm text-gray-600 mb-3">Select all equipment you have access to</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {equipmentOptions.map(equipment => (
                <button
                  key={equipment}
                  type="button"
                  onClick={() => toggleEquipment(equipment)}
                  className={`px-4 py-2 rounded-xl border-2 transition text-sm font-medium ${
                    preferences.cooking_equipment.includes(equipment)
                      ? 'border-terracotta-500 bg-cream-50 text-terracotta-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-sage-300'
                  }`}
                >
                  {equipment}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Additional Notes
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Share any other preferences or information that would help personalize your recommendations
            </p>
            <textarea
              value={preferences.additional_notes}
              onChange={(e) => setPreferences(prev => ({ ...prev, additional_notes: e.target.value }))}
              rows={4}
              placeholder="e.g., I prefer one-pot meals, I love experimenting with new ingredients, I avoid recipes with too many steps..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {message && (
                <p className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </p>
              )}
            </div>
            <button
              onClick={savePreferences}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
