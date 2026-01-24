import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Confirming this is the correct endpoint based on user feedback and docs
const INSTACART_API_URL = "https://connect.dev.instacart.tools/idp/v1/products/products_link";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authorization Check (Supabase User)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // 2. Parse Request Body
    const { items, landing_page_configuration, title } = await req.json();

    if (!items || !Array.isArray(items)) {
      throw new Error('Invalid items payload');
    }

    // 3. Prepare Instacart Payload
    const instacartPayload = {
      title: title || "Meal Planner Shopping List",
      link_type: "recipe",
      line_items: items.map((item: any) => ({
        name: item.name,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || "each",
        display_text: item.display_text || item.name,
        filters: item.meta_data?.filters || undefined,
      })),
      landing_page_configuration: landing_page_configuration || {
        enable_pantry_items: true,
      }
    };

    // 4. Get API Key
    let instacartApiKey = Deno.env.get('INSTACART_CONNECT_API_KEY');
    
    if (!instacartApiKey) {
      console.error("Missing INSTACART_CONNECT_API_KEY");
      throw new Error("Server configuration error: Missing Instacart API Key");
    }

    // Trim any potential whitespace from copy-pasting
    instacartApiKey = instacartApiKey.trim();

    // Debug logging for API Key (masked)
    const keyPrefix = instacartApiKey.substring(0, 8);
    const keyLength = instacartApiKey.length;
    console.log(`Using API Key starting with: ${keyPrefix}... (Total Length: ${keyLength})`);

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${instacartApiKey}`
    };
    
    console.log("Creating Instacart link...");
    console.log("Target URL:", INSTACART_API_URL);

    // 5. Call Instacart API
    const response = await fetch(INSTACART_API_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(instacartPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Instacart API Error Status:", response.status);
      console.error("Instacart API Error Body:", JSON.stringify(data));
      throw new Error(`Instacart API Error (${response.status}): ${JSON.stringify(data)}`);
    }

    console.log("Instacart Success:", data);

    // 6. Return Result
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
