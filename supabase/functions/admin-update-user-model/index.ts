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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      throw new Error("Admin access required");
    }

    const { userId, modelId } = await req.json();

    if (!userId) {
      throw new Error("userId is required");
    }

    // modelId can be null to reset to default
    if (modelId !== null && modelId !== undefined) {
      // Verify the model exists and is active
      const { data: model, error: modelError } = await supabaseClient
        .from("llm_models")
        .select("id")
        .eq("id", modelId)
        .eq("is_active", true)
        .maybeSingle();

      if (modelError || !model) {
        throw new Error("Invalid or inactive model");
      }
    }

    // Update user's assigned model
    const { error: updateError } = await supabaseClient
      .from("user_profiles")
      .update({ assigned_model_id: modelId })
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(`Failed to update user model: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "User model assignment updated" }),
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
