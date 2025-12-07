import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { title, description, ingredients, instructions, prepTime, cookTime } = await req.json();
    console.log("Received request:", { title, ingredients, instructions });

    const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      console.log("No API key found");
      return new Response(
        JSON.stringify({ tags: {} }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Using API:", apiKey.startsWith('sk-') ? 'OpenAI' : 'Anthropic');

    const isOpenAI = apiKey.startsWith('sk-');
    const url = isOpenAI 
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.anthropic.com/v1/messages";

    const ingredientsList = ingredients?.map((i: any) => i.name).filter(Boolean).join(', ') || '';
    const instructionsList = instructions?.join(' ') || '';

    const titleLower = (title?.toLowerCase() || '');
    const ingredientsLower = ingredientsList.toLowerCase();
    const isCocktail = titleLower.includes('cocktail') ||
                       titleLower.includes('drink') ||
                       titleLower.includes('martini') ||
                       titleLower.includes('margarita') ||
                       titleLower.includes('mojito') ||
                       titleLower.includes('old fashioned') ||
                       titleLower.includes('negroni') ||
                       ingredientsLower.includes('vodka') ||
                       ingredientsLower.includes('gin') ||
                       ingredientsLower.includes('rum') ||
                       ingredientsLower.includes('tequila') ||
                       ingredientsLower.includes('whiskey') ||
                       ingredientsLower.includes('whisky') ||
                       ingredientsLower.includes('bourbon') ||
                       ingredientsLower.includes('scotch') ||
                       ingredientsLower.includes('cognac') ||
                       ingredientsLower.includes('brandy') ||
                       ingredientsLower.includes('vermouth') ||
                       ingredientsLower.includes('bitters') ||
                       ingredientsLower.includes('liqueur');

    const systemPrompt = isCocktail
      ? `You are a cocktail categorization assistant. Based on the cocktail details provided, suggest appropriate tags from these categories:

**base**: vodka, gin, rum, tequila, whiskey, bourbon, scotch, brandy, cognac, mezcal, champagne, wine, non-alcoholic
**flavor**: citrus, herbal, fruity, bitter, sweet, spicy, sour, tropical, creamy, smoky, floral, nutty
**strength**: light, moderate, strong, very-strong
**method**: shaken, stirred, built, blended, muddled, layered
**occasion**: aperitif, digestif, party, brunch, summer, winter, tiki, classic, modern

Return ONLY a JSON object with your suggestions in this exact format:
{
  "base": "value",
  "flavor": "value",
  "strength": "value",
  "method": "value",
  "occasion": "value"
}

Select ONE option from each category. Choose the most appropriate option based on the cocktail.`
      : `You are a recipe categorization assistant. Based on the recipe details provided, suggest appropriate tags from these categories:

**technique**: saute, bake, broil, grill, roast, steam, boil, fry, slow-cook, pressure-cook, raw
**grain**: none, rice, pasta, noodles, quinoa, couscous, bread, potatoes, polenta, other
**protein**: none, fish, shellfish, chicken, turkey, pork, beef, lamb, eggs, tofu, legumes, other
**cuisine**: american, italian, mexican, chinese, japanese, thai, indian, french, mediterranean, middle-eastern, greek, spanish, korean, vietnamese, other
**meal**: breakfast, brunch, lunch, dinner, snack, appetizer, dessert, side

Return ONLY a JSON object with your suggestions in this exact format:
{
  "technique": "value",
  "grain": "value",
  "protein": "value",
  "cuisine": "value",
  "meal": "value"
}

Select ONE option from each category. Choose the most appropriate option based on the recipe. If unsure, make your best educated guess.`;

    const userPrompt = `Recipe: ${title}\nDescription: ${description || 'none'}\nIngredients: ${ingredientsList}\nInstructions: ${instructionsList}\nPrep Time: ${prepTime || 0}min, Cook Time: ${cookTime || 0}min`;

    let requestBody;
    let headers;

    if (isOpenAI) {
      headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
      requestBody = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: "json_object" },
      };
    } else {
      headers = {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      };
      requestBody = {
        model: "claude-3-5-haiku-20241022",
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("AI API Error:", response.statusText);
      return new Response(
        JSON.stringify({ tags: {} }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();
    console.log("AI API response:", JSON.stringify(data));

    let message;
    if (isOpenAI) {
      message = data.choices[0].message.content;
    } else {
      message = data.content[0].text;
    }

    console.log("Extracted message:", message);

    let tags = {};
    try {
      tags = JSON.parse(message);
    } catch {
      const jsonMatch = message.match(/\{[^}]+\}/);
      if (jsonMatch) {
        tags = JSON.parse(jsonMatch[0]);
      }
    }

    console.log("Final tags:", tags);

    return new Response(
      JSON.stringify({ tags }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ tags: {} }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});