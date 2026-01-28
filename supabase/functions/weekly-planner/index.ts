// deno-lint-ignore-file
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { Message, UserPreferences, ModelConfig, RatingHistoryItem } from "../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { render } from "npm:@react-email/render@0.0.12";
import { WeeklyMenuEmail } from "../_shared/emails/WeeklyMenuEmail.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// --- Shared LLM Logic ---

async function getUserModel(supabaseClient: SupabaseClient, userId: string): Promise<ModelConfig | null> {
  try {
    const { data: profile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("assigned_model_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) console.error("Error fetching user profile:", profileError);

    if (profile?.assigned_model_id) {
      const { data: assignedModel, error: modelError } = await supabaseClient
        .from("llm_models")
        .select("id, model_identifier, provider, model_name, is_active")
        .eq("id", profile.assigned_model_id)
        .maybeSingle();

      if (!modelError && assignedModel?.is_active) return assignedModel as ModelConfig;
    }

    const { data: defaultModel, error: defaultError } = await supabaseClient
      .from("llm_models")
      .select("id, model_identifier, provider, model_name")
      .eq("is_default", true)
      .eq("is_active", true)
      .maybeSingle();

    if (defaultError) console.error("Error fetching default model:", defaultError);
    return defaultModel as ModelConfig | null;
  } catch (error) {
    console.error("Error fetching user model:", error);
    return null;
  }
}

async function callLLM(provider: string, apiKey: string, model: string, messages: Message[], systemPrompt: string): Promise<string> {
    if (provider === 'openai') {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: [{ role: "system", content: systemPrompt }, ...messages],
                response_format: { type: "json_object" },
                temperature: 0.7
            }),
        });
        if (!response.ok) throw new Error(`OpenAI Error: ${await response.text()}`);
        const data = await response.json();
        return data.choices[0].message.content;
    } else if (provider === 'anthropic') {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                max_tokens: 2000,
                system: systemPrompt,
                messages: messages
            }),
        });
        if (!response.ok) throw new Error(`Anthropic Error: ${await response.text()}`);
        const data = await response.json();
        return data.content[0].text;
    } else if (provider === 'google') {
        const contents = [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...messages.map(msg => ({ role: msg.role === "assistant" ? "model" : "user", parts: [{ text: msg.content }] }))
        ];
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents,
                generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
            }),
        });
        if (!response.ok) throw new Error(`Gemini Error: ${await response.text()}`);
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
    throw new Error(`Unknown provider: ${provider}`);
}

// --- Image Generation Logic ---

async function generateRecipeImage(title: string, description: string, supabaseClient: SupabaseClient): Promise<string | null> {
    try {
        const apiKey = Deno.env.get("OPENAI_API_KEY");
        if (!apiKey) return null;

        const basePrompt = `Create a realistic, accurate image of the finished dish as it would appear when freshly cooked at home.
The image should be:
- Photorealistic but natural (not overly stylized or hyper-saturated)
- Shot in soft, diffused natural light
- Clearly focused on the food, centered in frame
- Served in simple, everyday dishware (ceramic bowl or plate)
- Set on a neutral surface (wood, stone, or linen), with minimal background detail

Avoid:
- Stock photography look
- Excessive props, garnishes, or decorative elements
- Restaurant plating or fine-dining presentation
- Hands, people, text, or utensils in motion
- The dish should look warm, comforting, and realistically portioned.`;

        const fullPrompt = `${basePrompt}\n\nDish to create: ${title}${description ? `: ${description}` : ''}`;

        console.log(`Generating image for: ${title}`);
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: fullPrompt,
                n: 1,
                size: "1024x1024",
                quality: "standard",
                style: "natural"
            }),
        });

        if (!response.ok) {
            console.error(`DALL-E Error for ${title}:`, await response.text());
            return null;
        }

        const data = await response.json();
        const temporaryImageUrl = data.data?.[0]?.url;

        if (!temporaryImageUrl) return null;

        // Download and Upload to Supabase
        const imageResponse = await fetch(temporaryImageUrl);
        if (!imageResponse.ok) return null;

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        const timestamp = Date.now();
        const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
        const filename = `weekly/${sanitizedTitle}-${timestamp}.png`;

        const { error: uploadError } = await supabaseClient
            .storage
            .from('recipe-images')
            .upload(filename, imageBuffer, {
                contentType: 'image/png',
                cacheControl: '31536000',
                upsert: false
            });

        if (uploadError) {
            console.error(`Upload Error for ${title}:`, uploadError);
            return null;
        }

        const { data: urlData } = supabaseClient.storage.from('recipe-images').getPublicUrl(filename);
        return urlData.publicUrl;

    } catch (err) {
        console.error(`Image Gen Exception for ${title}:`, err);
        return null;
    }
}

