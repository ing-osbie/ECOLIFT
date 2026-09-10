// Deploy with: supabase functions deploy classify-waste
// Set secret with: supabase secrets set GEMINI_API_KEY=your_gemini_api_key
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: auth } } },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid user session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured on the Supabase Edge Function.",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { imageBase64, mimeType, prompt, model } = await request.json();
    if (
      typeof imageBase64 !== "string" ||
      imageBase64.length === 0 ||
      imageBase64.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3)
    ) {
      return new Response(
        JSON.stringify({ error: "Image is invalid or exceeds 6MB payload limit" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const modelsToTry = model && CANDIDATE_MODELS.includes(model)
      ? [model, ...CANDIDATE_MODELS.filter((m) => m !== model)]
      : CANDIDATE_MODELS;

    let lastResponse: Response | null = null;
    let lastPayload: any = null;

    for (const m of modelsToTry) {
      const providerResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType ?? "image/jpeg",
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1024,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      const payload = await providerResponse.json();
      lastResponse = providerResponse;
      lastPayload = payload;

      if (providerResponse.ok) {
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify(lastPayload), {
      status: lastResponse?.status ?? 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
