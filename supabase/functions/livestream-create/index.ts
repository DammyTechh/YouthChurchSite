// supabase/functions/livestream-create/index.ts
//
// Creates a Cloudflare Stream Live input, simulcast destinations for each
// connected platform, and the live_streams + stream_destinations rows.
// Returns the WHIP URL the browser should publish to.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CF_ACCOUNT = Deno.env.get("CLOUDFLARE_ACCOUNT_ID")!;
const CF_TOKEN = Deno.env.get("CLOUDFLARE_STREAM_API_TOKEN")!;
const FB_VERSION = Deno.env.get("FACEBOOK_GRAPH_VERSION") ?? "v19.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function cfFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "Authorization": `Bearer ${CF_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  const txt = await res.text();
  let body: any;
  try { body = JSON.parse(txt); } catch { body = { raw: txt }; }
  if (!res.ok) throw new Error(`Cloudflare ${res.status}: ${body?.errors?.[0]?.message || txt}`);
  return body;
}

async function createCfLiveInput(name: string) {
  const body = await cfFetch("/stream/live_inputs", {
    method: "POST",
    body: JSON.stringify({
      meta: { name },
      recording: { mode: "automatic", timeoutSeconds: 10, requireSignedURLs: false },
    }),
  });
  const r = body.result;
  return {
    liveInputId: r.uid as string,
    rtmpUrl: r.rtmps?.url as string,
    rtmpKey: r.rtmps?.streamKey as string,
    whipUrl: `https://customer-${CF_ACCOUNT}.cloudflarestream.com/${r.uid}/webRTC/publish`,
    playbackUrl: `https://customer-${CF_ACCOUNT}.cloudflarestream.com/${r.uid}/manifest/video.m3u8`,
  };
}

async function addCfOutput(liveInputId: string, url: string, streamKey: string) {
  const body = await cfFetch(`/stream/live_inputs/${liveInputId}/outputs`, {
    method: "POST",
    body: JSON.stringify({ url, streamKey, enabled: true }),
  });
  return body.result.uid as string;
}

// ── YouTube broadcast creation ──────────────────────────────────────
async function createYouTubeBroadcast(accessToken: string, title: string, description: string) {
  const startTime = new Date(Date.now() + 5000).toISOString();

  const broadcastRes = await fetch(
    "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        snippet: { title: title.slice(0, 100), description: description.slice(0, 5000), scheduledStartTime: startTime },
        status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
        contentDetails: { enableAutoStart: true, enableAutoStop: true, latencyPreference: "ultraLow" },
      }),
    },
  );
  if (!broadcastRes.ok) throw new Error(`YouTube broadcast failed: ${await broadcastRes.text()}`);
  const broadcast = await broadcastRes.json();

  const streamRes = await fetch(
    "https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn,contentDetails",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        snippet: { title: title.slice(0, 100) },
        cdn: { ingestionType: "rtmp", resolution: "720p", frameRate: "30fps" },
      }),
    },
  );
  if (!streamRes.ok) throw new Error(`YouTube stream failed: ${await streamRes.text()}`);
  const ytStream = await streamRes.json();

  const bindRes = await fetch(
    `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?part=id,contentDetails&id=${broadcast.id}&streamId=${ytStream.id}`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!bindRes.ok) throw new Error(`YouTube bind failed: ${await bindRes.text()}`);

  const ingestion = ytStream.cdn.ingestionInfo;
  return {
    rtmpUrl: ingestion.ingestionAddress + "/",
    rtmpKey: ingestion.streamName,
    watchUrl: `https://www.youtube.com/watch?v=${broadcast.id}`,
    broadcastId: broadcast.id as string,
  };
}

