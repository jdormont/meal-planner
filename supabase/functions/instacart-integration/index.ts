import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSTACART_API_URL = "https://connect.instacart.com/idp/v1/products/products_link";

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

    // In a real scenario, you'd verification the JWT here or trust Supabase's gateway if configured.
    // We'll proceed with the assumption that the caller is authenticated via the client.

    // 2. Parse Request Body
    const { items, landing_page_configuration, title } = await req.json();

    if (!items || !Array.isArray(items)) {
      throw new Error('Invalid items payload');
    }

    // 3. Prepare Instacart Payload
    // Map our internal items to Instacart LineItem schema if needed, 
    // but assuming frontend sends pre-formatted or matching structure for MVP.
    const instacartPayload = {
      title: title || "Meal Planner Shopping List",
      link_type: "recipe",
      line_items: items.map((item: any) => ({
        name: item.name,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || "each",
        // Optional fields
        display_text: item.display_text || item.name,
        filters: item.meta_data?.filters || undefined,
        // Ensure quantity is a number
      })),
      landing_page_configuration: landing_page_configuration || {
        enable_pantry_items: true,
      }
    };

    const instacartApiKey = Deno.env.get('INSTACART_CONNECT_API_KEY');
    if (!instacartApiKey) {
      console.error("Missing INSTACART_CONNECT_API_KEY");
      throw new Error("Server configuration error: Missing Instacart API Key");
    }

    console.log("Creating Instacart link with payload:", JSON.stringify(instacartPayload));

    // 4. Call Instacart API
    const response = await fetch(INSTACART_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${instacartApiKey}`
      },
      body: JSON.stringify(instacartPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Instacart API Error:", data);
      throw new Error(`Instacart API Error: ${JSON.stringify(data)}`);
    }

    // 5. Return Result
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
