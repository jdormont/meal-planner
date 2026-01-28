import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { Message, UserPreferences, ModelConfig, CuisineProfile, RatingHistoryItem } from "../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RecipeResponseSchema = z.object({
  reply: z.string().optional(),
  suggestions: z.array(z.object({
    title: z.string(),
    type: z.enum(["recipe", "cocktail"]),
    description: z.string(),
    time_estimate: z.string().optional(),
    difficulty: z.string(),
    reason_for_recommendation: z.string(),
    cuisine: z.string().optional(),
    tags: z.object({
      protein: z.string(),
      carb: z.string(),
      method: z.string()
    }).optional(),
    full_details: z.optional(z.object({
      ingredients: z.array(z.string()),
      instructions: z.array(z.string()),
      nutrition_notes: z.optional(z.string())
    }))
  }))
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};



async function getUserModel(supabaseClient: SupabaseClient, userId: string): Promise<ModelConfig | null> {
  try {
    const { data: profile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("assigned_model_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return null;
    }

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

async function callOpenAI(apiKey: string, model: string, messages: Message[], systemPrompt: string) {
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
      response_format: { type: "json_object" },
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

async function callAnthropic(apiKey: string, model: string, messages: Message[], systemPrompt: string) {
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

async function callGemini(apiKey: string, model: string, messages: Message[], systemPrompt: string) {
  const contents = [
    {
      role: "user",
      parts: [{ text: systemPrompt }]
    },
    ...messages.map((msg: Message) => ({
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
          responseMimeType: "application/json",
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

async function getRecentlySuggestedRecipes(
  userId: string,
  supabaseClient: SupabaseClient
): Promise<{recipe_name: string, protein: string | null, carb: string | null}[]> {
  try {
    // Fetch recipes suggested in the last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data, error } = await supabaseClient
      .from("suggested_recipes")
      .select("recipe_name, protein, carb")
      .eq("user_id", userId)
      .gte("created_at", twoWeeksAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching recent recipes:", error);
      return [];
    }

    return data as {recipe_name: string, protein: string | null, carb: string | null}[];
  } catch (error) {
    console.error("Error getting recent recipes:", error);
    return [];
  }
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

async function detectCuisineFromMessages(
  messages: Message[],
  userPreferences: UserPreferences,
  supabaseClient: SupabaseClient
): Promise<{ cuisine: string; confidence: string; rationale: string; allMatches: string } | null> {
  try {
    const { data: profiles, error } = await supabaseClient
      .from("cuisine_profiles")
      .select("cuisine_name, keywords, style_focus")
      .eq("is_active", true);

    if (error || !profiles || profiles.length === 0) {
      return null;
    }

    const lastUserMessage = messages.length > 0 && messages[messages.length - 1].role === "user"
      ? messages[messages.length - 1].content
      : "";

    const lastAssistantMessage = messages.length > 1 && messages[messages.length - 2].role === "assistant"
      ? messages[messages.length - 2].content
      : "";

    const messageText = `${lastUserMessage} ${lastAssistantMessage}`.toLowerCase();

    const matches: { cuisine: string; styleFocus: string; score: number; matchedKeywords: string[] }[] = [];

    for (const profile of profiles) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of profile.keywords) {
        const keywordLower = keyword.toLowerCase();
        const regex = new RegExp(`\\b${keywordLower}\\b`, "gi");
        const occurrences = (messageText.match(regex) || []).length;

        if (occurrences > 0) {
          const isCuisineName = keywordLower === profile.cuisine_name.toLowerCase();
          const points = occurrences * (isCuisineName ? 3 : 1);
          score += points;
          matchedKeywords.push(`${keyword} (${occurrences}x, +${points}pts)`);
        }
      }

      if (score > 0) {
        matches.push({
          cuisine: profile.cuisine_name,
          styleFocus: profile.style_focus,
          score,
          matchedKeywords
        });
      }
    }

    if (matches.length > 0) {
      matches.sort((a, b) => b.score - a.score);

      if (matches[0].score > 0) {
        let confidence = "low";
        if (matches[0].score >= 5) {
          confidence = "high";
        } else if (matches[0].score >= 2) {
          confidence = "medium";
        }

        const rationale = `Matched keywords: ${matches[0].matchedKeywords.join(", ")}. Total score: ${matches[0].score}`;
        const allMatchesSummary = matches.slice(0, 3).map(m =>
          `${m.cuisine} (${m.score}pts): ${m.matchedKeywords.slice(0, 3).join(", ")}`
        ).join(" | ");

        console.log(`Detected cuisine: ${matches[0].cuisine} (score: ${matches[0].score}, confidence: ${confidence})`);
        console.log(`Rationale: ${rationale}`);
        console.log(`All matches: ${allMatchesSummary}`);

        return {
          cuisine: matches[0].cuisine,
          confidence,
          rationale,
          allMatches: allMatchesSummary
        };
      }
    }

    if (userPreferences?.favorite_cuisines && userPreferences.favorite_cuisines.length > 0) {
      for (const favCuisine of userPreferences.favorite_cuisines) {
        const profile = profiles.find(
          (p: CuisineProfile) => p.cuisine_name.toLowerCase() === favCuisine.toLowerCase()
        );
        if (profile) {
          console.log(`Using favorite cuisine: ${profile.cuisine_name}`);
          return {
            cuisine: profile.cuisine_name,
            confidence: "medium",
            rationale: "Based on user's favorite cuisines",
            allMatches: "N/A"
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error detecting cuisine:", error);
    return null;
  }
}

async function getCuisineProfile(
  cuisineName: string,
  supabaseClient: SupabaseClient
): Promise<CuisineProfile | null> {
  try {
    const { data: profile, error } = await supabaseClient
      .from("cuisine_profiles")
      .select("*")
      .eq("cuisine_name", cuisineName)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching cuisine profile:", error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Error getting cuisine profile:", error);
    return null;
  }
}

function formatCuisineProfile(profile: CuisineProfile): string {
  if (!profile || !profile.profile_data) {
    return "";
  }

  const data = profile.profile_data;
  let formatted = `\n\n**🌍 CUISINE MODE: ${profile.cuisine_name.toUpperCase()} COOKING**\n\n`;
  formatted += `Style Focus: ${profile.style_focus}\n\n`;

  if (data.culinary_philosophy && data.culinary_philosophy.length > 0) {
    formatted += "**Culinary Philosophy:**\n";
    data.culinary_philosophy.forEach((point: string) => {
      formatted += `• ${point}\n`;
    });
    formatted += "\n";
  }

  if (data.ingredient_boundaries) {
    formatted += "**Ingredient Guidelines:**\n";

    if (data.ingredient_boundaries.common && data.ingredient_boundaries.common.length > 0) {
      formatted += `Common ingredients: ${data.ingredient_boundaries.common.slice(0, 10).join(", ")}`;
      if (data.ingredient_boundaries.common.length > 10) {
        formatted += ", and more";
      }
      formatted += "\n\n";
    }

    if (data.ingredient_boundaries.avoid && data.ingredient_boundaries.avoid.length > 0) {
      formatted += `Avoid (unless confirmed available): ${data.ingredient_boundaries.avoid.join(", ")}\n\n`;
    }
  }

  if (data.technique_defaults && data.technique_defaults.length > 0) {
    formatted += "**Technique Approach:**\n";
    data.technique_defaults.forEach((technique: string) => {
      formatted += `• ${technique}\n`;
    });
    formatted += "\n";
  }

  if (data.flavor_balance_norms) {
    formatted += "**Flavor Balance:**\n";
    Object.entries(data.flavor_balance_norms).forEach(([key, value]) => {
      const label = key.replace(/_/g, " ");
      formatted += `• ${label}: ${value}\n`;
    });
    formatted += "\n";
  }

  if (data.canonical_recipe_structure) {
    formatted += "**Recipe Structure:**\n";
    if (data.canonical_recipe_structure.timing_target) {
      formatted += `Target timing: ${data.canonical_recipe_structure.timing_target}\n`;
    }
    formatted += "\n";
  }

  if (data.generation_guardrails) {
    if (data.generation_guardrails.do_suggest && data.generation_guardrails.do_suggest.length > 0) {
      formatted += "**Good Options:**\n";
      data.generation_guardrails.do_suggest.forEach((item: string) => {
        formatted += `• ${item}\n`;
      });
      formatted += "\n";
    }

    if (data.generation_guardrails.dont_suggest && data.generation_guardrails.dont_suggest.length > 0) {
      formatted += "**Avoid:**\n";
      data.generation_guardrails.dont_suggest.forEach((item: string) => {
        formatted += `• ${item}\n`;
      });
      formatted += "\n";
    }
  }

  formatted += "**IMPORTANT:** Apply this cuisine's specific approach to ALL recipe suggestions and details. These guidelines override generic defaults while still respecting user allergies and preferences.\n";

  return formatted;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { messages, apiKey: clientApiKey, ratingHistory, userPreferences, userId, weeklyBrief, isAdmin, forceCuisine, action, recipe, targetServings } = await req.json();

    const authHeader = req.headers.get("Authorization");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      authHeader ? {
        global: {
          headers: { Authorization: authHeader },
        },
      } : undefined
    );

    let modelConfig: ModelConfig | null = null;
    if (userId) {
      modelConfig = await getUserModel(supabaseClient, userId);
    }

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
        const timeMap: Record<string, string> = {
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
  preferencesContext += `\nCooking For: ${userPreferences.household_size} people.`;
  // Add this override specifically to fight "boring" kid food
  preferencesContext += `\nNOTE: If cooking for children, ensure dishes are accessible (not too spicy), but DO NOT make them bland. Focus on savory, cheesy, or sweet-salty profiles that appeal to all ages.`;
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
        .filter((r: RatingHistoryItem) => r.rating === 'thumbs_up')
        .map((r: RatingHistoryItem) => {
          const title = r.recipes?.title || 'Unknown';
          const tags = r.recipes?.tags?.join(', ') || '';
          const feedback = r.feedback ? ` (${r.feedback})` : '';
          return `${title}${tags ? ` [${tags}]` : ''}${feedback}`;
        });

      const dislikedRecipes = ratingHistory
        .filter((r: RatingHistoryItem) => r.rating === 'thumbs_down')
        .map((r: RatingHistoryItem) => {
          const title = r.recipes?.title || 'Unknown';
          const tags = r.recipes?.tags?.join(', ') || '';
          const feedback = r.feedback ? ` (${r.feedback})` : '';
          return `${title}${tags ? ` [${tags}]` : ''}${feedback}`;
        });

      if (likedRecipes.length > 0 || dislikedRecipes.length > 0) {
        ratingContext = '\n\n**User Recipe Ratings History:**\n';
        if (likedRecipes.length > 0) {
          ratingContext += `\nRecipes they LIKED:\n${likedRecipes.map((r: string) => `- ${r}`).join('\n')}`;
        }
        if (dislikedRecipes.length > 0) {
          ratingContext += `\n\nRecipes they DISLIKED:\n${dislikedRecipes.map((r: string) => `- ${r}`).join('\n')}`;
        }
        ratingContext += '\n\nUse this information to personalize recommendations and avoid suggesting similar recipes to ones they disliked.';
      }
    }

    let weeklyBriefContext = '';
    if (weeklyBrief) {
      weeklyBriefContext = '\n\n**IMPORTANT INSTRUCTION - WEEKLY COOKING BRIEF MODE:**\n\n';
      weeklyBriefContext += 'The user has requested help with weekly meal planning. You MUST immediately enter "Weekly Cooking Brief" mode.\n\n';
      weeklyBriefContext += '**CRITICAL: Start by asking clarifying questions FIRST.**\n\n';
      weeklyBriefContext += 'Your response should:\n';
      weeklyBriefContext += '• Begin with a short, empathetic acknowledgment (1-2 sentences) in the "reply" field.\n';
      weeklyBriefContext += '• Ask up to 3 lightweight, conversational questions to understand their schedule and hunger in the "reply" field.\n';
      weeklyBriefContext += '• DO NOT provide meal recommendations yet - wait for their answers first.\n';
      weeklyBriefContext += '• **YOU MUST RETURN AN EMPTY ARRAY [] FOR "suggestions"** while asking these questions.\n\n';
      weeklyBriefContext += 'Remember: Be conversational, warm, and collaborative. Put all your text in the "reply" JSON field.';
    }

    let cuisineProfileContext = '';
    let cuisineMetadata = {
      applied: false,
      cuisine: '',
      styleFocus: '',
      confidence: '',
      rationale: '',
      allMatches: ''
    };

    // Logic: 
    // 1. If forceCuisine is provided (from clicking "View Recipe"), use THAT cuisine profile strict mode.
    // 2. If NO forceCuisine, we check for detection BUT we might NOT inject the strict profile if we want diversity.
    //    However, the plan says: "Disable global profile injection for the initial Suggestion phase".
    //    So if !forceCuisine, we skip profile injection (or maybe just keep detection for metadata but don't inject prompt).
    
    let detectedCuisine = null;
    let targetCuisine = forceCuisine;

    if (!targetCuisine) {
        // Run detection just for metadata or potential future use, but DON'T enforce it on the generation
        // UNLESS we want "smart" detection for Q&A. 
        // For now, per plan: "Disable global profile injection for initial phase".
        // So we only use detection for tagging, not prompting? 
        // Actually, the plan implies we simply DON'T inject the profile context unless forceCuisine is set.
        // But let's see if the user explicitly asked for "Thai food".
        // If they asked for "Thai food", we SHOULD probably still give Thai suggestions.
        // But the user wants "Tacos" + "Curry" variety. 
        // So we rely on the generic model knowledge for suggestions, and only STRICT profile for details.
        
        // Let's still run detection so we can log it, but NOT inject it into system prompt
        // OR we can inject it as "User seems interested in X", but not "STRICT MODE".
        // Evaluating the Plan again: "Disable global profile injection for the initial 'Suggestion' phase".
        // Okay, so we only inject if forceCuisine is true.
        detectedCuisine = await detectCuisineFromMessages(messages, userPreferences, supabaseClient);
    }

    if (targetCuisine) {
      const cuisineProfile = await getCuisineProfile(targetCuisine, supabaseClient);
      if (cuisineProfile) {
        cuisineProfileContext = formatCuisineProfile(cuisineProfile);
        cuisineMetadata = {
          applied: true,
          cuisine: cuisineProfile.cuisine_name,
          styleFocus: cuisineProfile.style_focus,
          confidence: "forced",
          rationale: "User selected cuisine suggestion",
          allMatches: "Force Cuisine"
        };
        console.log(`Injecting FORCED ${targetCuisine} cuisine profile into system prompt`);
      }
    } else if (detectedCuisine && !weeklyBrief) { 
        // Optional: We can still track what was detected, but we do NOT inject it.
        // Metadata tracking for debug
        cuisineMetadata = {
            applied: false,
            cuisine: detectedCuisine.cuisine,
            styleFocus: "",
            confidence: detectedCuisine.confidence,
            rationale: detectedCuisine.rationale,
            allMatches: detectedCuisine.allMatches
        };
    }


    let recentRecipesContext = "";
    if (userId && !forceCuisine) {
      const recentRecipes = await getRecentlySuggestedRecipes(userId, supabaseClient);
      if (recentRecipes.length > 0) {
        
        // Basic list of names
        const namesList = recentRecipes.map(r => `• ${r.recipe_name}`).join("\n");
        
        // Analysis of recent types
        const proteinCounts: Record<string, number> = {};
        const carbCounts: Record<string, number> = {};
        
        recentRecipes.forEach(r => {
            if (r.protein) proteinCounts[r.protein] = (proteinCounts[r.protein] || 0) + 1;
            if (r.carb) carbCounts[r.carb] = (carbCounts[r.carb] || 0) + 1;
        });

        const heavyRotationProteins = Object.entries(proteinCounts).filter(([_, count]) => count >= 2).map(([k]) => k);
        const heavyRotationCarbs = Object.entries(carbCounts).filter(([_, count]) => count >= 2).map(([k]) => k);

        recentRecipesContext = `
–––––––––––––––––
RECENTLY SUGGESTED
–––––––––––––––––

The user has recently seen these recipes (last 2 weeks):
${namesList}

**CRITICAL INSTRUCTION - FORCE VARIETY:**
1. **Cool-Down Rule:** Do NOT suggest recipes on the list above. Do NOT suggest conceptually similar variations.
2. **Feature Variety Rule:** 
   - We have recently suggested these proteins: ${heavyRotationProteins.join(", ") || "None in excess"}.
   - We have recently suggested these carbohydrates: ${heavyRotationCarbs.join(", ") || "None in excess"}.
   - **YOU MUST AVOID** suggesting more dishes with these main ingredients if possible.
   - If we have seen Chicken 2+ times, suggest Pork, Beef, Fish, or Veg.
   - If we have seen Pasta 2+ times, suggest Rice, Potatoes, or Bread.
`;
      }
    }


    if (action === 'rescale_recipe') {
      const rescaleSystemPrompt = `You are an expert chef with a deep understanding of food physics and culinary technique.

The user wants to scale a recipe from ${recipe.servings} servings to ${targetServings} servings.

YOUR GOAL:
Rewrite the recipe to work perfectly for this new volume. Do NOT just multiply ingredients by a number.

CRITICAL RESPONSIBILITIES:
1. INGREDIENTS: Scale quantities mathematically, but round to useful kitchen measurements.
2. PHYSICS CHECK:
   - Adjust cooking times (larger volumes often take longer, but not linearly).
   - Adjust pan sizes (e.g., "Use two baking sheets" instead of one).
   - Adjust technique (e.g., "Sear in batches" to avoid overcrowding).
3. SEASONING: Be careful with salt, spice, and leavening agents. They often scale non-linearly. Use your chef's judgment.
4. RATIONALE: You MUST explain your key scaling decisions in the "scaling_rationale" field. Why did you change the time? Why a different pan?

OUTPUT SCHEMA (JSON ONLY):
{
  "title": "string (Original Title - Scaled for X)",
  "scaling_rationale": "string (Explain the 'Why' behind your changes)",
  "description": "string (Brief summary)",
  "ingredients": ["string (New quantities)"],
  "instructions": ["string (Updated steps with new times/methods)"],
  "total_time": number (New estimated time in minutes),
  "servings": number (The target servings: ${targetServings}),
  "notes": "string (Any extra chef tips)"
}`;

       const userMessage = `Here is the original recipe:
Title: ${recipe.title}
Original Servings: ${recipe.servings}
Original Time: ${recipe.total_time}
Ingredients: ${JSON.stringify(recipe.ingredients)}
Instructions: ${JSON.stringify(recipe.instructions)}

Please rescale this to ${targetServings} servings.`;

       try {
         let resultContext = '';
         if (modelConfig.provider === 'openai') {
           resultContext = await callOpenAI(apiKey, modelConfig.model_identifier, [{role: 'user', content: userMessage}], rescaleSystemPrompt);
         } else if (modelConfig.provider === 'anthropic') {
           resultContext = await callAnthropic(apiKey, modelConfig.model_identifier, [{role: 'user', content: userMessage}], rescaleSystemPrompt);
         } else if (modelConfig.provider === 'google') {
           resultContext = await callGemini(apiKey, modelConfig.model_identifier, [{role: 'user', content: userMessage}], rescaleSystemPrompt);
         }

        // Clean up markdown block if present
        const jsonStr = resultContext.replace(/```json\n?|```/g, "").trim();
        const data = JSON.parse(jsonStr);
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

       } catch (error) {
         console.error("Error rescaling recipe:", error);
         return new Response(
           JSON.stringify({ error: "Failed to rescale recipe", details: error.message }),
           { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
    }

    const systemPrompt = `You are a structured data engine, but you are also a MODERN, FLAVOR-OBSESSED CHEF. 
    
    Your inspiration is the style of "Mob Kitchen", "Bon Appétit", and "Ottolenghi". 
    Your Goal: Make "accessible" food taste "incredible".

    **THE FLAVOR CONSTITUTION - READ CAREFULLY:**
    1. **Ban the Bland:** Never suggest "Plain Chicken Breast" or "Steamed Veggies". Every component must be seasoned, glazed, roasted, or dressed.
    2. **The "Pantry Hero" Rule:** Every recipe should utilize at least one "High Impact" pantry ingredient to boost flavor without effort. 
       - *Prioritize using:* Miso, Harissa, Gochujang, Feta, Chorizo, Anchovies, Lemon Zest, Browned Butter, Chili Crisp, Tahini, Fresh Herbs.
    3. **Texture is King:** Soft food needs crunch. Rich food needs acid. 
       - Always suggest toppings: Toasted breadcrumbs, crushed peanuts, crispy shallots, fresh scallions.
    4. **Sexy Titles:** The title must sound appetizing. 
       - *Bad:* "Chicken and Rice"
       - *Good:* "One-Pot Sticky Miso Chicken & Rice"
       - *Bad:* "Tomato Pasta"
       - *Good:* "Creamy Vodka Rigatoni with Basil"
    5. **Kid-Friendly ≠ Boring:** If the user has kids, do NOT remove flavor. remove *heat*, but keep the *savory/sweet/tangy* balance. Use "hidden veggie" sauces or "dippable" formats instead of making the food plain.

    You must output a valid JSON object matching the following schema. Do not output Markdown formatting outside the JSON.

    Schema:
    {
      "reply": "string (The conversational response to the user)",
      "suggestions": [
        {
          "title": "string",
          "type": "recipe" | "cocktail",
          "description": "string (headnote/summary ONLY. No titles here.)",
          "time_estimate": "string (e.g. '30 mins')",
          "difficulty": "string",
          "reason_for_recommendation": "string (Why this fits the user's request)",
          "cuisine": "string (Optional: If the recipe belongs to a specific cuisine, e.g. 'Mexican', 'Thai', 'Italian')",
          "tags": {
            "protein": "string (Primary protein, e.g. 'chicken', 'beef', 'tofu', 'beans', 'none')",
            "carb": "string (Primary carb base, e.g. 'pasta', 'rice', 'potato', 'bread', 'none')",
            "method": "string (Primary cooking method, e.g. 'roast', 'fry', 'simmer', 'grill', 'raw')"
          },
          "full_details": { // Optional: Only populated if the user explicitly asked for the full recipe
            "ingredients": ["string"],
            "instructions": ["string (Step-by-step)"],
            "nutrition_notes": "string (Optional)"
          }
        }
      ]
    }

    IMPORTANT: "suggestions" MUST ALWAYS be an array. If no suggestions, return [].

    MODES:
    1. **Planner Mode / First Wow**: If the user message starts with "PLANNER_MODE_ACTIVATED", you are generating the user's FIRST set of personalized recipes.
       - STRICTLY follow the provided constraints (Time, Skill, Allergies).
       - Generate exactly 3 distinct recipes.
       - Prioritize "Wow" factor: high flavor, visual appeal, but dead simple if "Beginner".
       - The tone should be welcoming, exciting, and confident.
       - "reply": A short, enthusiastic welcome message acknowledging their specific needs (e.g. "Welcome! I've found 3 quick and safe recipes just for you.").
       - "suggestions": Must contain 3 items.

    2. **Suggestion Mode**: Default. User asks for recommendations.
       - Provide 3-5 high-quality suggestions.
       - Use "reason_for_recommendation" to explain why it fits.

    1. **Advisor Mode** (User asks for ideas/what to cook):
       - Return 3-5 distinct, high-quality options in the "suggestions" array.
       - **IMPORTANT: Do NOT populate "full_details". Set it to null or omit it.**
       - We want to generate the full authentic details ONLY when the user clicks the recipe.
       - "reply" should be brief and encouraging.

    3. **Planner Mode** (User asks for a weekly plan):
       - FIRST: Return a "reply" with clarifying questions (schedule, novelty, hunger). **"suggestions" MUST be [] (empty array)**.
       - SECOND (After user answers): Return "suggestions" containing the planned meals (4-6 meals).
       - IMPORTANT: Put ALL conversational text, including questions, into the "reply" field. Do not put it in the "suggestions" array.

    4. **Advisor Mode** (User asks for ideas/what to cook) OR **Hybrid Mode**:
       - Return 3-5 distinct, high-quality options in the "suggestions" array.
       - **IMPORTANT: Do NOT populate "full_details". Set it to null or omit it.**
       - "reply" should be brief and encouraging.
       - If the user provides feedback (e.g. "make it spicy"), use the "reply" to acknowledge the change and "suggestions" for the NEW recipes.

    5. **Q&A Mode** (User asks a general cooking question):
       - Answer in "reply". Return "suggestions": [].

    CRITICAL: If the user asks for a substitution (e.g. "use tofu instead"), you MUST return the NEW, MODIFIED recipes in the "suggestions" array. Do not just describe the change in text.
    
    ${preferencesContext}${ratingContext}${weeklyBriefContext}${cuisineProfileContext}

    ${recentRecipesContext}
    `;

    let message;
    let usedFallback = false;
    try {
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



    // Process structured response
    let parsedData;
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

    // We no longer have a free-form text message. 
    // We return the structured data.
    // The 'message' field is kept for backward compatibility (maybe containing a summary?) 
    // or we can set it to the raw JSON string if that helps debugging.
    // But ideally the frontend should now switch to using the 'data' field.

    return new Response(
      JSON.stringify({
        data: parsedData,
        message: "", // Deprecated: No longer using free-form markdown
        modelUsed: modelConfig.model_name,
        modelId: modelConfig.model_identifier,
        provider: modelConfig.provider,
        usedFallback,
        ...(isAdmin && { cuisineMetadata })
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