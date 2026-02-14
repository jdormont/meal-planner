import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { RecipeResponseSchema } from "../_shared/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured. Please set OPENAI_API_KEY in your Supabase project settings."
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const systemPrompt = `You are a recipe extraction assistant. Analyze the provided image and extract recipe information.

The image may contain:
1. A restaurant menu with dish names and descriptions
2. A plated dish (photo of food)
3. A printed recipe card or screenshot
4. A handwritten recipe

Your task:
- Extract or infer ALL available recipe information
- For menu items: extract dish name, description, and infer likely ingredients and preparation
- For plated dishes: identify the dish, list visible ingredients, infer cooking method and recipe
- For recipe cards/screenshots: extract all text including title, ingredients with measurements, instructions
- For handwritten recipes: carefully read and transcribe all text

Return a JSON object with this EXACT structure (wrapping the recipe in a 'suggestions' list):
{
  "suggestions": [
    {
      "title": "Recipe name",
      "type": "recipe" (or "cocktail"),
      "description": "Brief description of the dish",
      "difficulty": "Easy" (or "Medium", "Hard"),
      "reason_for_recommendation": "Extracted from image",
      "time_estimate": "45 minutes",
      "cuisine": "Italian",
      "tags": {
        "protein": "Chicken",
        "carb": "Pasta",
        "method": "Bake"
      },
      "full_details": {
        "ingredients": [
            "1 cup flour",
            "2 tbsp olive oil"
        ],
        "instructions": [
            "Mix flour and oil.",
            "Bake at 350F for 20 mins."
        ],
        "nutrition_notes": "Contains gluten."
      }
    }
  ]
}

CRITICAL RULES:
1. ALWAYS return valid JSON matching the schema above.
2. 'ingredients' must be an ARRAY OF STRINGS. Do not break them into objects. Example: "1 cup flour" is correct. {"amount": 1, "unit": "cup", "name": "flour"} is WRONG.
3. 'instructions' must be an ARRAY OF STRINGS. Do not use objects or step numbers.
4. Infer missing information intelligently based on visual cues.
5. Return ONLY valid JSON, no additional text or markdown.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the recipe information from this image. Return only valid JSON with the recipe data."
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    console.log("Raw AI response:", content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }

    const parsedContent = JSON.parse(jsonMatch[0]);
    
    // Validate against shared schema
    const validationResult = RecipeResponseSchema.safeParse(parsedContent);

    if (!validationResult.success) {
        console.error("Schema validation failed:", validationResult.error);
        throw new Error("Extracted data does not match expected recipe schema");
    }

    const recipeData = validationResult.data;

    if (!recipeData.suggestions || recipeData.suggestions.length === 0) {
      throw new Error("No recipe found in the image");
    }

    return new Response(
      JSON.stringify(recipeData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error extracting recipe from image:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to extract recipe from image",
        details: "Please ensure the image is clear and contains recipe information."
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
