# Live Streaming + Radio Recording — Setup Walkthrough

This guide walks you through every API key and configuration step needed to get the new live-streaming and auto-radio-recording features working.

Everything is already integrated into the codebase. You only need to:

1. Create the API accounts and copy the keys
2. Apply database migrations
3. Deploy the edge functions
4. Set the secrets
5. Add a couple of GitHub Actions secrets

---

## 0. Big picture — how the live stream actually flows

> **Heads-up**: browsers can't push RTMP directly to Facebook/YouTube. We use **Cloudflare Stream Live** as the bridge. Your browser sends video to Cloudflare over WHIP (modern WebRTC ingest), and Cloudflare re-broadcasts to YouTube and Facebook over RTMP. Cloudflare also auto-records every stream — that's our redundancy on top of the local browser MediaRecorder backup.

```
Admin browser ──WHIP──▶ Cloudflare Stream Live ──┬──RTMP──▶ YouTube Live
                                                 ├──RTMP──▶ Facebook Live
                                                 ├──RTMP──▶ Instagram (manual key)
                                                 └──HLS───▶ /live page (your viewers)
```

You'll need accounts/keys for:

| Service | Why | Required? |
|---|---|---|
| **Cloudflare** | Receives stream, simulcasts, auto-records | **Yes** |
| **YouTube (Google Cloud)** | OAuth so the app can create broadcasts | Yes |
| **Facebook (Meta for Developers)** | OAuth so the app can create Live videos on your Page | Yes |
| **Instagram** | Manual stream key only — no API for IG Live | Optional |
| **TikTok** | Disabled in UI — Live API is gated | Skipped |
| **Supabase** | Already in use — DB + Storage + Edge Functions | **Yes** |
| **GitHub** | Hosts the daily radio cron (free) | **Yes** |

---

## 1. Cloudflare Stream Live (the engine)

Cloudflare Stream Live costs about $5/mo base + small per-minute usage. Alternatives are Mux, Amazon IVS, or Restream — but you'd need to swap the API calls in `livestream-create/index.ts` yourself.

**Steps:**

1. Sign up at https://dash.cloudflare.com/sign-up.
2. In the left sidebar, click **Stream**.
3. Subscribe to Stream when prompted (the base plan is fine to start).
4. Copy your **Account ID** — visible on the right side of any Cloudflare dashboard page, or under **Workers & Pages → Overview**.
5. Create an API token:
   - Top-right user menu → **My Profile → API Tokens → Create Token**.
   - **Create Custom Token**.
   - Token name: `youthchurch-stream`.
   - **Permissions**: `Account` → `Stream` → `Edit`.
   - **Account Resources**: include your account.
   - **Continue to summary → Create Token**.
   - Copy the token immediately — Cloudflare won't show it again.

**What to save:**
```
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_STREAM_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 2. YouTube (Google Cloud OAuth)

This lets the admin connect their YouTube channel once and from then on the app can auto-create broadcasts.

**Steps:**

1. Go to https://console.cloud.google.com.
2. Top bar → **Select a project → New Project**. Name it `youthchurch-live`. Create.
3. Make sure the new project is selected in the top bar.
4. Sidebar → **APIs & Services → Library**. Search **YouTube Data API v3** and click **Enable**.
5. Sidebar → **APIs & Services → OAuth consent screen**.
   - User Type: **External** → Create.
   - App name: `Rugged Youth Live`. User support email: yours.
   - Add your email as Developer contact.
   - **Scopes**: Add → search and add `https://www.googleapis.com/auth/youtube` and `https://www.googleapis.com/auth/youtube.force-ssl`. Save.
   - **Test users**: add the Google account that owns the church YouTube channel.
   - Save and Continue.
6. Sidebar → **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: `youthchurch-live-web`.
   - **Authorized redirect URIs** — add this exact URL (replace `<project-ref>`):
     ```
     https://<project-ref>.supabase.co/functions/v1/social-oauth
     ```
   - Create. The modal will show **Client ID** and **Client Secret**. Copy both.

> While in "testing" mode, only the Test Users you added can connect. To allow anyone, click **Publish App** on the consent screen — but for a single-channel church use case, staying in testing with the channel owner as a Test User is simpler and avoids Google's verification process for sensitive scopes.

**What to save:**
```
YOUTUBE_CLIENT_ID=xxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 3. Facebook (Pages, Live Video)

Important: only **Facebook Pages** can go live via API. Personal profiles can't. Make sure the church has a Facebook Page (not just a profile) and the admin who'll connect is a Page admin.

**Steps:**

1. Go to https://developers.facebook.com and log in with the Page admin's account.
2. **My Apps → Create App**.
   - Use case: **Other** → Next.
   - App type: **Business** → Next.
   - App name: `Rugged Youth Live`. Contact email: yours. Create.
3. In the new app dashboard, find the **Facebook Login** product → **Set Up**.
4. Sidebar → **Facebook Login → Settings**.
   - **Valid OAuth Redirect URIs**: add
     ```
     https://<project-ref>.supabase.co/functions/v1/social-oauth
     ```
   - Save Changes.
5. Sidebar → **App Settings → Basic**.
   - Copy **App ID** and **App Secret** (Show + your password).
   - Add a Privacy Policy URL — `/privacy` on your site is fine for now.
6. **Permissions and Features** (sidebar). Request **Advanced Access** for these — until granted, only the developer/test users can use them:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_manage_metadata`
   - `publish_video`
   For each: **Request Advanced Access** and fill out the form — mention "live streaming church services to our official Page". Approval typically takes 3–7 days.
