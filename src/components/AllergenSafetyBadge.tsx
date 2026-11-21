import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAllergenCheck } from '../hooks/useAllergenCheck';
import { useAnalytics } from '../hooks/useAnalytics';
import type { RecipeInput } from '../../supabase/functions/_shared/allergens/index.ts';

type Props = {
  recipe: RecipeInput | null | undefined;
  /** compact = one-line pill (cards); full = pill with expandable detail. */
  variant?: 'compact' | 'full';
  /** Where the badge is rendered. Sent to analytics as a coarse label only. */
  source: string;
  className?: string;
};

const joinLabels = (labels: string[]) => labels.join(', ');

/**
 * Honest, conservative safety status. It never claims a recipe is "allergen-free":
 * "no match found" only means our ingredient check found nothing.
 */
export function AllergenSafetyBadge({ recipe, variant = 'compact', source, className = '' }: Props) {
  const result = useAllergenCheck(recipe);
  const { track } = useAnalytics();
  const [open, setOpen] = useState(false);

  const status = result?.status;
  const findingCount = result?.findings.length ?? 0;
  const unverifiedCount = result?.unverified.length ?? 0;

  // Counts only: never ingredient names, restriction values, or any free text.
  useEffect(() => {
    if (!status) return;
    track('allergen_check_shown', { status, finding_count: findingCount, unverified_count: unverifiedCount, source });
  }, [status, findingCount, unverifiedCount, source, track]);

  if (!result) return null;

  const checked = joinLabels(result.checkedAgainst);
  const styles =
    result.status === 'blocked'
      ? 'bg-red-50 border-red-300 text-red-800'
      : result.status === 'warning'
        ? 'bg-amber-50 border-amber-300 text-amber-900'
        : 'bg-sage-50 border-sage-300 text-gray-700';
  const Icon = result.status === 'blocked' ? ShieldAlert : result.status === 'warning' ? AlertTriangle : ShieldCheck;

  const definite = result.findings.filter(f => f.severity === 'definite');
  const possible = result.findings.filter(f => f.severity === 'possible');

  let headline: string;
  if (result.status === 'blocked') {
    const first = definite[0];
    headline = `Contains ${first.ingredient} (${first.restriction})${definite.length > 1 ? ` +${definite.length - 1} more` : ''}`;
  } else if (result.status === 'warning') {
    headline = result.ingredientsUnreadable
      ? "Couldn't check ingredients"
      : `Possible hidden source${possible.length > 1 ? 's' : ''} to check`;
  } else {
    headline = checked ? `No match found for: ${checked}` : 'No match found';
  }

  const detail = (
    <div className="mt-2 space-y-2 text-xs leading-relaxed">
      {result.findings.length > 0 && (
        <ul className="space-y-1">
          {result.findings.map((f, i) => (
            <li key={`${f.restriction}-${f.ingredient}-${i}`}>
              <span className="font-semibold">{f.severity === 'definite' ? 'Contains' : 'May contain'}:</span> {f.reason}
            </li>
          ))}
        </ul>
      )}
      {result.ingredientsUnreadable && <p>This recipe has no readable ingredient list, so nothing could be checked.</p>}
      {result.unverified.length > 0 && (
        <p><span className="font-semibold">Not auto-checked:</span> {joinLabels(result.unverified)}</p>
      )}
      <p className="opacity-80">Always check packaged labels. This is an automated ingredient check, not a guarantee.</p>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${styles} ${className}`}
        title={result.findings.map(f => f.reason).join('\n') || 'Always check packaged labels.'}
        role="status"
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="line-clamp-1">{headline}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border px-4 py-3 ${styles} ${className}`} role="status">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 text-left text-sm font-medium"
        aria-expanded={open}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{headline}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {result.status === 'safe' && !open && (
        <p className="mt-1 text-xs opacity-80">Always check packaged labels.</p>
      )}
      {(open || result.status !== 'safe') && detail}
    </div>
  );
}
