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
    const { query } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const pexelsApiKey = Deno.env.get("PEXELS_API_KEY");

    if (!pexelsApiKey) {
      return new Response(
        JSON.stringify({
          error: "Pexels API key not configured",
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

    let sanitizedQuery = query.toLowerCase().trim();

    const termReplacements: Record<string, string> = {
      'thighs': 'meat',
      'thigh': 'meat',
      'breast': 'meat',
      'breasts': 'meat',
      'leg': 'meat',
      'legs': 'meat',
      'wing': 'wings',
      'butt': 'roast',
      'rump': 'roast',
    };

    for (const [problematic, safe] of Object.entries(termReplacements)) {
      const regex = new RegExp(`\\b${problematic}\\b`, 'gi');
      sanitizedQuery = sanitizedQuery.replace(regex, safe);
    }

    const foodQuery = `${sanitizedQuery} food dish recipe`;

    const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(foodQuery)}&per_page=1&orientation=landscape`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "Authorization": pexelsApiKey,
      },
    });

    if (!response.ok) {
      console.error("Pexels API Error:", response.statusText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch image from Pexels",
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
    
    const imageUrl = data.photos && data.photos.length > 0
      ? data.photos[0].src.large
      : null;

    return new Response(
      JSON.stringify({ imageUrl }),
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