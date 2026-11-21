import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import type { Diner } from '../../supabase/functions/_shared/allergens/index.ts';

export const PREFERENCES_QUERY_KEY = 'user_preferences';

/**
 * The signed-in user's food restrictions, plus the list of diners the allergen
 * checker runs against. Today the list has exactly one entry (the account owner);
 * household members will be appended here later.
 *
 * Restrictions are read live, so editing them in Settings/onboarding (which
 * invalidates this query) instantly re-evaluates every badge. Nothing is persisted.
 */
export function useRestrictions() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: [PREFERENCES_QUERY_KEY, user?.id],
    queryFn: () => profileService.getUserPreferences(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });

  const restrictions = useMemo(
    () => (data?.food_restrictions ?? []).filter(r => r.trim().length > 0),
    [data]
  );
  const diners = useMemo<Diner[]>(
    () => [{ id: 'me', name: 'Me', restrictions }],
    [restrictions]
  );

  return { restrictions, diners, isLoading };
}
