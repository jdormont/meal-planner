import { useMemo } from 'react';
import { useRestrictions } from './useRestrictions';
import {
  checkRecipe,
  hasAnyRestrictions,
  type CheckResult,
  type RecipeInput,
} from '../../supabase/functions/_shared/allergens/index.ts';

/** Run the deterministic allergen check for the current user. `null` = nothing to show. */
export function useAllergenCheck(recipe: RecipeInput | null | undefined): CheckResult | null {
  const { diners } = useRestrictions();
  return useMemo(() => {
    if (!recipe || !hasAnyRestrictions(diners)) return null;
    return checkRecipe(recipe, diners);
  }, [recipe, diners]);
}
