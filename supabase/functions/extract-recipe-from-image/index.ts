import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RecipeData {
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  instructions: string[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  tags: string[];
  recipe_type: 'food' | 'cocktail';
  cocktail_metadata?: {
    spiritBase?: string;
    glassType?: string;
    garnish?: string;
    method?: string;
    ice?: string;
  };
}

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

Return a JSON object with this EXACT structure:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "ingredients": [
    {"quantity": "1", "unit": "cup", "name": "flour"},
    {"quantity": "2", "unit": "tbsp", "name": "olive oil"}
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4,
  "tags": ["italian", "pasta", "vegetarian"],
  "recipe_type": "food",
  "confidence": "high"
}

For cocktails, set recipe_type to "cocktail" and add:
{
  "cocktail_metadata": {
    "spiritBase": "vodka",
    "glassType": "martini",
    "garnish": "lemon twist",
    "method": "shaken",
    "ice": "cubed"
  }
}

CRITICAL RULES:
1. Always provide realistic estimates for prep_time_minutes and cook_time_minutes
2. Break down ingredients into quantity, unit, and name components
3. Make instructions clear and actionable
4. Infer missing information intelligently based on visual cues and common recipes
5. Set confidence to "high" for clear text extraction, "medium" for partial inference, "low" for heavy inference
6. For menu items without full details, infer a complete recipe based on the dish name and description
7. Return ONLY valid JSON, no additional text or markdown`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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

    const recipe: RecipeData = JSON.parse(jsonMatch[0]);

    if (!recipe.title || !recipe.ingredients || recipe.ingredients.length === 0) {
      throw new Error("Incomplete recipe data extracted from image");
    }

    return new Response(
      JSON.stringify(recipe),
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
