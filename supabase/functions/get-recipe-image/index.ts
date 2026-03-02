import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

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
    const { title, description, ingredients } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Recipe title is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Google API key not configured",
          imageUrl: null
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const ingredientsList = Array.isArray(ingredients)
      ? ingredients.map((ing: any) => ing.name || ing).slice(0, 8).join(', ')
      : '';

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

    const specificPrompt = `${title}${description ? `: ${description}` : ''}${ingredientsList ? `. Key ingredients: ${ingredientsList}` : ''}`;

    const fullPrompt = `${basePrompt}\n\nDish to create: ${specificPrompt}`;

    console.log(`Generating image for: ${title}`);
    console.log("Using Google AI Studio model: nano-bannana (gemini-2.5-flash-image)");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
            { parts: [{ text: fullPrompt }] }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API Error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to generate image with Google API",
          imageUrl: null
        }),
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

    const base64Image = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Image) {
      return new Response(
        JSON.stringify({
          error: "No image generated",
          imageUrl: null
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Process base64 from Google API prediction
    console.log("Processing image from Google API...");
    const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "image/png";
    const imageResponse = await fetch(`data:${mimeType};base64,${base64Image}`);

    if (!imageResponse.ok) {
      console.error("Failed to process image from base64 encoding");
      return new Response(
        JSON.stringify({
          error: "Failed to process generated image",
          imageUrl: null
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    const filename = `${sanitizedTitle}-${timestamp}.png`;

    // Upload to Supabase Storage
    console.log("Uploading to Supabase Storage...");
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('recipe-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000', // Cache for 1 year
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({
          error: `Failed to store image: ${uploadError.message}`,
          imageUrl: null
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get the public URL
    const { data: urlData } = supabaseClient
      .storage
      .from('recipe-images')
      .getPublicUrl(filename);

    const permanentImageUrl = urlData.publicUrl;
    console.log("Image stored successfully:", permanentImageUrl);

    return new Response(
      JSON.stringify({ imageUrl: permanentImageUrl }),
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
        error: error instanceof Error ? error.message : "Unknown error occurred",
        imageUrl: null
      }),
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