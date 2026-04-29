// supabase/functions/livestream-end/index.ts
//
// Closes a live stream:
//  - Marks live_streams.status = 'ended'
//  - Tries to fetch the Cloudflare auto-recording URL
//  - Falls back to uploading a browser MediaRecorder backup blob (if provided)
//  - Marks all stream_destinations as 'ended'

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CF_ACCOUNT = Deno.env.get("CLOUDFLARE_ACCOUNT_ID")!;
const CF_TOKEN = Deno.env.get("CLOUDFLARE_STREAM_API_TOKEN")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function fetchCfRecording(liveInputId: string): Promise<string | null> {
  // Cloudflare exposes recordings under /stream/live_inputs/{id}/videos
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/stream/live_inputs/${liveInputId}/videos`, {
      headers: { Authorization: `Bearer ${CF_TOKEN}` },
    });
    if (!r.ok) return null;
    const body = await r.json();
    const first = body.result?.[0];
    if (!first) return null;
    return `https://customer-${CF_ACCOUNT}.cloudflarestream.com/${first.uid}/manifest/video.m3u8`;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const ct = req.headers.get("Content-Type") || "";
  let streamId = "";
  let recordingFile: File | null = null;

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    streamId = String(fd.get("stream_id") || "");
    const f = fd.get("recording");
    if (f instanceof File) recordingFile = f;
  } else {
    try {
      const body = await req.json();
      streamId = body.stream_id;
    } catch { /* noop */ }
  }
  if (!streamId) return json({ error: "stream_id required" }, 400);

  const { data: stream } = await admin.from("live_streams").select("*").eq("id", streamId).maybeSingle();
  if (!stream) return json({ error: "stream not found" }, 404);

  // try Cloudflare recording first
  let recordingUrl: string | null = null;
  if (stream.ingest_live_input_id) {
    recordingUrl = await fetchCfRecording(stream.ingest_live_input_id);
  }

  // fallback to browser-uploaded webm backup
  if (!recordingUrl && recordingFile) {
    const path = `streams/${streamId}.webm`;
    const buf = new Uint8Array(await recordingFile.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from("radio-recordings")
      .upload(path, buf, { contentType: "video/webm", upsert: true });
    if (!upErr) {
      const { data: pub } = admin.storage.from("radio-recordings").getPublicUrl(path);
      recordingUrl = pub.publicUrl;
    }
  }

  const endedAt = new Date().toISOString();
  const startedAt = stream.started_at ? new Date(stream.started_at).getTime() : Date.now();
  const durationSec = Math.round((Date.now() - startedAt) / 1000);

  await admin.from("live_streams")
    .update({ status: "ended", ended_at: endedAt, recording_url: recordingUrl, recording_duration_seconds: durationSec })
    .eq("id", streamId);

  await admin.from("stream_destinations")
    .update({ status: "ended" })
    .eq("stream_id", streamId)
    .neq("status", "failed");

  return json({ ok: true, recording_url: recordingUrl });
});
