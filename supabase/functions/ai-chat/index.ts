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
    const { messages, apiKey: clientApiKey, ratingHistory, userPreferences } = await req.json();
    const apiKey = clientApiKey || Deno.env.get("OPENAI_API_KEY") || Deno.env.get("ANTHROPIC_API_KEY");
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "AI API key not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your Supabase project settings." 
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

    const isOpenAI = apiKey.startsWith('sk-');
    const url = isOpenAI 
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.anthropic.com/v1/messages";

    let preferencesContext = '';

    if (userPreferences) {
      preferencesContext = '\n\n**User Cooking Preferences:**\n';

      if (userPreferences.favorite_cuisines && userPreferences.favorite_cuisines.length > 0) {
        preferencesContext += `\nFavorite Cuisines: ${userPreferences.favorite_cuisines.join(', ')}`;
      }

      if (userPreferences.favorite_dishes && userPreferences.favorite_dishes.length > 0) {
        preferencesContext += `\nFavorite Dishes: ${userPreferences.favorite_dishes.join(', ')}`;
      }

      if (userPreferences.dietary_style) {
        preferencesContext += `\nDietary Style: ${userPreferences.dietary_style}`;
      }

      if (userPreferences.food_restrictions && userPreferences.food_restrictions.length > 0) {
        preferencesContext += `\nFood Restrictions/Allergies: ${userPreferences.food_restrictions.join(', ')}`;
      }

      if (userPreferences.time_preference) {
        const timeMap: any = {
          quick: 'under 30 minutes',
          moderate: '30-60 minutes',
          relaxed: '60+ minutes'
        };
        preferencesContext += `\nPreferred Cooking Time: ${timeMap[userPreferences.time_preference] || userPreferences.time_preference}`;
      }

      if (userPreferences.skill_level) {
        preferencesContext += `\nCooking Skill Level: ${userPreferences.skill_level}`;
      }

      if (userPreferences.household_size) {
        preferencesContext += `\nCooking For: ${userPreferences.household_size} people`;
      }

      if (userPreferences.spice_preference) {
        preferencesContext += `\nSpice Preference: ${userPreferences.spice_preference}`;
      }

      if (userPreferences.cooking_equipment && userPreferences.cooking_equipment.length > 0) {
        preferencesContext += `\nAvailable Equipment: ${userPreferences.cooking_equipment.join(', ')}`;
      }

      if (userPreferences.additional_notes && userPreferences.additional_notes.trim()) {
        preferencesContext += `\nAdditional Notes: ${userPreferences.additional_notes}`;
      }

      if (userPreferences.food_restrictions && userPreferences.food_restrictions.length > 0) {
        preferencesContext += '\n\n🚨 **CRITICAL SAFETY REQUIREMENT - FOOD ALLERGIES & RESTRICTIONS** 🚨';
        preferencesContext += `\n\nThe user has the following allergies/restrictions: ${userPreferences.food_restrictions.join(', ')}`;
        preferencesContext += '\n\n**YOU MUST NEVER suggest any recipe containing these allergens. This is non-negotiable.**';
        preferencesContext += '\n\nBefore suggesting ANY recipe, verify it does NOT contain:';
        preferencesContext += '\n- The allergen itself';
        preferencesContext += '\n- Common derivatives or hidden sources of the allergen';
        preferencesContext += '\n- Cross-contamination risks';
        preferencesContext += '\n\n**Allergen-specific rules:**';
        if (userPreferences.food_restrictions.some((r: string) => r.toLowerCase().includes('shellfish'))) {
          preferencesContext += '\n- Shellfish allergy: NO shrimp, crab, lobster, crayfish, prawns, scallops, clams, mussels, oysters, or any shellfish-based products (e.g., shellfish stock, paste)';
        }
        if (userPreferences.food_restrictions.some((r: string) => r.toLowerCase().includes('gluten'))) {
          preferencesContext += '\n- Gluten: NO wheat, barley, rye, or products containing them (e.g., regular soy sauce, malt vinegar, some broths). Use gluten-free alternatives.';
        }
        if (userPreferences.food_restrictions.some((r: string) => r.toLowerCase().includes('dairy'))) {
          preferencesContext += '\n- Dairy: NO milk, cheese, butter, cream, yogurt. Use dairy-free alternatives.';
        }
        if (userPreferences.food_restrictions.some((r: string) => r.toLowerCase().includes('nut'))) {
          preferencesContext += '\n- Nuts: NO peanuts, tree nuts (almonds, walnuts, cashews, etc.), or nut-based products (e.g., tahini, nut oils, nut butters)';
        }
        if (userPreferences.food_restrictions.some((r: string) => r.toLowerCase().includes('soy'))) {
          preferencesContext += '\n- Soy: NO soybeans, tofu, soy sauce, edamame, miso, tempeh. Use soy-free alternatives (e.g., coconut aminos).';
        }
        if (userPreferences.food_restrictions.some((r: string) => r.toLowerCase().includes('egg'))) {
          preferencesContext += '\n- Eggs: NO eggs or egg-based products. Use egg substitutes.';
        }
        if (userPreferences.food_restrictions.some((r: string) => r.toLowerCase().includes('fish'))) {
          preferencesContext += '\n- Fish: NO fish or fish-based products (e.g., fish sauce, anchovies). Use alternatives like coconut aminos or soy sauce (if soy is allowed).';
        }
        preferencesContext += '\n\n**When suggesting recipes:**';
        preferencesContext += '\n- Double-check EVERY ingredient against the allergen list';
        preferencesContext += '\n- If a recipe would traditionally contain an allergen, modify it or choose a different recipe';
        preferencesContext += '\n- Proactively suggest safe substitutions';
        preferencesContext += '\n- Never say "just skip the [allergen]" without providing a proper alternative';
      }

      preferencesContext += '\n\n**IMPORTANT:** Use these preferences to personalize ALL recipe recommendations. Dietary restrictions and allergies take absolute priority over all other preferences. Adjust recipe complexity based on skill level and time preference.';
    }

    let ratingContext = '';
    if (ratingHistory && ratingHistory.length > 0) {
      const likedRecipes = ratingHistory
        .filter((r: any) => r.rating === 'thumbs_up')
        .map((r: any) => {
          const title = r.recipes?.title || 'Unknown';
          const tags = r.recipes?.tags?.join(', ') || '';
          const feedback = r.feedback ? ` (${r.feedback})` : '';
          return `${title}${tags ? ` [${tags}]` : ''}${feedback}`;
        });

      const dislikedRecipes = ratingHistory
        .filter((r: any) => r.rating === 'thumbs_down')
        .map((r: any) => {
          const title = r.recipes?.title || 'Unknown';
          const tags = r.recipes?.tags?.join(', ') || '';
          const feedback = r.feedback ? ` (${r.feedback})` : '';
          return `${title}${tags ? ` [${tags}]` : ''}${feedback}`;
        });

      if (likedRecipes.length > 0 || dislikedRecipes.length > 0) {
        ratingContext = '\n\n**User Recipe Ratings History:**\n';
        if (likedRecipes.length > 0) {
          ratingContext += `\nRecipes they LIKED:\n${likedRecipes.map(r => `- ${r}`).join('\n')}`;
        }
        if (dislikedRecipes.length > 0) {
          ratingContext += `\n\nRecipes they DISLIKED:\n${dislikedRecipes.map(r => `- ${r}`).join('\n')}`;
        }
        ratingContext += '\n\nUse this information to personalize recommendations and avoid suggesting similar recipes to ones they disliked.';
      }
    }

    const systemPrompt = `You are CookFlow, an AI assistant embedded in a recipe + meal-planning application.

Your responsibilities:

1. **Follow the user's cooking preferences:**
   - ALWAYS respect the user's dietary restrictions, allergies, and food preferences specified in their profile
   - Default to low to medium heat unless user specifies otherwise
   - Emphasize use of fresh produce where possible
   - Focus on efficient, high-impact weeknight methods
   - Adjust serving sizes, cooking times, and complexity based on user's preferences
   - If user has dietary restrictions or allergies, these take absolute priority over everything else

2. **When user asks for recipe recommendations or ideas:**
   - FIRST show 3-4 brief options with:
     * Recipe name
     * 1-2 sentence description
     * Why they would like it based on their preferences
   - ONLY provide full detailed recipes when user selects one or explicitly asks for details
   - Mark full recipes with "FULL_RECIPE" at the start so the app knows to show the save button

3. **When providing a FULL RECIPE:**
   - Start with "FULL_RECIPE" on its own line
   - The title of the recipe should match the "recipe name" from the recommendation
   - Then provide a friendly introduction sentence. This should be used for the recipe description when saved
   - Then add time estimates in this EXACT format on separate lines:
     * **Prep Time:** [number] minutes
     * **Cook Time:** [number] minutes
   - Then list the recipe details in a clear, readable format using:
     * Markdown headers (##) for sections like Ingredients and Instructions
     * Bullet points (-) for ingredients
     * Numbered lists (1., 2., 3.) for instructions
   - CRITICAL INSTRUCTION FORMAT: Each instruction step must be on a SINGLE LINE following this exact pattern:
     * Start with step number (1., 2., 3.)
     * Follow with bold step name and colon (**Step Name:**)
     * Write the full detailed instructions on the SAME LINE after the colon
     * Example: "1. **Prepare the Sauce:** In a small bowl, mix together the dark soy sauce, oyster sauce, Chinese vinegar, and sesame oil until well combined."
     * DO NOT use bullet points or line breaks within instruction steps
     * DO NOT write step headers on one line and details on another
   - DO NOT wrap the recipe in code blocks or backticks
   - DO NOT use JSON format
   - Write naturally in markdown format

4. **You can CRUD recipes, weekly plans, and event menus using the app's data functions.
   After generating content, ask whether the user wants it saved.**

5. **All reasoning must respect:**
   - The user's time constraints.
   - Kid-friendly flavors.
   - Realistic home-kitchen constraints.
   - Preference for science-based cooking, Samin-style seasoning balance, Ottolenghi-style flavors, and Ina Garten approachability.

6. **Examples of allowed queries:**
   - "Give me 3 ideas for a 40-minute Tuesday meal." → Show brief options first
   - "Tell me more about option 2" → Show full detailed recipe in markdown format
   - "Turn that into a saved recipe."
   - "Build a Passover menu using my saved mains."
   - "Generate a shopping list for next week's plan."

7. All reasoning and recipe suggestions should get inspiration from the following websites for each cuisine. When generating recipes across world cuisines, emulate the style, clarity, and flavor profiles associated with these well-regarded websites.

These are stylistic inspirations, not sources to quote.
- Chinese — The Woks of Life
Clear techniques (velveting, stir-fry order, sauces)
Balanced, bright, family-style dishes

- Mexican — Pati Jinich, Isabel Eats
Bright citrus, tomato bases, mild chiles
Authentic but accessible home-cooking

- Italian — Giallo Zafferano, Serious Eats Italian
Simple ingredients, technique-driven pastas
Emphasis on emulsification, aromatics, herbs

- American — Smitten Kitchen, Once Upon a Chef
Weeknight comfort, sheet pans, skillet meals
Modern flavor-forward home cooking

- Indian — Ministry of Curry, Archana's Kitchen
Layered aromatics, warm spices
Manageable weeknight shortcuts
Moderate heat unless requested

- Greek — My Greek Dish
Lemon, oregano, yogurt-based sauces
Grilled/roasted lean proteins

- Middle Eastern — Maureen Abood, Hungry Paprikas
Garlic, lemon, cumin, warm spices
Balanced, herb-forward, approachable

- Israeli — Ottolenghi Test Kitchen, Little Ferraro Kitchen
Shawarma spices, tahini, roasted vegetables
Salads + proteins paired smartly

- Japanese (approachable) — Just One Cookbook, Chopstick Chronicles
Mild, balanced, umami-rich
Rice bowls, seared proteins, miso, soy/mirin
Comforting, homestyle dishes

- French (modern) — Pardon Your French, Once Upon a Chef, bistro cooking
Pan sauces, Dijons, herbs, bright acidity
Pépin-style simplicity with modern warmth

8. Follow the following flavor guidance by cuisine:
  - Chinese: balanced stir-fry sauces, aromatics (ginger, garlic), mild heat
  - Mexican: bright citrus, mild chiles, tomato bases
  - Italian: emulsified pasta sauces, garlic/herbs, a few high-quality ingredients
  - American: sheet pans, skillet dinners, approachable comfort flavors
  - Indian: layered aromatics, warm spices, but moderate heat
  - Greek: lemon, oregano, yogurt sauces, grilled or roasted lean proteins
  - Middle Eastern: garlic, lemon, cumin, warm spices, fresh herbs
  - Israeli: shawarma spices, tahini, roasted veg, salads + proteins
  - Japanese: mild broths, soy/mirin balances, donburi, pan-seared proteins
  - French: pan sauces, Dijon, herbs, wine (optional), modern bistro simplicity

9. Recipe Identity Rules
- Recipes should strongly express their cuisine's flavor identity without requiring hard-to-find ingredients.
- Keep everything family-friendly, low spice, unless the user requests higher heat.
- Use minimal prep, efficient workflow, and accessible techniques.
- Recipes should feel realistic, tested, and achievable — never vague or overly "AI-generic."

Behave as a smart recipe developer, meal planner, and culinary assistant.${preferencesContext}${ratingContext}`;

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
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      };
    } else {
      headers = {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      };
      requestBody = {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages,
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("AI API Error:", errorData);
      throw new Error(`AI API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    let message;
    if (isOpenAI) {
      message = data.choices[0].message.content;
    } else {
      message = data.content[0].text;
    }

    // Clean up any JSON code blocks that might have been included
    if (message.includes('```json') || message.includes('```')) {
      message = message.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }

    return new Response(
      JSON.stringify({ message }),
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
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
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