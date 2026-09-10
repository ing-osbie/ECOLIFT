// Deploy with: supabase functions deploy deliver-push-notifications --no-verify-jwt
// Invoke only from a trusted scheduler with the CRON_SECRET header.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Content-Type": "application/json" };

Deno.serve(async (request) => {
  if (request.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const { data: queued, error } = await supabase
    .from("notification_outbox")
    .select("id,user_id,title,body,payload,attempts")
    .is("delivered_at", null)
    .lt("attempts", 5)
    .order("created_at")
    .limit(100);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });

  let delivered = 0;
  for (const item of queued ?? []) {
    const { data: tokens } = await supabase.from("push_tokens").select("token").eq("user_id", item.user_id);
    if (!tokens?.length) {
      await supabase.from("notification_outbox").update({ attempts: item.attempts + 1, last_error: "No registered device" }).eq("id", item.id);
      continue;
    }
    const messages = tokens.map(({ token }) => ({ to: token, sound: "default", title: item.title, body: item.body, data: item.payload }));
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(messages),
    });
    const result = await response.text();
    if (response.ok) {
      delivered += 1;
      await supabase.from("notification_outbox").update({ delivered_at: new Date().toISOString(), attempts: item.attempts + 1, last_error: null }).eq("id", item.id);
    } else {
      await supabase.from("notification_outbox").update({ attempts: item.attempts + 1, last_error: result.slice(0, 500) }).eq("id", item.id);
    }
  }
  return new Response(JSON.stringify({ delivered, queued: queued?.length ?? 0 }), { headers: cors });
});
