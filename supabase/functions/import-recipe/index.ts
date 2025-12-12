import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RecipeData {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  tags: string[];
  image_url?: string;
  recipe_type?: 'food' | 'cocktail';
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
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const htmlResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
      },
    });

    if (!htmlResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch the webpage" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const html = await htmlResponse.text();

    let recipe: RecipeData | null = null;

    recipe = extractJsonLd(html);

    if (!recipe) {
      recipe = extractMicrodata(html);
    }

    if (!recipe) {
      recipe = await extractWithAI(html);
    }

    if (!recipe) {
      return new Response(
        JSON.stringify({ error: "Could not extract recipe data from the webpage" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // If ingredients or instructions are missing, try to extract them with AI as a fallback
    if (recipe.ingredients.length === 0 || recipe.instructions.length === 0) {
      console.log('Missing ingredients or instructions, attempting AI extraction');
      const aiRecipe = await extractWithAI(html);
      if (aiRecipe) {
        if (recipe.ingredients.length === 0 && aiRecipe.ingredients.length > 0) {
          console.log('AI extracted', aiRecipe.ingredients.length, 'ingredients');
          recipe.ingredients = aiRecipe.ingredients;
        }
        if (recipe.instructions.length === 0 && aiRecipe.instructions.length > 0) {
          console.log('AI extracted', aiRecipe.instructions.length, 'instructions');
          recipe.instructions = aiRecipe.instructions;
        }
      }
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
    console.error("Error importing recipe:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to import recipe" }),
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

function extractJsonLd(html: string): RecipeData | null {
  try {
    const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const matches = html.matchAll(jsonLdPattern);

    for (const match of matches) {
      try {
        const json = JSON.parse(match[1]);
        const recipes = Array.isArray(json) ? json : [json];

        for (const item of recipes) {
          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
            const normalized = normalizeJsonLdRecipe(item);
            console.log('Extracted recipe with', normalized.ingredients.length, 'ingredients');
            return normalized;
          }

          if (item['@graph']) {
            const recipeInGraph = item['@graph'].find((node: any) =>
              node['@type'] === 'Recipe' || (Array.isArray(node['@type']) && node['@type'].includes('Recipe'))
            );
            if (recipeInGraph) {
              const normalized = normalizeJsonLdRecipe(recipeInGraph);
              console.log('Extracted recipe from @graph with', normalized.ingredients.length, 'ingredients');
              return normalized;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error("Error extracting JSON-LD:", error);
  }

  return null;
}

function normalizeJsonLdRecipe(recipe: any): RecipeData {
  let ingredients: string[] = [];

  console.log('Raw recipeIngredient type:', typeof recipe.recipeIngredient);
  console.log('Is array?', Array.isArray(recipe.recipeIngredient));

  // Try to extract ingredients from various possible structures
  if (Array.isArray(recipe.recipeIngredient)) {
    console.log('Processing', recipe.recipeIngredient.length, 'ingredients');

    ingredients = recipe.recipeIngredient.flatMap((ing: any, index: number) => {
      console.log(`Ingredient ${index}:`, typeof ing, ing);

      if (typeof ing === 'string') return [ing];
      if (ing.text) return [ing.text];
      // Handle grouped ingredients with itemListElement
      if (ing.itemListElement) {
        return ing.itemListElement.map((item: any) =>
          typeof item === 'string' ? item : (item.text || item.name || '')
        );
      }
      if (ing.name) return [ing.name];
      return [];
    }).filter(Boolean);
  } else if (typeof recipe.recipeIngredient === 'string') {
    ingredients = [recipe.recipeIngredient];
  }

  console.log('Normalized ingredients:', ingredients.length, 'items');
  console.log('First 3 ingredients:', ingredients.slice(0, 3));

  let instructions: string[] = [];
  if (Array.isArray(recipe.recipeInstructions)) {
    instructions = recipe.recipeInstructions.flatMap((step: any) => {
      if (typeof step === 'string') return [step];
      if (step.text) return [step.text];
      if (step['@type'] === 'HowToStep' && step.text) return [step.text];
      if (step['@type'] === 'HowToSection' && step.itemListElement) {
        return step.itemListElement.map((s: any) => {
          if (typeof s === 'string') return s;
          if (s.text) return s.text;
          if (s['@type'] === 'HowToStep' && s.text) return s.text;
          return '';
        }).filter(Boolean);
      }
      if (step.itemListElement) {
        return step.itemListElement.map((s: any) => {
          if (typeof s === 'string') return s;
          if (s.text) return s.text;
          return '';
        }).filter(Boolean);
      }
      return [];
    }).filter(Boolean);
  } else if (typeof recipe.recipeInstructions === 'string') {
    instructions = [recipe.recipeInstructions];
  }

  console.log('Normalized instructions:', instructions.length, 'steps');

  const prepTime = parseDuration(recipe.prepTime) || 0;
  const cookTime = parseDuration(recipe.cookTime) || parseDuration(recipe.totalTime) || 0;

  const servings = typeof recipe.recipeYield === 'number'
    ? recipe.recipeYield
    : parseInt(String(recipe.recipeYield || '4').match(/\d+/)?.[0] || '4');

  const tags: string[] = [];
  if (recipe.recipeCategory) {
    const categories = Array.isArray(recipe.recipeCategory) ? recipe.recipeCategory : [recipe.recipeCategory];
    tags.push(...categories);
  }
  if (recipe.recipeCuisine) {
    const cuisines = Array.isArray(recipe.recipeCuisine) ? recipe.recipeCuisine : [recipe.recipeCuisine];
    tags.push(...cuisines);
  }
  if (recipe.keywords) {
    const keywords = Array.isArray(recipe.keywords)
      ? recipe.keywords
      : typeof recipe.keywords === 'string'
      ? recipe.keywords.split(',').map((k: string) => k.trim())
      : [];
    tags.push(...keywords);
  }

  const imageUrl = typeof recipe.image === 'string'
    ? recipe.image
    : Array.isArray(recipe.image) && recipe.image.length > 0
    ? (typeof recipe.image[0] === 'string' ? recipe.image[0] : recipe.image[0]?.url)
    : recipe.image?.url;

  const title = recipe.name || 'Imported Recipe';
  const description = recipe.description || '';

  const isCocktail = detectCocktail(title, description, tags, ingredients);

  return {
    title,
    description,
    ingredients,
    instructions,
    prep_time_minutes: prepTime,
    cook_time_minutes: cookTime,
    servings,
    tags: [...new Set(tags.filter(Boolean))],
    image_url: imageUrl,
    recipe_type: isCocktail ? 'cocktail' : 'food',
    cocktail_metadata: isCocktail ? extractCocktailMetadata(title, description, instructions) : undefined,
  };
}

function detectCocktail(title: string, description: string, tags: string[], ingredients: string[]): boolean {
  const cocktailKeywords = ['cocktail', 'drink', 'martini', 'margarita', 'mojito', 'daiquiri', 'sangria', 'punch', 'shot', 'shooter'];
  const spiritKeywords = ['vodka', 'gin', 'rum', 'tequila', 'whiskey', 'bourbon', 'brandy', 'mezcal'];

  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const tagsLower = tags.map(t => t.toLowerCase()).join(' ');
  const ingredientsText = ingredients.join(' ').toLowerCase();

  const allText = `${titleLower} ${descLower} ${tagsLower} ${ingredientsText}`;

  return cocktailKeywords.some(keyword => allText.includes(keyword)) ||
         spiritKeywords.some(spirit => ingredientsText.includes(spirit));
}

function extractCocktailMetadata(title: string, description: string, instructions: string[]): any {
  const metadata: any = {};

  const allText = `${title} ${description} ${instructions.join(' ')}`.toLowerCase();

  if (allText.includes('vodka')) metadata.spiritBase = 'vodka';
  else if (allText.includes('gin')) metadata.spiritBase = 'gin';
  else if (allText.includes('rum')) metadata.spiritBase = 'rum';
  else if (allText.includes('tequila')) metadata.spiritBase = 'tequila';
  else if (allText.includes('whiskey') || allText.includes('bourbon')) metadata.spiritBase = 'whiskey';
  else if (allText.includes('brandy')) metadata.spiritBase = 'brandy';

  if (allText.includes('shake') || allText.includes('shaken')) metadata.method = 'shaken';
  else if (allText.includes('stir') || allText.includes('stirred')) metadata.method = 'stirred';
  else if (allText.includes('blend') || allText.includes('blended')) metadata.method = 'blended';

  if (allText.includes('rocks glass') || allText.includes('old fashioned')) metadata.glassType = 'rocks';
  else if (allText.includes('martini glass')) metadata.glassType = 'martini';
  else if (allText.includes('highball')) metadata.glassType = 'highball';
  else if (allText.includes('coupe')) metadata.glassType = 'coupe';

  return Object.keys(metadata).length > 0 ? metadata : null;
}

function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;

  const hourMatch = duration.match(/(\d+)H/);
  const minuteMatch = duration.match(/(\d+)M/);

  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;

  return hours * 60 + minutes;
}

function extractMicrodata(html: string): RecipeData | null {
  try {
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];

    if (ogTitle) {
      return {
        title: ogTitle,
        description: ogDescription || '',
        ingredients: [],
        instructions: [],
        prep_time_minutes: 0,
        cook_time_minutes: 30,
        servings: 4,
        tags: [],
        image_url: ogImage,
      };
    }
  } catch (error) {
    console.error("Error extracting microdata:", error);
  }

  return null;
}

async function extractWithAI(html: string): Promise<RecipeData | null> {
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      console.error("No AI API key available for extraction");
      return null;
    }

    const cleanedHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    const isOpenAI = apiKey.startsWith('sk-');

    const prompt = `Extract recipe data from this HTML. Return a JSON object with:
- title (string)
- description (string, optional)
- ingredients (array of strings - IMPORTANT: extract ALL ingredients including quantities, even if they are in subsections like "Marinade", "Sauce", "Stir-fry", etc.)
- instructions (array of strings - CRITICAL: extract ALL cooking/preparation steps as separate array items. Each step should be a complete instruction. Look for numbered or bulleted lists, paragraphs describing steps, or any text that describes how to prepare the recipe.)
- prep_time_minutes (number, estimated if not available)
- cook_time_minutes (number, estimated if not available)
- servings (number)
- tags (array of strings, include cuisine type, meal type, dietary info)
- image_url (string, optional)
- recipe_type (string - "food" or "cocktail" - detect if this is a cocktail/drink recipe)
- cocktail_metadata (object, optional - only if recipe_type is "cocktail", include:
  - spiritBase: primary spirit (vodka, gin, rum, tequila, whiskey, bourbon, brandy, mezcal)
  - glassType: type of glass (rocks, highball, martini, coupe, collins, etc.)
  - garnish: garnish description
  - method: preparation method (shaken, stirred, built, blended, muddled)
  - ice: ice specification (cubed, crushed, neat, rocks, large-cube))

CRITICAL REQUIREMENTS:
1. Extract ALL ingredients from the recipe, including those organized in subsections
2. Extract ALL instructions/steps - this is extremely important. Look for ANY text that describes how to make the recipe
3. Detect if this is a cocktail recipe based on the presence of spirits, cocktail terminology, or drink-related keywords

HTML content:
${cleanedHtml}

Return ONLY valid JSON, no additional text.`;

    if (isOpenAI) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a recipe extraction assistant. Extract recipe data and return valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API error:", await response.text());
        return null;
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } else {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 2048,
          messages: [
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        console.error("Anthropic API error:", await response.text());
        return null;
      }

      const data = await response.json();
      const content = data.content[0].text.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error("Error extracting with AI:", error);
  }

  return null;
}
