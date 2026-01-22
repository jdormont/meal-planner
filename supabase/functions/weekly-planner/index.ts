import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { Message, UserPreferences, ModelConfig, RatingHistoryItem } from "../_shared/types.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// --- Shared LLM Logic (Duplicated from ai-chat to avoid refactor risks) ---

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
    }).optional()
  }))
});

async function getRecentExclusions(supabase: SupabaseClient, userId: string): Promise<string[]> {
    // Get recipes from last 5 weeks (35 days)
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    
    // Check both suggested_recipes AND weekly_meal_sets
    const { data: suggested } = await supabase
        .from('suggested_recipes')
        .select('recipe_name')
        .eq('user_id', userId)
        .gte('created_at', thirtyFiveDaysAgo.toISOString());
        
    const { data: weekly } = await supabase
        .from('weekly_meal_sets')
        .select('recipes')
        .eq('user_id', userId)
        .gte('created_at', thirtyFiveDaysAgo.toISOString());
        
    const names = new Set<string>();
    suggested?.forEach(r => names.add(r.recipe_name));
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
    const { userId } = await req.json();
    if (!userId) return new Response(JSON.stringify({ error: "userId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Init Supabase (Service Role needed for writing to weekly_meal_sets without RLS acting up if triggered by Cron?)
    // Actually, if we pass the user's token it's fine. But Cron won't have it.
    // So we use Service Role Key for the scheduled job.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get User Model & Preferences
    const modelConfig = await getUserModel(supabase, userId);
    if (!modelConfig) throw new Error("No active LLM model found for user.");

    const { data: prefs } = await supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle();
    
    // 2. Get Exclusions
    const excludedNames = await getRecentExclusions(supabase, userId);
    
    // 3. Construct System Prompt
    let prompt = `You are a professional chef creating a "Weekly Meal Drop" for a client.
    
    YOUR GOAL: Generate exactly 5 unique, diverse dinner recipes for the week.
    
    CRITICAL VARIETY RULES (The "Archetypes"):
    You MUST include one of each:
    1. Poultry dish (Chicken, Turkey, Duck)
    2. Red Meat dish (Beef, Pork, Lamb) OR Heavy Plant Protein (e.g. Lentil Stew, rich Tofu curry) if vegetarian.
    3. Fish/Seafood dish (or light Plant Protein if vegetarian/allergy)
    4. Vegetarian/Vegan dish (Grain bowl, Pasta, Salad)
    5. Wildcard (Something fun: Tacos, Pizza, Stir Fry, Casserole)
    
    COOKING METHODS MIX:
    Ensure a mix of: 1 Sheet Pan/One Pot (Easy), 1 Slow Cook/Simmer, 1 Quick Sauté/Grill.

    AVOID REPEATS:
    Do NOT suggest these recently seen recipes: ${excludedNames.slice(0, 50).join(', ')}.
    `;
    
    if (prefs) {
        if (prefs.food_restrictions?.length) {
            prompt += `\n\n🚨 CRITICAL ALLERGIES: ${prefs.food_restrictions.join(', ')}. NEVER INCLUDE THESE.`;
        }
        if (prefs.favorite_cuisines?.length) {
            prompt += `\n\nUser loves: ${prefs.favorite_cuisines.join(', ')}.`;
        }
    }
    
    prompt += `\n\nOUTPUT FORMAT: Return a valid JSON object matching this schema. NO Markdown.
    {
      "suggestions": [
        {
          "title": "string",
          "type": "recipe" | "cocktail" (Always "recipe" for this task),
          "description": "string (Appetizing visual description)",
          "time_estimate": "string",
          "difficulty": "string",
          "reason_for_recommendation": "string (Why this archetype fits)",
          "cuisine": "string",
          "tags": { "protein": "string", "carb": "string", "method": "string" }
        }
      ]
    }`;

    // 4. Call LLM
    let apiKey = Deno.env.get(`${modelConfig.provider.toUpperCase()}_API_KEY`);
    // Fallback logic for keys if needed... (simplified)
    if (!apiKey && modelConfig.provider === 'openai') apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error(`No API Key for ${modelConfig.provider}`);

    const jsonStr = await callLLM(modelConfig.provider, apiKey, modelConfig.model_identifier, [{role: "user", content: "Generate this week's 5 meals."}], prompt);
    
    // 5. Validate & Parse
    let result;
    try {
        result = JSON.parse(jsonStr);
        // Clean markdown if present
    } catch {
        // Try to clean markdown
        const clean = jsonStr.replace(/```json/g, "").replace(/```/g, "");
        result = JSON.parse(clean);
    }
    
    const parsed = RecipeResponseSchema.parse(result);
    // TODO: Extra validation for Archetype count? For now, we trust the prompt.

    // 6. Save to DB
    // Get start of week (Sunday)
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day; // Adjust to Sunday
    const sunday = new Date(today.setDate(diff));
    sunday.setHours(0,0,0,0);
    const dateStr = sunday.toISOString().split('T')[0];

    const { error: insertError } = await supabase.from('weekly_meal_sets').upsert({
        user_id: userId,
        week_start_date: dateStr,
        recipes: parsed.suggestions 
    }, { onConflict: 'user_id, week_start_date' });

    if (insertError) throw insertError;

    // 7. Send Email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
        try {
            // Fetch User Email
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
            if (userError || !userData.user?.email) throw new Error("Could not fetch user email");

            const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: sans-serif; color: #333; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #fce7e4; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; }
                    .header h1 { color: #c2410c; margin: 0; }
                    .meal-card { border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 15px; display: flex; align-items: center; }
                    .meal-info { flex: 1; }
                    .meal-title { font-weight: bold; font-size: 18px; margin-bottom: 4px; color: #1f2937; }
                    .meal-meta { font-size: 14px; color: #6b7280; }
                    .cta-button { display: inline-block; background-color: #c2410c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
                    .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 40px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Your Weekly Menu 🍽️</h1>
                        <p>5 fresh ideas curated just for you.</p>
                    </div>
                    
                    <div style="padding: 20px 0;">
                        ${parsed.suggestions.map((r: any) => `
                            <div class="meal-card">
                                <div class="meal-info">
                                    <div class="meal-title">${r.title}</div>
                                    <div class="meal-meta">${r.time_estimate} • ${r.difficulty}</div>
                                    <div style="font-size: 14px; margin-top: 5px;">${r.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="text-align: center;">
                        <a href="${Deno.env.get("SITE_URL") || 'https://your-app-url.com'}/community" class="cta-button">View & Plan Your Week</a>
                    </div>

                    <div class="footer">
                        <p>You received this because you are subscribed to Weekly Planner updates.</p>
                        <p><a href="#" style="color: #9ca3af;">Unsubscribe</a></p>
                    </div>
                </div>
            </body>
            </html>
            `;

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Sous Chef <planner@yourdomain.com>', // User needs to configure domain
                    to: userData.user.email,
                    subject: `Your Menu for the Week of ${new Date(dateStr).toLocaleDateString()}`,
                    html: emailHtml
                })
            });

            if (!res.ok) console.error("Resend Error:", await res.text());
            else console.log("Email sent successfully to", userData.user.email);

        } catch (emailErr) {
            console.error("Failed to send email:", emailErr);
            // Don't fail the request, just log
        }
    }

    return new Response(JSON.stringify({ success: true, date: dateStr, count: parsed.suggestions.length }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Weekly Planner Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
