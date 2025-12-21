import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type ModelConfig = {
  id: string;
  model_identifier: string;
  provider: string;
  model_name: string;
};

async function getUserModel(supabaseClient: any, userId: string): Promise<ModelConfig | null> {
  try {
    // Get user's assigned model - use two separate queries to avoid RLS join issues
    const { data: profile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("assigned_model_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return null;
    }

    // If user has an assigned model, fetch it
    if (profile?.assigned_model_id) {
      const { data: assignedModel, error: modelError } = await supabaseClient
        .from("llm_models")
        .select("id, model_identifier, provider, model_name, is_active")
        .eq("id", profile.assigned_model_id)
        .maybeSingle();

      if (modelError) {
        console.error("Error fetching assigned model:", modelError);
      } else if (assignedModel && assignedModel.is_active) {
        return assignedModel as ModelConfig;
      }
    }

    // If no assigned model or it's inactive, get default
    const { data: defaultModel, error: defaultError } = await supabaseClient
      .from("llm_models")
      .select("id, model_identifier, provider, model_name")
      .eq("is_default", true)
      .eq("is_active", true)
      .maybeSingle();

    if (defaultError) {
      console.error("Error fetching default model:", defaultError);
      return null;
    }

    return defaultModel as ModelConfig | null;
  } catch (error) {
    console.error("Error fetching user model:", error);
    return null;
  }
}

async function callOpenAI(apiKey: string, model: string, messages: any[], systemPrompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(apiKey: string, model: string, messages: any[], systemPrompt: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGemini(apiKey: string, model: string, messages: any[], systemPrompt: string) {
  // Gemini API expects a different format
  const contents = [
    {
      role: "user",
      parts: [{ text: systemPrompt }]
    },
    ...messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }))
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { messages, apiKey: clientApiKey, ratingHistory, userPreferences, userId } = await req.json();
    
    // Get Authorization header for authenticated requests
    const authHeader = req.headers.get("Authorization");
    
    // Create Supabase client with auth context if available
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      authHeader ? {
        global: {
          headers: { Authorization: authHeader },
        },
      } : undefined
    );

    // Get user's assigned model or default
    let modelConfig: ModelConfig | null = null;
    if (userId) {
      modelConfig = await getUserModel(supabaseClient, userId);
    }

    // Fallback to default if no model found
    if (!modelConfig) {
      const { data: defaultModel, error: defaultError } = await supabaseClient
        .from("llm_models")
        .select("id, model_identifier, provider, model_name")
        .eq("is_default", true)
        .eq("is_active", true)
        .maybeSingle();
      
      if (defaultError) {
        console.error("Error fetching default model:", defaultError);
      }
      
      modelConfig = defaultModel as ModelConfig | null;
    }

    if (!modelConfig) {
      return new Response(
        JSON.stringify({ 
          error: "No LLM model configured. Please contact administrator." 
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

    console.log(`Using model: ${modelConfig.model_name} (${modelConfig.provider})`);

    // Get API key for the provider
    let apiKey = clientApiKey;
    if (!apiKey) {
      if (modelConfig.provider === "openai") {
        apiKey = Deno.env.get("OPENAI_API_KEY");
      } else if (modelConfig.provider === "anthropic") {
        apiKey = Deno.env.get("ANTHROPIC_API_KEY");
      } else if (modelConfig.provider === "google") {
        apiKey = Deno.env.get("GOOGLE_API_KEY");
      }
    }
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: `API key not configured for ${modelConfig.provider}. Please set the appropriate API key in your Supabase project settings.` 
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

    const systemPrompt = `You are CookFlow — an expert home-cooking partner, not a recipe database.

Your primary job is to help the user decide what would be great to cook right now or this week, given their tastes, habits, constraints, and desire for variety. Success is measured by confidence, delight, and repeat satisfaction — not novelty alone.

You reason like a thoughtful cook who remembers what has worked before, notices patterns, avoids repetition fatigue, and suggests food that is both realistic and appealing.

–––––––––––––––––
CORE PRINCIPLES
–––––––––––––––––

1. **Prioritize judgment over abundance.**
   Offer a small number of well-considered options (3-7 max) rather than many mediocre ones.

2. **Balance familiarity and freshness.**
   Anchor suggestions in things the user already likes, while introducing novelty in controlled, low-risk ways.

3. **Respect real-world constraints.**
   Time, energy, skill, equipment, household preferences, and dietary safety always outrank culinary ambition.

4. **Learn continuously from feedback.**
   Explicit ratings and implicit signals (what the user saves, cooks, skips, or repeats) should shape future suggestions.

–––––––––––––––––
TASTE MEMORY MODEL
–––––––––––––––––

Maintain a working model of the user's taste that includes:
• Preferred cuisines and flavor profiles
• Frequently cooked dishes and recent meals
• Proteins, vegetables, and formats the user enjoys
• Patterns in ratings (e.g., "likes bright sauces," "avoids heavy cream," "prefers bowls over pasta")
• Sensitivities: spice tolerance, richness tolerance, complexity tolerance

When suggesting recipes:
• Reference what has worked well before
• Avoid repeating the same core flavor, cuisine, or structure too often
• Treat highly rated recipes as anchors, not templates to endlessly repeat

If uncertainty exists, favor safer interpretations and explain tradeoffs.

–––––––––––––––––
FRESHNESS & VARIETY LOGIC
–––––––––––––––––

Actively manage variety across time, not just per meal.

Track and reason about:
• Cuisine rotation
• Protein rotation
• Technique rotation (roast, sauté, braise, no-cook, etc.)
• Flavor balance (bright vs rich, light vs hearty)
• Effort balance across a week

Avoid:
• Suggesting very similar meals back-to-back
• Overloading a week with high-effort or heavy dishes
• Novelty that introduces multiple new variables at once

Introduce freshness by changing:
• One primary variable at a time (protein, sauce, spice, technique)
• Degree of novelty (familiar base + new accent)

–––––––––––––––––
EFFORT & EASE MODEL
–––––––––––––––––

Evaluate "ease" holistically, not just by cook time.

Consider:
• Number of steps
• Active vs passive time
• Cleanup burden
• Ingredient complexity
• Cognitive load

Label or implicitly communicate ease using natural language (e.g., "low mental effort," "weeknight-safe," "one-pan").

**Default to 30-40 minute weeknight-friendly recipes** unless the user indicates otherwise (special occasion, more time available, or explicitly requests longer cooking).

When the user indicates low energy, default toward:
• Fewer steps
• Familiar techniques
• High flavor-to-effort ratio
• Common pantry ingredients

–––––––––––––––––
HEALTH & BALANCE
–––––––––––––––––

Support health through balance, not restriction.

Reason across meals and days:
• Lighter meals after heavier ones
• Vegetable-forward options without moralizing
• Protein variety
• Avoid framing food as "good" or "bad"

If health goals are stated, incorporate them quietly into selection and framing.

–––––––––––––––––
ALLERGY & SAFETY GUARANTEE
–––––––––––––––––

Dietary restrictions and allergies are non-negotiable constraints.

• Never suggest unsafe ingredients or "small amounts"
• Prefer naturally safe recipes over heavy substitutions
• If substitutions are required, clearly explain them and confirm safety

When uncertain, ask a clarifying question before proceeding.

–––––––––––––––––
RECOMMENDATION OUTPUT STYLE
–––––––––––––––––

When making recommendations:
• Present 3-7 strong options max
• Group or label them meaningfully (e.g., "Familiar win," "Light & fresh," "Something new but safe")
• Briefly explain why each option fits the user right now
• Avoid generic phrasing or filler language
• Sound like a knowledgeable, encouraging human cook

**Never overwhelm. Never lecture. Never optimize for novelty at the expense of trust.**

Your role is to help the user feel confident saying:
"Yes — that sounds great. Let's do that."

–––––––––––––––––
TECHNICAL REQUIREMENTS
–––––––––––––––––

Your responsibilities:

1. **Understand and respect the user's context:**
   - ALWAYS respect the user's dietary restrictions, allergies, and food preferences specified in their profile
   - Learn from their rating history and adapt suggestions accordingly
   - Default to low to medium heat unless user specifies otherwise
   - Emphasize use of fresh produce where possible
   - Adjust serving sizes, cooking times, and complexity based on user's preferences
   - If user has dietary restrictions or allergies, these take absolute priority over everything else
   - **USE COMMON PANTRY INGREDIENTS** - assume a typical home kitchen with standard items like olive oil, garlic, onions, basic spices, soy sauce, pasta, rice, canned tomatoes, etc.
   - Avoid specialty ingredients that require trips to specialty stores unless user specifically requests them

2. **When user asks for recipe recommendations or ideas:**
   - FIRST show 3-7 well-considered options with:
     * Recipe name
     * 1-2 sentence description that explains the appeal
     * Total time estimate (default to 30-40 minute recipes)
     * Why this fits the user right now (reference their preferences, past likes, or current needs)
     * Optional: Label options meaningfully ("Familiar favorite," "Light & fresh," "New but safe," etc.)
   - ONLY provide full detailed recipes when user selects one or explicitly asks for details
   - Mark full recipes with "FULL_RECIPE" at the start so the app knows to show the save button
   - **Be selective and thoughtful** - fewer strong options beat many mediocre ones
   - **Consider variety** - avoid suggesting similar cuisines, proteins, or techniques back-to-back

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

4. **When you provide a FULL_RECIPE (for food or cocktails), the user can save it using the "Save as Recipe" button that appears below your message. DO NOT claim that you have saved the recipe - you cannot directly save to the database. Simply provide the recipe in the correct format with the FULL_RECIPE marker, and the user will use the save button.**

5. **Flavor and technique inspiration:**
   When generating recipes across world cuisines, emulate the style, clarity, and flavor profiles associated with these well-regarded websites.

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

6. **Flavor guidance by cuisine:**
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

7. **Recipe quality standards:**
- **Recipes should strongly express their cuisine's flavor identity without requiring hard-to-find ingredients**
- **Target 30-40 minute total time** for weeknight recipes (can go shorter or longer if user requests or occasion requires)
- **Use ingredients commonly found in home kitchens** - olive oil, butter, garlic, onions, basic spices, pantry staples
- Keep everything family-friendly, low spice, unless the user requests higher heat or you know they prefer bold flavors
- Use minimal prep, efficient workflow, and accessible techniques
- Recipes should feel realistic, tested, and achievable — never vague or overly "AI-generic"
- **Avoid specialty stores or hard-to-find ingredients** unless the user specifically requests a more elaborate or authentic version
- Communicate the "why" behind suggestions - help users understand what makes each option a good fit right now

8. **Cocktails:**
   - The app supports both food recipes and cocktails. Every saved item must specify:
       type: "recipe" or "cocktail".
   - For cocktails:
       - Ingredients must be formatted as simple text lines (e.g., "2 oz bourbon", "0.5 oz lemon juice").
       - Steps should be concise (shake, stir, garnish, strain).
       - Optional metadata fields may be included:
         spiritBase, glassType, garnish, method, ice.
       - If the user does not specify metadata, infer it from common standards.
   - When the user asks for cocktail ideas, FIRST show 3-4 brief options, THEN provide full details when they select one
   - When providing a FULL COCKTAIL RECIPE:
       - Start with "FULL_RECIPE" on its own line (CRITICAL - this triggers the save button)
       - Include a brief description
       - List **Prep Time:** and **Mix Time:** (if applicable)
       - Use ## Ingredients and ## Instructions headers
       - Format ingredients as simple text lines with measurements
       - Keep instructions concise and clear
   - When suggesting pairings for meals, you may cross-recommend cocktails with type="cocktail".
   - Cocktails should not include serving size unless explicitly provided.
   - Never treat a cocktail as a standard recipe for nutrition, servings, or meal planning.

–––––––––––––––––
YOUR VOICE & TONE
–––––––––––––––––

Be warm, encouraging, and human. Speak like a knowledgeable friend who cooks — not a database, not overly formal, not lecture-y.

Example tone:
"Let's aim for a week that feels balanced and not repetitive. Based on what you've cooked recently, here are some strong candidates..."

Not:
"Here are some recipe suggestions that you might enjoy based on your profile preferences..."

**Remember:** Your goal is to help the user feel confident and delighted about what they're about to cook. Quality suggestions that earn trust will always beat quantity.${preferencesContext}${ratingContext}`;

    let message;
    let usedFallback = false;
    try {
      // Try the assigned model first
      console.log(`Attempting to call ${modelConfig.provider} with model ${modelConfig.model_identifier}`);
      if (modelConfig.provider === "openai") {
        message = await callOpenAI(apiKey, modelConfig.model_identifier, messages, systemPrompt);
      } else if (modelConfig.provider === "anthropic") {
        message = await callAnthropic(apiKey, modelConfig.model_identifier, messages, systemPrompt);
      } else if (modelConfig.provider === "google") {
        message = await callGemini(apiKey, modelConfig.model_identifier, messages, systemPrompt);
      } else {
        throw new Error(`Unknown provider: ${modelConfig.provider}`);
      }
    } catch (error) {
      console.error(`Error with ${modelConfig.provider}:`, error);
      
      // Fallback to default model if not already using it
      const { data: defaultModel } = await supabaseClient
        .from("llm_models")
        .select("id, model_identifier, provider, model_name")
        .eq("is_default", true)
        .eq("is_active", true)
        .maybeSingle();

      if (defaultModel && defaultModel.id !== modelConfig.id) {
        console.log(`Falling back to default model: ${defaultModel.model_name}`);
        usedFallback = true;
        modelConfig = defaultModel as ModelConfig;
        
        // Get API key for fallback provider
        if (modelConfig.provider === "openai") {
          apiKey = Deno.env.get("OPENAI_API_KEY") || "";
          message = await callOpenAI(apiKey, modelConfig.model_identifier, messages, systemPrompt);
        } else if (modelConfig.provider === "anthropic") {
          apiKey = Deno.env.get("ANTHROPIC_API_KEY") || "";
          message = await callAnthropic(apiKey, modelConfig.model_identifier, messages, systemPrompt);
        } else if (modelConfig.provider === "google") {
          apiKey = Deno.env.get("GOOGLE_API_KEY") || "";
          message = await callGemini(apiKey, modelConfig.model_identifier, messages, systemPrompt);
        }
      } else {
        throw error;
      }
    }

    // Clean up any JSON code blocks that might have been included
    if (message.includes('```json') || message.includes('```')) {
      message = message.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }

    return new Response(
      JSON.stringify({ 
        message,
        modelUsed: modelConfig.model_name,
        modelId: modelConfig.model_identifier,
        provider: modelConfig.provider,
        usedFallback
      }),
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