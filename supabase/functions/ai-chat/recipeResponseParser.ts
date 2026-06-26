import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { RecipeResponseSchema } from "../_shared/types.ts";

export interface ParsedRecipeResponse {
  reply: string;
  suggestions: any[];
}

async function saveSuggestedRecipes(
  userId: string,
  recipes: any[],
  supabaseClient: SupabaseClient
) {
  if (!userId || recipes.length === 0) return;

  try {
    const records = recipes.map(r => ({
      user_id: userId,
      recipe_name: r.title,
      protein: r.tags?.protein || null,
      carb: r.tags?.carb || null,
      method: r.tags?.method || null
    }));

    const { error } = await supabaseClient
      .from("suggested_recipes")
      .insert(records);

    if (error) {
      console.error("Error saving suggested recipes:", error);
    }
  } catch (error) {
    console.error("Error saving suggested recipes:", error);
  }
}

export async function parseRecipeResponse(
  message: string,
  userId: string | null,
  supabaseClient: SupabaseClient
): Promise<ParsedRecipeResponse> {
  let parsedData: ParsedRecipeResponse;
  try {
    // The model might wrap the JSON in markdown code blocks despite instructions, handle that.
    const cleanMessage = message.trim();
    const jsonString = cleanMessage
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");

    const rawData = JSON.parse(jsonString);
    const validation = RecipeResponseSchema.safeParse(rawData);

    if (validation.success) {
      parsedData = validation.data;

      if (parsedData.suggestions.length > 0 && userId) {
        console.log("Saving suggested recipes:", parsedData.suggestions.map((s: any) => s.title));
        await saveSuggestedRecipes(userId, parsedData.suggestions, supabaseClient);
      }
    } else {
      console.error("Schema validation failed:", validation.error);
      // Attempt to use what we have
      parsedData = {
        reply: rawData.reply || message,
        suggestions: Array.isArray(rawData.suggestions) ? rawData.suggestions : []
      };
    }
  } catch (e) {
    console.error("Error parsing JSON response:", e);
    console.log("Raw message:", message);
    // Fallback: If JSON parsing fails, assume the entire message is the reply text.
    // This prevents 500 errors when the model decides to be chatty and skip JSON.
    parsedData = {
      reply: message,
      suggestions: []
    };
  }

  return parsedData;
}