// --- Specific Weekly Planner Logic ---

const RecipeResponseSchema = z.object({
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
    ingredients: z.array(z.object({
        name: z.string(),
        amount: z.string(),
        unit: z.string()
    })),
    instructions: z.array(z.string())
  }))
});

async function getGlobalRecentExclusions(supabase: SupabaseClient): Promise<string[]> {
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    
    // Fetch from Global Sets (user_id is NULL)
    const { data: weekly } = await supabase
        .from('weekly_meal_sets')
        .select('recipes')
        .is('user_id', null)
        .gte('created_at', thirtyFiveDaysAgo.toISOString());
        
    const names = new Set<string>();
    weekly?.forEach(row => {
        const recipes = row.recipes as any[];
        if (Array.isArray(recipes)) {
            recipes.forEach(r => { if(r.title) names.add(r.title); });
        }
    });
    
    return Array.from(names);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { userId } = await req.json().catch(() => ({}));
    // userId is optional now for generation context (maybe just for auth check), 
    // but we need it if we want to send a test email to the admin who clicked the button.

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting Global Weekly Menu Generation...");

    // 1. Get Exclusions (Global Context)
    const excludedNames = await getGlobalRecentExclusions(supabase);
    console.log(`Excluding ${excludedNames.length} recent global recipes.`);
    
    // 2. Construct System Prompt (Generic / Community Focused)
    const prompt = `You are a professional chef creating the "Community Menu of the Week" for a popular meal planning app.
    
    YOUR GOAL: Generate exactly 5 unique, diverse dinner recipes that appeal to a wide audience.
    
    CRITICAL VARIETY RULES (The "Archetypes"):
    You MUST include one of each:
    1. Poultry dish (Chicken, Turkey, Duck) - Crowd pleaser.
    2. Red Meat dish (Beef, Pork, Lamb) OR Rich Plant Protein - Comfort food.
    3. Fish/Seafood dish (or light Plant Protein) - Lighter option.
    4. Vegetarian/Vegan dish (Grain bowl, Pasta, Salad) - Plant forward.
    5. Wildcard (Something fun: Tacos, Pizza, Stir Fry, Casserole) - Family favorite.
    
    CUISINE MIX:
    Ensure a mix of different cuisines (e.g., Italian, Mexican, Indian, Japanese, etc.)

    COOKING METHODS MIX:
    1. Ensure a mix of: 1 Sheet Pan/One Pot (Easy), 1 Slow Cook/Simmer, 1 Quick Sauté/Grill.
    2. Ensure a mix of different cooking times - skew toward 30-45 minutes.

    AVOID REPEATS:
    Do NOT suggest these recently featured global recipes: ${excludedNames.slice(0, 50).join(', ')}.
    
    DATA QUALITY REQUIREMENTS (CRITICAL):
    - **Ingredients**: Must be precise (e.g., "1.5 lbs", "2 tbsp", "1 large bunch"). Avoid vague terms like "some" or "to taste".
    - **Instructions**: Must be DETAILED and STEP-BY-STEP. 
      - Bad: "Cook chicken then add sauce."
      - Good: "Heat 2 tbsp oil in a large skillet over medium-high heat. Pat chicken dry and sear for 4-5 minutes per side until golden. Remove from pan..."
      - Aim for 5-8 steps per recipe.
    
    OUTPUT FORMAT: Return a valid JSON object matching this schema. NO Markdown.
    {
      "suggestions": [
        {
          "title": "string",
          "type": "recipe",
          "description": "string (Appetizing visual description)",
          "time_estimate": "string",
          "difficulty": "string",
          "reason_for_recommendation": "Featured Community Pick",
          "cuisine": "string",
          "tags": { "protein": "string", "carb": "string", "method": "string" },
          "ingredients": [ { "name": "string (Butter)", "amount": "string (2 tbsp)", "unit": "string (tbsp)" } ],
          "instructions": [ "string (Detailed step 1)", "string (Detailed step 2)..." ]
        }
      ]
    }`;

    // 3. Call LLM (Use OpenAI by default for system tasks)
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("No OPENAI_API_KEY found.");

    // Using GPT-4o or 3.5-turbo if 4 not avail, let's try 4o-mini or 4 for quality
    const model = "gpt-4o"; 

    const jsonStr = await callLLM("openai", apiKey, model, [{role: "user", content: "Generate this week's community menu."}], prompt);
    
    // 4. Validate & Parse
    let result;
    try {
        result = JSON.parse(jsonStr);
    } catch {
        const clean = jsonStr.replace(/```json/g, "").replace(/```/g, "");
        result = JSON.parse(clean);
    }
    
    const parsed = RecipeResponseSchema.parse(result);

    // 5. Generate Images (Parallel) & Add Community Tags
    console.log("Starting image generation...");
    const recipesWithImages = await Promise.all(parsed.suggestions.map(async (recipe) => {
        const imageUrl = await generateRecipeImage(recipe.title, recipe.description, supabase);
        return {
            ...recipe,
            image_url: imageUrl,
            is_shared: true, // Community Tag
            is_public: true  // Visibility Tag
        };
    }));

    // 6. Save to DB (Global Set -> user_id = NULL)
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day + (day === 0 ? 0 : 7); // Calculate NEXT Sunday? Or CURRENT week's Sunday?
    // Usually "Week of..." implies the start date. 
    // If run on Tuesday, it's for THIS week (last Sunday). 
    // If run on Sunday, it's for THIS week (today).
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - day);
    currentSunday.setHours(0,0,0,0);
    const dateStr = currentSunday.toISOString().split('T')[0];

    console.log(`Saving Global Set for week: ${dateStr}`);

    // Check if set exists
    const { data: existing } = await supabase.from('weekly_meal_sets')
        .select('id')
        .is('user_id', null)
        .eq('week_start_date', dateStr)
        .maybeSingle();

    if (existing) {
        // Update existing
        const { error: updateError } = await supabase.from('weekly_meal_sets')
            .update({ recipes: recipesWithImages })
            .eq('id', existing.id);
        if (updateError) throw updateError;
    } else {
        // Insert new
        const { error: insertError } = await supabase.from('weekly_meal_sets').insert({
            user_id: null,
            week_start_date: dateStr,
            recipes: recipesWithImages 
        });
        if (insertError) throw insertError;
    }

    // 7. Send Test Email (to Admin/Invoker)
    // In production, this would trigger a bulk email job or be picked up by a separate cron.
    // For now, we confirm to the admin.
    if (userId) {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
            try {
                // Try fetching email from user_profiles or auth admin
                const { data: userData } = await supabase.auth.admin.getUserById(userId);
                if (userData?.user?.email) {
                    // Map recipes to the email component's format
                    const emailRecipes = recipesWithImages.map(r => ({
                        title: r.title,
                        time: r.time_estimate || "30 mins", // Fallback if missing
                        image_url: r.image_url ?? undefined // Convert null to undefined
                    }));

                    const emailHtml = await render(WeeklyMenuEmail({ recipes: emailRecipes }));

                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: 'Meal Planner Admin <josh@joshdormont.com>',
                            to: userData.user.email,
                            subject: `[Admin] Global Menu Generated: ${dateStr}`,
                            html: emailHtml
                        })
                    });
                }
            } catch (err) {
                console.error("Email Error:", err);
            }
        }
    }

    return new Response(JSON.stringify({ success: true, date: dateStr, count: recipesWithImages.length }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Weekly Planner Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
