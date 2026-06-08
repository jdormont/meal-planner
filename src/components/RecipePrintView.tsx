import { Recipe } from '../lib/supabase';
import type { ScaledIngredient } from '../utils/recipeScaler';
import { formatTime } from '../utils/time';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface RecipePrintViewProps {
  recipe: Recipe;
  scaledIngredients: ScaledIngredient[];
  displayServings: number;
}

function renderMarkdown(text: string) {
  return { __html: DOMPurify.sanitize(marked(text, { breaks: true, gfm: true }) as string) };
}

/**
 * Black-and-white-friendly recipe layout, only rendered for `useReactToPrint`.
 * Hidden on screen (`hidden`) and shown only in the print/PDF context (`print:block`).
 */
export function RecipePrintView({ recipe, scaledIngredients, displayServings }: RecipePrintViewProps) {
  return (
    <div className="hidden print:block bg-white text-black p-10">
      <header className="mb-6 pb-4 border-b-2 border-black">
        <h1 className="text-3xl font-bold mb-2" dangerouslySetInnerHTML={renderMarkdown(recipe.title)} />
        {recipe.description && <p className="text-base text-gray-800">{recipe.description}</p>}
      </header>

      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="w-full max-h-72 object-cover mb-6 border border-black"
        />
      )}

      <div className="flex gap-10 mb-6 text-sm">
        <div>
          <span className="font-semibold">Total Time:</span> {formatTime(recipe.total_time)}
        </div>
        <div>
          <span className="font-semibold">{recipe.recipe_type === 'cocktail' ? 'Servings/Drinks' : 'Servings'}:</span>{' '}
          {displayServings}
        </div>
      </div>

      <div className="grid grid-cols-[35%_1fr] gap-10">
        <section>
          <h2 className="text-xl font-bold mb-3 pb-1 border-b border-black">Ingredients</h2>
          <ul className="space-y-1.5 text-sm">
            {scaledIngredients.map((ingredient, idx) => (
              <li key={idx}>
                {ingredient.quantity} {ingredient.unit} {ingredient.name}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 pb-1 border-b border-black">Instructions</h2>
          <ol className="space-y-3 text-sm list-decimal list-outside ml-5">
            {recipe.instructions.map((instruction, idx) => (
              <li key={idx} className="pl-1 leading-relaxed" dangerouslySetInnerHTML={renderMarkdown(instruction)} />
            ))}
          </ol>
        </section>
      </div>

      {recipe.notes && (
        <section className="mt-8 pt-4 border-t border-black">
          <h2 className="text-xl font-bold mb-2">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{recipe.notes}</p>
        </section>
      )}
    </div>
  );
}
