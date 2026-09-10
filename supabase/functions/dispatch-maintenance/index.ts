// Deploy with: supabase functions deploy dispatch-maintenance --no-verify-jwt
// Invoke every minute from Supabase Cron, GitHub Actions, or another trusted scheduler.
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (request) => {
  if (request.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const { error } = await supabase.rpc("process_dispatch_timeouts");
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