7. While in development mode, add the Page admin as a **Tester** under **Roles → Roles**. They can use the integration immediately.

**What to save:**
```
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FACEBOOK_GRAPH_VERSION=v19.0
```

---

## 4. Instagram (manual key only)

Reality: **there is no public Instagram Live API for third-party broadcasters.** Meta deprecated this years ago. Options to push to IG Live:

- The Instagram mobile app
- **Instagram Live Producer** in Meta Business Suite (Pages → Create Live Video) — gives you an RTMP URL + stream key you can paste
- A paid service like Restream.io

The app supports the manual-key path. In Admin → Live Studio → Connections, click Instagram → **Paste Key** → enter the URL and key from Live Producer. Cloudflare will forward the stream there.

---

## 5. TikTok (intentionally disabled)

TikTok's Live API requires a closed-beta partnership that isn't granted to small developers. The UI shows "coming soon" and the toggle is locked. If you ever get partner access, the destination scaffold is ready.

---

## 6. Supabase setup

You're already using Supabase. Apply the new pieces:

### 6a. Install the Supabase CLI (one time)
```bash
npm install -g supabase
supabase login
```

### 6b. Link the project (from the repo root)
```bash
supabase link --project-ref <project-ref>
```
Find the project ref in your Supabase dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`.

### 6c. Push the migrations
```bash
supabase db push
```
This applies the new migration files (`20260429000001_live_streams.sql`, `..._radio_recordings.sql`, `..._live_ads.sql`) — creating tables, RLS policies, the `radio-recordings` storage bucket, and the Realtime publication.

### 6d. Deploy the Edge Functions
```bash
supabase functions deploy livestream-create
supabase functions deploy livestream-end
supabase functions deploy social-oauth
supabase functions deploy radio-recorder
```

### 6e. Set the function secrets
```bash
supabase secrets set CLOUDFLARE_ACCOUNT_ID=...
supabase secrets set CLOUDFLARE_STREAM_API_TOKEN=...

supabase secrets set YOUTUBE_CLIENT_ID=...
supabase secrets set YOUTUBE_CLIENT_SECRET=...

supabase secrets set FACEBOOK_APP_ID=...
supabase secrets set FACEBOOK_APP_SECRET=...
supabase secrets set FACEBOOK_GRAPH_VERSION=v19.0

# OAuth redirect base + where to send users after success:
supabase secrets set OAUTH_REDIRECT_BASE=https://<project-ref>.supabase.co/functions/v1/social-oauth
supabase secrets set APP_URL=https://ruggedyouth.com

# Shared secret with the GitHub Actions radio-recorder workflow (any random string):
supabase secrets set RADIO_RECORDER_WEBHOOK_SECRET="$(openssl rand -hex 32)"
```

Verify with `supabase secrets list`.

---

## 7. GitHub Actions (the radio recorder)

The recorder runs on GitHub's free cron. ffmpeg captures clean MP3 from your stream URL daily.

**Steps:**

1. The workflow file `.github/workflows/radio-recorder.yml` is already in the repo.
2. Push your repo to GitHub if not already there.
3. Go to your repo on GitHub → **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase dashboard → Settings → API |
| `RADIO_RECORDER_WEBHOOK_SECRET` | Same random string you set in Supabase secrets |
| `RADIO_STREAM_URL` | `https://cast5.my-control-panel.com/proxy/princefm/stream` |

4. Test it: **Actions** tab → **Radio Recorder (Morning Devotion)** → **Run workflow** → set duration to `60` for a quick 1-minute test. Watch the logs.

**What it does each morning:**

- Wakes at 04:13 UTC (= 05:13 Africa/Lagos)
- Sleeps until exactly 05:14
- Records 17 minutes (until ~05:31) with ffmpeg, applying:
  - **EBU R128 loudness normalization** (`loudnorm=I=-16:TP=-1.5:LRA=11`) — keeps volumes consistent across days
  - **Highpass at 80 Hz** — cuts rumble and breath thumps
  - **Lowpass at 15 kHz** — softens any source hiss
  - **128 kbps stereo MP3 at 44.1 kHz** — clean, small (~15 MB), universally playable
- Uploads to `radio-recordings` bucket as `radio/YYYY-MM-DD.mp3`
- Calls the `radio-recorder` Edge Function to insert a `radio_recordings` row
- Recording appears on the public `/radio` page automatically

> GitHub Actions cron can be delayed 5–15 min during high load. The workflow re-syncs the wait-clock against Africa/Lagos before recording, so if it starts late, ffmpeg simply records whatever's left of the broadcast.

