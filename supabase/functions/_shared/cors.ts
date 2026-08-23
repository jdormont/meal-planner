const allowedOrigin = (Deno.env.get("ALLOWED_ORIGIN") ?? "*").replace(/\/+$/, "");

export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || req.headers.get("origin");
  const isLocalhost = origin && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"));
  // Vercel preview deployments use a unique *.vercel.app subdomain per build,
  // so allow those in addition to the configured ALLOWED_ORIGIN (auth is still
  // required via the Authorization header, which CORS doesn't bypass).
  const isVercelPreview = origin && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);

  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": isLocalhost || isVercelPreview ? origin : allowedOrigin,
  };
}
