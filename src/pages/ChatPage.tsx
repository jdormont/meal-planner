import { useLocation } from 'wouter';
import { AIChat } from '../components/AIChat';
import { parseAIRecipe, parseIngredient } from '../utils/recipeParser';
import { RecipeSuggestion } from '../components/RecipeSuggestionCard';

export function ChatPage() {
  const [, setLocation] = useLocation();

  const handleAIRecipe = (text: string) => {
    const parsed = parseAIRecipe(text);
    const tempRecipe = {
      title: parsed.title,
      description: parsed.description,
      ingredients: parsed.ingredients,
      instructions: parsed.instructions,
      total_time: parsed.totalTime,
      servings: 4,
      tags: ['AI Generated'],
      image_url: '',
      source_url: '',
      notes: '',
      is_shared: false,
      recipe_type: 'food'
    };

    sessionStorage.setItem('temp_import_recipe', JSON.stringify(tempRecipe));
    setLocation('/recipes/new?source=ai');
  };

  const handleViewAIRecipe = (suggestion: RecipeSuggestion) => {
    const tempRecipe = {
      title: suggestion.title,
      description: suggestion.description,
      ingredients: suggestion.full_details?.ingredients.map((line: string) => parseIngredient(line)) || [],
      instructions: suggestion.full_details?.instructions || [],
      total_time: parseInt(suggestion.time_estimate) || 0,
      servings: 4,
      tags: ['AI Generated'],
      image_url: suggestion.image_url || '',
      source_url: '',
      notes: suggestion.full_details?.nutrition_notes || '',
      is_shared: false,
      recipe_type: 'food'
    };

    sessionStorage.setItem('temp_import_recipe', JSON.stringify(tempRecipe));
    setLocation('/recipes/new?source=ai-view');
  };

  return (
    <div className="h-[calc(100vh-10rem)]">
      <AIChat
        onSaveRecipe={handleAIRecipe}
        onFirstAction={() => {}} // No-op, handled by global onboarding checker
        onViewRecipe={handleViewAIRecipe}
      />
    </div>
  );
}
