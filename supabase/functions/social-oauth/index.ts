// supabase/functions/social-oauth/index.ts
//
// Handles OAuth flows for YouTube and Facebook.
//   GET  /functions/v1/social-oauth?platform=youtube&action=start&jwt=...
//   GET  /functions/v1/social-oauth?platform=youtube&action=callback&code=...&state=...
// On callback, upserts a social_connections row keyed by (admin_user_id, platform).
//
// Instagram is scaffolded but real Live broadcasting requires a manual
// stream key from Instagram Live Producer.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const YT_CLIENT_ID = Deno.env.get("YOUTUBE_CLIENT_ID") ?? "";
const YT_CLIENT_SECRET = Deno.env.get("YOUTUBE_CLIENT_SECRET") ?? "";
const FB_APP_ID = Deno.env.get("FACEBOOK_APP_ID") ?? "";
const FB_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET") ?? "";
const FB_VERSION = Deno.env.get("FACEBOOK_GRAPH_VERSION") ?? "v19.0";

const REDIRECT_BASE = Deno.env.get("OAUTH_REDIRECT_BASE")!; // e.g. https://<ref>.supabase.co/functions/v1/social-oauth
const APP_URL = Deno.env.get("APP_URL") ?? "https://ruggedyouth.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function html(body: string, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

function buildRedirectUri(platform: string) {
  const u = new URL(REDIRECT_BASE);
  u.searchParams.set("platform", platform);
  u.searchParams.set("action", "callback");
  return u.toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const platform = url.searchParams.get("platform") || "";
  const action = url.searchParams.get("action") || "";

  // ── action=start: redirect user to provider OAuth screen ─────────────
  if (action === "start") {
    const jwt = url.searchParams.get("jwt") || "";
    if (!jwt) return html("Missing user token", 400);
    const state = jwt; // we use the JWT as state to recover user identity in callback

    if (platform === "youtube") {
      const params = new URLSearchParams({
        client_id: YT_CLIENT_ID,
        redirect_uri: buildRedirectUri("youtube"),
        response_type: "code",
        scope: "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl",
        access_type: "offline",
        prompt: "consent",
        state,
      });
      return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    }

    if (platform === "facebook") {
      const params = new URLSearchParams({
        client_id: FB_APP_ID,
        redirect_uri: buildRedirectUri("facebook"),
        scope: "pages_show_list,pages_manage_posts,pages_read_engagement,publish_video,pages_manage_metadata",
        response_type: "code",
        state,
      });
      return redirect(`https://www.facebook.com/${FB_VERSION}/dialog/oauth?${params}`);
    }

    if (platform === "instagram") {
      return html(`
        <html><body style="font-family:system-ui;padding:40px;max-width:560px;margin:auto">
          <h2>Instagram Live</h2>
          <p>Instagram does not provide a third-party Live API for broadcasting.</p>
          <p>Use the <strong>Paste Key</strong> option in the Connections tab with a stream key from
          <a href="https://www.facebook.com/business/m/instagram-live-producer">Instagram Live Producer</a>.</p>
          <p><a href="${APP_URL}/admin">← Back to admin</a></p>
        </body></html>
      `);
    }

    return html("Unsupported platform", 400);
  }

  // ── action=callback: exchange code for tokens, upsert connection ─────
  if (action === "callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return html("Missing code or state", 400);

    // recover user from JWT
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? SERVICE_ROLE, {
      global: { headers: { Authorization: `Bearer ${state}` } },
      auth: { persistSession: false },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return html("Could not identify user — please sign in again", 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    try {
      if (platform === "youtube") {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code, client_id: YT_CLIENT_ID, client_secret: YT_CLIENT_SECRET,
            redirect_uri: buildRedirectUri("youtube"), grant_type: "authorization_code",
          }),
        });
        const t = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(`YouTube token: ${JSON.stringify(t)}`);

        const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
          { headers: { Authorization: `Bearer ${t.access_token}` } });
        const ch = await channelRes.json();
        const channel = ch.items?.[0];

        await admin.from("social_connections").upsert({
          admin_user_id: u.user.id,
          platform: "youtube",
          account_name: channel?.snippet?.title || "YouTube channel",
          account_id: channel?.id,
          access_token: t.access_token,
          refresh_token: t.refresh_token,
          token_expires_at: new Date(Date.now() + (t.expires_in || 3600) * 1000).toISOString(),
          is_manual: false,
        }, { onConflict: "admin_user_id,platform" });

        return redirect(`${APP_URL}/admin?connected=youtube`);
      }

      if (platform === "facebook") {
        const tokenUrl = `https://graph.facebook.com/${FB_VERSION}/oauth/access_token?` + new URLSearchParams({
          client_id: FB_APP_ID, client_secret: FB_APP_SECRET,
          redirect_uri: buildRedirectUri("facebook"), code,
        });
        const tokenRes = await fetch(tokenUrl);
        const t = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(`Facebook token: ${JSON.stringify(t)}`);

        // exchange short-lived to long-lived (60 days)
        const longUrl = `https://graph.facebook.com/${FB_VERSION}/oauth/access_token?` + new URLSearchParams({
          grant_type: "fb_exchange_token", client_id: FB_APP_ID, client_secret: FB_APP_SECRET,
          fb_exchange_token: t.access_token,
        });
        const longRes = await fetch(longUrl);
        const longTok = await longRes.json();
        const userToken = longTok.access_token || t.access_token;

        // fetch pages — we'll use the first one as the broadcast target
        const pagesRes = await fetch(`https://graph.facebook.com/${FB_VERSION}/me/accounts?access_token=${userToken}`);
        const pages = await pagesRes.json();
        const page = pages.data?.[0];
        if (!page) throw new Error("No Facebook Pages found on this account.");

        await admin.from("social_connections").upsert({
          admin_user_id: u.user.id,
          platform: "facebook",
          account_name: page.name,
          account_id: page.id,
          access_token: page.access_token,
          token_expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
          is_manual: false,
        }, { onConflict: "admin_user_id,platform" });

        return redirect(`${APP_URL}/admin?connected=facebook`);
      }

      return html("Unsupported platform in callback", 400);
    } catch (e) {
      return html(`<pre style="font-family:monospace;padding:20px">${(e as Error).message}</pre>`, 500);
    }
  }

  return html("Unknown action", 400);
});