// ── Facebook live video creation ─────────────────────────────────────
async function createFacebookLive(pageId: string, pageAccessToken: string, title: string, description: string) {
  const url = `https://graph.facebook.com/${FB_VERSION}/${pageId}/live_videos`;
  const params = new URLSearchParams({
    status: "LIVE_NOW",
    title: title.slice(0, 100),
    description: description.slice(0, 1000),
    access_token: pageAccessToken,
  });
  const res = await fetch(url, { method: "POST", body: params });
  const body = await res.json();
  if (!res.ok) throw new Error(`Facebook live failed: ${JSON.stringify(body)}`);

  const streamUrl = body.stream_url as string; // rtmps://.../rtmp/<key>
  const lastSlash = streamUrl.lastIndexOf("/");
  const rtmpUrl = streamUrl.slice(0, lastSlash + 1);
  const rtmpKey = streamUrl.slice(lastSlash + 1);
  return {
    rtmpUrl,
    rtmpKey,
    watchUrl: `https://www.facebook.com/${pageId}/videos/${body.id}`,
    broadcastId: body.id as string,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace("Bearer ", "");
  if (!jwt) return json({ error: "unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? SERVICE_ROLE, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
  const adminUserId = userData.user.id;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }
  const { title, description = "", thumbnail_url = null, stream_type = "video", platforms = [] } = body || {};
  if (!title) return json({ error: "title required" }, 400);

  // 1. Create Cloudflare live input
  let cf;
  try { cf = await createCfLiveInput(title); }
  catch (e) { return json({ error: `Cloudflare: ${(e as Error).message}` }, 500); }

  // 2. Insert live_streams row as 'live'
  const { data: streamRow, error: insErr } = await admin
    .from("live_streams")
    .insert({
      admin_user_id: adminUserId,
      title, description, thumbnail_url,
      status: "live",
      stream_type,
      started_at: new Date().toISOString(),
      ingest_provider: "cloudflare",
      ingest_live_input_id: cf.liveInputId,
      ingest_rtmp_url: cf.rtmpUrl,
      ingest_stream_key: cf.rtmpKey,
      ingest_whip_url: cf.whipUrl,
      playback_url: cf.playbackUrl,
      platforms,
    })
    .select()
    .single();
  if (insErr || !streamRow) return json({ error: `DB insert: ${insErr?.message}` }, 500);

  // 3. For each platform, create destination + add Cloudflare output
  const destinations: any[] = [];
  if (Array.isArray(platforms) && platforms.length > 0) {
    const { data: conns } = await admin
      .from("social_connections")
      .select("*")
      .eq("admin_user_id", adminUserId)
      .in("platform", platforms);

    for (const platform of platforms) {
      const conn = (conns || []).find((c: any) => c.platform === platform);
      if (!conn) {
        destinations.push({ stream_id: streamRow.id, platform, status: "failed", error_message: "Not connected" });
        continue;
      }

      try {
        let dest: { rtmpUrl: string; rtmpKey: string; watchUrl?: string; broadcastId?: string };

        if (conn.is_manual && conn.rtmp_url && conn.stream_key) {
          dest = { rtmpUrl: conn.rtmp_url, rtmpKey: conn.stream_key };
        } else if (platform === "youtube" && conn.access_token) {
          dest = await createYouTubeBroadcast(conn.access_token, title, description);
        } else if (platform === "facebook" && conn.access_token && conn.account_id) {
          dest = await createFacebookLive(conn.account_id, conn.access_token, title, description);
        } else {
          destinations.push({ stream_id: streamRow.id, platform, status: "failed", error_message: "No usable credentials" });
          continue;
        }

        const cfOutputId = await addCfOutput(cf.liveInputId, dest.rtmpUrl, dest.rtmpKey);
        destinations.push({
          stream_id: streamRow.id,
          platform,
          status: "live",
          external_broadcast_id: dest.broadcastId,
          watch_url: dest.watchUrl,
          rtmp_url: dest.rtmpUrl,
          stream_key: dest.rtmpKey,
          cf_output_id: cfOutputId,
        });
      } catch (e) {
        destinations.push({ stream_id: streamRow.id, platform, status: "failed", error_message: (e as Error).message });
      }
    }

    if (destinations.length > 0) {
      await admin.from("stream_destinations").insert(destinations);
    }
  }

  return json({
    stream: streamRow,
    destinations,
    ingest: { whip_url: cf.whipUrl, rtmp_url: cf.rtmpUrl, stream_key: cf.rtmpKey, auth_token: null },
  });
});
