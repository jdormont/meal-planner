import { useMemo, useState } from 'react';
import { X, CalendarPlus, Loader2 } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { RecipeSuggestion } from './RecipeSuggestionCard';
import { addSuggestionsToPlanner } from '../services/planService';
import { showError, showSuccess } from '../utils/toast';
import { AllergenSafetyBadge } from './AllergenSafetyBadge';
import { useRestrictions } from '../hooks/useRestrictions';
import { useAnalytics } from '../hooks/useAnalytics';
import { checkRecipe, hasAnyRestrictions } from '../../supabase/functions/_shared/allergens/index.ts';

type AddToPlanModalProps = {
  suggestions: RecipeSuggestion[];
  onClose: () => void;
  onAdded?: () => void;
};

export function AddToPlanModal({ suggestions, onClose, onAdded }: AddToPlanModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [confirmBlocked, setConfirmBlocked] = useState(false);
  const { diners } = useRestrictions();
  const { track } = useAnalytics();
  const recipeInputs = useMemo(
    () => suggestions.map(s => ({ title: s.title, description: s.description, ingredients: s.full_details?.ingredients ?? [] })),
    [suggestions]
  );
  const blockedCount = useMemo(
    () => (hasAnyRestrictions(diners) ? recipeInputs.filter(r => checkRecipe(r, diners).status === 'blocked').length : 0),
    [recipeInputs, diners]
  );
  // Default to consecutive days starting today.
  const [dates, setDates] = useState<string[]>(() =>
    suggestions.map((_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'))
  );

  const handleConfirm = async () => {
    if (!user || saving) return;
    if (blockedCount > 0 && !confirmBlocked) {
      setConfirmBlocked(true);
      return;
    }
    if (blockedCount > 0) track('allergen_blocked_confirmed_override', { action: 'add_to_plan', blocked_count: blockedCount });
    setSaving(true);
    try {
      const { added, failed } = await addSuggestionsToPlanner(
        user.id,
        suggestions.map((suggestion, i) => ({ suggestion, date: dates[i] }))
      );
      if (added > 0) {
        await queryClient.invalidateQueries({ queryKey: ['meals', user.id] });
        await queryClient.invalidateQueries({ queryKey: ['recipes', user.id] });
        showSuccess(`Added ${added} meal${added === 1 ? '' : 's'} to your planner`);
        onAdded?.();
      }
      if (failed.length > 0) {
        showError(`Couldn't add: ${failed.join(', ')}`);
      }
      if (failed.length === 0) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-terracotta-100 rounded-xl">
              <CalendarPlus className="w-6 h-6 text-terracotta-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add to planner</h2>
          </div>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-600">Pick a day for each dinner. They'll be saved to your recipes too.</p>
          {suggestions.map((s, i) => (
            <div key={`${s.title}-${i}`} className="flex items-center gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <span className="block text-sm font-medium text-gray-900 line-clamp-2">{s.title}</span>
                <AllergenSafetyBadge recipe={recipeInputs[i]} source="add_to_plan" />
              </div>
              <input
                type="date"
                value={dates[i]}
                onChange={(e) => setDates((prev) => prev.map((d, idx) => (idx === i ? e.target.value : d)))}
                className="px-3 py-2 border border-sage-300 rounded-lg text-sm focus:ring-2 focus:ring-terracotta-500 outline-none"
              />
            </div>
          ))}
          {confirmBlocked && blockedCount > 0 && (
            <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {blockedCount === 1 ? '1 recipe matches' : `${blockedCount} recipes match`} a restriction you set. Tap the button again to add anyway.
            </p>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-3 border border-sage-300 text-gray-700 rounded-xl hover:bg-sage-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || dates.some((d) => !d)}
            className="flex-1 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarPlus className="w-5 h-5" />}
            {saving ? 'Adding...' : confirmBlocked && blockedCount > 0 ? 'Add anyway' : 'Add to planner'}
          </button>
        </div>
      </div>
    </div>
  );
}