---

## 8. .env file for local dev

Your existing Supabase credentials (already in your `.env`):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

No new client-side env variables are needed — the live studio talks to the edge functions which read the secrets server-side.

---

## 9. First test run — checklist

1. **Migrations applied** — Supabase dashboard → Database → Tables shows `live_streams`, `radio_recordings`, `live_ads`, `social_connections`, `stream_destinations`, `live_chat_messages`, `live_reactions`. ✓
2. **Storage bucket exists** — Storage → `radio-recordings` is there and public. ✓
3. **Edge functions deployed** — `supabase functions list` shows all 4. ✓
4. **Connect a social account** — log in as admin → Live Studio → Connections → click Connect on YouTube. Redirects to Google, you accept, and come back to `/admin?connected=youtube`. ✓
5. **Go live** — Studio tab → enter title → Start preview → allow camera/mic → Go Live. Within 5–10 sec, YouTube/Facebook destinations show "live" with watch URLs. ✓
6. **Public viewer** — open `/live` in another browser/incognito tab. The stream plays, chat works, reactions float up. ✓
7. **Ad popup** — open `/blog` in another tab. The "We're live" popup appears within a second. ✓
8. **Radio button time-lock** — visit `/radio` outside 05:14–05:31 Lagos. Button is locked with countdown. Inside the window, it plays live. ✓
9. **Radio recorder dry-run** — GitHub → Actions → Run workflow → duration `30`. After completion, refresh `/radio` — today's recording appears in the archive. ✓

---

## 10. Common gotchas

| Symptom | Cause / fix |
|---|---|
| "Cloudflare API error" when going live | Check `CLOUDFLARE_ACCOUNT_ID` and that the token has `Stream:Edit` permission. |
| YouTube destination "failed" | Token expired (disconnect+reconnect) — or your channel isn't enabled for live. New channels need 24h and a phone-verified account before live unlocks. Check at `youtube.com/livestreaming`. |
| Facebook destination "failed" | The connecting user isn't an admin of any Page, or the app hasn't gotten advanced access for `publish_video` yet. While in dev mode, only Page admins added as Testers can broadcast. |
| Instagram "Connect" does nothing useful | Expected — use **Paste Key** with a key from Instagram Live Producer. |
| `/live` page is blank | Browser doesn't natively support HLS — `hls.js` needs to load. Hard-refresh and check the network tab. |
| Radio recorder uploads 0 bytes | Stream URL was unreachable from GitHub runners. Test the same `ffmpeg -i ...` command locally first. |
| Radio button won't unlock at 05:14 | Device clock is wrong, or `Intl.DateTimeFormat` doesn't have Africa/Lagos data. Hard-refresh `/radio`. |
| "Connect to live ingest failed" | Browser blocked camera/mic, or it's Firefox (WHIP support is partial). Use recent Chrome/Edge/Safari. |

---

## 11. Cost & ongoing notes

- **Cloudflare Stream Live**: ~$5/mo base + $1 per 1,000 minutes delivered. A weekly 1-hour service to ~200 concurrent viewers ≈ $10–15/mo total.
- **GitHub Actions free tier**: public repos = unlimited; private repos = 2,000 free minutes/mo. The recorder uses ~17 min/day = ~510 min/mo. Well under the limit.
- **Supabase Storage**: free tier includes 1 GB. Each daily MP3 is ~15 MB → ~450 MB/mo → ~5.5 GB/yr. Pro tier ($25/mo, 100 GB) covers many years.

---

## 12. Files added/changed

**New:**
- `supabase/migrations/20260429000001_live_streams.sql`
- `supabase/migrations/20260429000002_radio_recordings.sql`
- `supabase/migrations/20260429000003_live_ads.sql`
- `supabase/functions/livestream-create/index.ts`
- `supabase/functions/livestream-end/index.ts`
- `supabase/functions/social-oauth/index.ts`
- `supabase/functions/radio-recorder/index.ts`
- `src/components/AdminLiveStudio.tsx`
- `src/components/LiveAdPopup.tsx`
- `src/pages/LiveViewer.tsx`
- `src/hooks/useRadioWindow.ts`
- `src/hooks/useActiveLiveStream.ts`
- `src/lib/broadcast-engine.ts`
- `.github/workflows/radio-recorder.yml`
- `LIVESTREAM_SETUP.md` (this file)

**Modified:**
- `src/App.tsx` — added `/live` route + `<LiveAdPopup />` mount
- `src/components/AdminPanel.tsx` — added Live Studio tab to sidebar + render switch
- `src/components/Header.tsx` — added `/live` to nav items
- `src/lib/supabase.ts` — added types for live streaming + radio + helpers (fingerprint, display name)
- `src/pages/RadioLive.tsx` — replaced with time-locked + archive version
- `package.json` — added `hls.js` dependency

If something breaks, check `supabase functions logs <function-name> --tail` first — most issues trace to a missing secret or pending Facebook permission approval.
