// supabase/functions/radio-recorder/index.ts
//
// Companion endpoint for the daily radio recorder GitHub Actions workflow.
//   POST /functions/v1/radio-recorder       (with header x-recorder-secret) → register a new recording
//   GET  /functions/v1/radio-recorder?action=list                            → public list
//   POST /functions/v1/radio-recorder?action=play  { id }                    → increment play count

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("RADIO_RECORDER_WEBHOOK_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-recorder-secret",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "";

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  if (req.method === "GET" && action === "list") {
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30", 10) || 30, 100);
    const { data, error } = await admin
      .from("radio_recordings")
      .select("id, title, broadcast_date, broadcast_started_at, broadcast_ended_at, audio_url, duration_seconds, play_count")
      .eq("is_published", true)
      .order("broadcast_date", { ascending: false })
      .limit(limit);
    if (error) return json({ error: error.message }, 500);
    return json({ recordings: data ?? [] });
  }

  if (req.method === "POST" && action === "play") {
    const { id } = await req.json().catch(() => ({}));
    if (!id) return json({ error: "id required" }, 400);
    const { error } = await admin.rpc("increment_radio_play_count", { rec_id: id });
    if (error) {
      const { data: cur } = await admin.from("radio_recordings").select("play_count").eq("id", id).single();
      const next = (cur?.play_count ?? 0) + 1;
      await admin.from("radio_recordings").update({ play_count: next }).eq("id", id);
    }
    return json({ ok: true });
  }

  if (req.method === "POST") {
    const provided = req.headers.get("x-recorder-secret") ?? "";
    if (!WEBHOOK_SECRET || provided !== WEBHOOK_SECRET) return json({ error: "unauthorized" }, 401);

    let body: any;
    try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

    const {
      broadcast_date, broadcast_started_at, broadcast_ended_at,
      storage_path, duration_seconds, file_size_bytes, title,
      program_name = "Morning Devotion",
    } = body || {};

    if (!broadcast_date || !storage_path) {
      return json({ error: "broadcast_date and storage_path are required" }, 400);
    }

    const { data: pub } = admin.storage.from("radio-recordings").getPublicUrl(storage_path);
    const audio_url = pub.publicUrl;
    const finalTitle = title ?? `${program_name} — ${broadcast_date}`;

    const { data, error } = await admin
      .from("radio_recordings")
      .upsert({
        program_name, title: finalTitle, broadcast_date,
        broadcast_started_at: broadcast_started_at ?? null,
        broadcast_ended_at: broadcast_ended_at ?? null,
        audio_url, storage_path,
        duration_seconds: duration_seconds ?? null,
        file_size_bytes: file_size_bytes ?? null,
        is_published: true,
      }, { onConflict: "program_name,broadcast_date" })
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ recording: data });
  }

  return json({ error: "method not allowed" }, 405);
});
