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

    const { action, modelId, isActive, isDefault } = await req.json();

    if (!action || !modelId) {
      throw new Error("action and modelId are required");
    }

    let result;

    switch (action) {
      case "set_default":
        // Set this model as default (trigger will unset others)
        const { error: defaultError } = await supabaseClient
          .from("llm_models")
          .update({ is_default: true })
          .eq("id", modelId);

        if (defaultError) {
          throw new Error(`Failed to set default model: ${defaultError.message}`);
        }
        result = { message: "Default model updated" };
        break;

      case "toggle_active":
        // Toggle active status
        const { error: toggleError } = await supabaseClient
          .from("llm_models")
          .update({ is_active: isActive })
          .eq("id", modelId);

        if (toggleError) {
          throw new Error(`Failed to toggle model status: ${toggleError.message}`);
        }
        result = { message: "Model status updated" };
        break;

      default:
        throw new Error("Invalid action");
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
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
