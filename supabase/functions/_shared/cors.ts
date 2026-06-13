const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || req.headers.get("origin");
  const isLocalhost = origin && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"));
  
  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": isLocalhost ? origin : allowedOrigin,
  };
}
