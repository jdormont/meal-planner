import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// --- Types & Schemas ---

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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// --- Helpers ---

// Apify Actors
const ACTORS = {
    INSTAGRAM: "apify~instagram-scraper", 
    TIKTOK: "clockworks~tiktok-scraper" 
};

async function fetchSocialCaption(url: string, apifyToken: string): Promise<string | null> {
    const isInstagram = url.includes("instagram.com");
    const isTikTok = url.includes("tiktok.com");

    if (!isInstagram && !isTikTok) {
        throw new Error("Unsupported URL. Only Instagram and TikTok are supported.");
    }

    const actorId = isInstagram ? ACTORS.INSTAGRAM : ACTORS.TIKTOK;
    
    // Construct Input based on platform
    // Instagram Post Scraper usually takes 'directUrls' array
    // TikTok Scraper usually takes 'postURLs' array
    const input = isInstagram 
        ? { directUrls: [url], resultsType: "details" }
        : { postURLs: [url], shouldDownloadCovers: false, shouldDownloadSlideshow: false, shouldDownloadSubtitles: false, shouldDownloadVideo: false };

    console.log(`Calling Apify Actor: ${actorId} for ${url}`);

    // Call Apify: Run Actor and wait for dataset (synchronous wrapper)
    // Using 'run-sync-get-dataset-items' for convenience
    const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}`;
    
    // Note: This waits for the run to finish (can take 10-20s)
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`Apify Error (${response.status}):`, errText);
        throw new Error(`Failed to fetch social post: ${response.statusText}`);
    }

    const items = await response.json();
    
    if (!Array.isArray(items) || items.length === 0) {
        console.warn("Apify returned no items.");
        return null;
    }

    const item = items[0];
    
    // Extract caption
    if (isInstagram) {
        // Common fields for IG scrapers
        return item.caption || item.text || item.description || null;
    } else {
        // Common fields for TikTok scrapers
        return item.text || item.desc || item.description || item.video_description || null;
    }
}

async function callOpenAI(apiKey: string, caption: string) {
  const systemPrompt = `You are a Recipe Extractor. I will give you a messy social media caption.

Extract the ingredients and instructions into valid JSON matching this structure:
{
  "reply": "Brief confirmation (e.g., 'Here is the pasta recipe!')",
  "suggestions": [
     {
        "title": "Recipe Title",
        "type": "recipe" | "cocktail",
        "description": "Brief yummy description",
        "time_estimate": "e.g. 30 min",
        "difficulty": "Easy" | "Medium" | "Hard",
        "reason_for_recommendation": "Imported from Social",
        "tags": { "protein": "...", "carb": "...", "method": "..." },
        "full_details": {
            "ingredients": ["1 cup flour", ...],
            "instructions": ["Step 1...", "Step 2..."],
            "nutrition_notes": "Optional notes found in caption"
        }
     }
  ]
}

If the caption implies a recipe but is missing details (e.g., "Link in bio" with no text), return a structured error or a "partial" recipe with the title as "Link in Bio Detected" and a helpful reply.

Style: Rewrite the instructions to be clear and professional, removing emojis and "TikTok speak" (e.g., change "throw it in the oven" to "Bake at 375°F").
Do not invent ingredients not present or implied. If critical info is missing, note it in 'nutrition_notes'.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o", // Strong model needed for messy text extraction
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the caption:\n\n${caption}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5, // Lower temperature for extraction precision
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
      const parsed = JSON.parse(content);
      // Validate schema
      return RecipeResponseSchema.parse(parsed);
  } catch (_e) {
      console.error("Failed to parse OpenAI JSON:", content);
      throw new Error("AI returned invalid JSON or schema mismatch");
  }
}

// --- Main Handler ---

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, userId: _userId } = await req.json();

    if (!url) {
        throw new Error("URL is required");
    }

    const apifyToken = Deno.env.get("APIFY_TOKEN");
    if (!apifyToken) {
        console.error("APIFY_TOKEN secret is missing!");
        throw new Error("Server configuration error: Apify Token missing.");
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
        throw new Error("Server configuration error: OpenAI API Key missing.");
    }

    // 1. Fetch Caption
    console.log(`Fetching caption for: ${url}`);
    
    // Log platform detection for debugging
    const isInstagram = url.includes("instagram.com");
    const isTikTok = url.includes("tiktok.com");
    console.log(`Platform Detection - IG: ${isInstagram}, TikTok: ${isTikTok}`);

    let caption = "";
    
    try {
        const fetched = await fetchSocialCaption(url, apifyToken);
        if (!fetched) {
             return new Response(
                JSON.stringify({ error: "Could not fetch caption. The post might be private, the link is invalid, or the scraper failed." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }
        caption = fetched;
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Apify Fetch Error:", errorMessage);
        
        // Return 400 for fetch errors so frontend doesn't show "Internal Server Error"
        return new Response(
            JSON.stringify({ 
                error: errorMessage, 
                details: "Failed to fetch content from the social link. Please check if the link is valid and public." 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
    
    console.log(`Caption fetched (${caption.length} chars). Parsing with AI...`);

    // 2. Parse with AI
    try {
        const result = await callOpenAI(openaiApiKey, caption);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (aiErr: unknown) {
        console.error("OpenAI Error:", aiErr);
        return new Response(
            JSON.stringify({ error: "Failed to parse recipe from caption." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Import Social Recipe Critical Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage || "Internal Server Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
