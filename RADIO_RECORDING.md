# Radio Recording — How the GitHub Worker Captures the Live Broadcast

This document explains, step by step, how the daily **Morning Devotion** radio
program is automatically recorded, stored, and made available on the site's
Radio page for later listening.

The whole thing runs on a schedule with **no server of your own** — GitHub
Actions provides the machine, records the live audio stream with `ffmpeg`,
uploads the MP3 to Supabase Storage, and registers a database row that the
website reads.

---

## The moving parts

| Piece | Location | Job |
|---|---|---|
| GitHub Actions workflow | `.github/workflows/radio-recorder.yml` | Runs daily, records + uploads the audio |
| Supabase Edge Function | `supabase/functions/radio-recorder/` | Registers the recording row in the database |
| Database table | `radio_recordings` (migration `20260429000002`) | Stores one row per broadcast |
| Storage bucket | `radio-recordings` (public) | Holds the actual MP3 files |
| Website page | `src/pages/RadioLive.tsx` | Lists past broadcasts and plays them |

---

## The flow at a glance

```
GitHub cron (daily)
      │
      ▼
[ GitHub Actions runner ]
  1. check secrets
  2. install ffmpeg
  3. wait until 05:14 Lagos
  4. record the live stream  ──►  recording.mp3
  5. upload MP3              ──►  Supabase Storage  (radio-recordings/radio/DATE.mp3)
  6. register the row        ──►  radio-recorder Edge Function ──► radio_recordings table
      │
      ▼
[ Website /radio page ]  reads radio_recordings  ──►  "Past Broadcasts" list
```

---

## Prerequisites (one-time setup)

Before the worker can run, four **repository secrets** must exist in GitHub.
Set them under **Repo → Settings → Secrets and variables → Actions → New
repository secret**:

| Secret | What it is |
|---|---|
| `SUPABASE_URL` | Your project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | The service-role key (Supabase → Settings → API). Keep it private. |
| `RADIO_RECORDER_WEBHOOK_SECRET` | Any long random string. **Must match** the same env var set on the `radio-recorder` Edge Function. |
| `RADIO_STREAM_URL` | The live audio stream URL — the same one the site plays (the `LIVE_STREAM_URL` in `RadioLive.tsx`). |

You also need, on the Supabase side (done by the migrations + function deploy):

- The `radio_recordings` table and the public `radio-recordings` storage bucket
  (created by migration `20260429000002_radio_recordings.sql`).
- The `radio-recorder` Edge Function deployed, with its `RADIO_RECORDER_WEBHOOK_SECRET`
  environment variable set to the **same value** as the GitHub secret above.

> Important: GitHub only runs scheduled workflows from the repository's
> **default branch**, and it **auto-pauses** a schedule after ~60 days of no
> repo activity. If recordings stop appearing, check both of these first.

---

## Step by step — what happens each morning

The trigger is defined at the top of the workflow:

```yaml
on:
  schedule:
    - cron: "0 4 * * *"   # 04:00 UTC = 05:00 Africa/Lagos
  workflow_dispatch:       # also lets you run it manually
```

`04:00 UTC` is **05:00 Lagos** (Lagos is UTC+1 all year, no daylight saving).
It fires ~14 minutes before the 05:14 broadcast starts, on purpose — GitHub's
cron is often a few minutes late, so the early start plus the "wait" step below
guarantee the full program is captured.

### 1. Validate secrets
The job first confirms all four secrets are present. If any is missing it stops
immediately with a clear error, so you never get a silent half-failure.

### 2. Install tools
It installs `ffmpeg` (records/encodes audio), `curl` (uploads), and `jq`
(builds the JSON payload) onto the fresh Ubuntu runner.

### 3. Determine mode + read the Lagos clock
It sets the timezone to `Africa/Lagos` and decides the run **mode**:
- A **scheduled** run is always `production`.
- A **manual** run defaults to `test` (a short clip, so you can verify the
  pipeline without waiting for 5 AM).

It also records today's date (`broadcast_date`), which becomes the recording's
identity.

### 4. Wait for (or catch) the broadcast window — production only
The broadcast window is **05:14 → 05:31 Lagos**. The job compares "now" to that
window:
- **Before 05:14** → it `sleep`s until exactly 05:14, then proceeds.
- **Inside the window** (cron ran late) → it logs a warning and records
  whatever time is left.
- **After 05:31** → it errors out: the window was missed (a big GitHub delay),
  so it refuses to record silence rather than store a bad file.

This is why the schedule is set early: even a 10-minute GitHub delay still lands
inside the window.

### 5. Guard against overwriting a real recording — test mode only
If you trigger a **test** run on a day that already has a real (≥ 10 min)
recording, it aborts so a 60-second test clip can't clobber the real one.

### 6. Compute the recording length
- **Production:** length = seconds remaining until 05:31 (capped at 20 min), so
  it records to the end of the broadcast.
- **Test:** the `duration_seconds` you entered (default 60).

### 7. Check the stream is reachable
A quick probe of `RADIO_STREAM_URL`. If the stream is unreachable or returns a
4xx error, it stops here with a clear message (better than recording dead air).

### 8. Record with `ffmpeg`
This is the actual capture. `ffmpeg` connects to the live stream and records for
the computed duration, while cleaning up the audio:

```
-reconnect 1 ...                      # auto-reconnect if the stream drops
-vn                                   # audio only, drop any video
-ac 2 -ar 44100                       # stereo, 44.1 kHz
-af "loudnorm=...,highpass=...,lowpass=..."   # normalize volume, trim rumble/hiss
-codec:a libmp3lame -b:a 128k         # encode to 128 kbps MP3
recording.mp3
```

If the resulting file is empty, the job fails. Otherwise it reads back the exact
byte size and duration with `ffprobe`.

### 9. Upload the MP3 to Supabase Storage
It `POST`s `recording.mp3` to the `radio-recordings` bucket at the path
`radio/<broadcast_date>.mp3`, authenticated with the service-role key and using
`x-upsert: true` (so re-runs replace the same day cleanly). A failed upload
(HTTP ≥ 300) fails the job.

### 10. Register the database row
It calls the **`radio-recorder` Edge Function** (not the table directly),
sending a JSON payload and the `x-recorder-secret` header:

```json
{
  "broadcast_date": "2026-07-15",
  "broadcast_started_at": "…",
  "broadcast_ended_at": "…",
  "storage_path": "radio/2026-07-15.mp3",
  "duration_seconds": 1017,
  "file_size_bytes": 16321044,
  "program_name": "Morning Devotion",
  "title": "Morning Devotion — 2026-07-15"
}
```

The Edge Function verifies the secret, turns the `storage_path` into a public
`audio_url`, and **upserts** a row into `radio_recordings` (keyed on
`program_name + broadcast_date`, so one row per day). It sets
`is_published = true`.

### 11. Debug artifact
Win or lose, the job attaches `recording.mp3` as a downloadable workflow
artifact (kept 7 days), so you can grab and inspect the audio if something looks
off.

---

## How the website shows it

The Radio page (`src/pages/RadioLive.tsx`) simply queries:

```sql
select * from radio_recordings
where is_published = true
order by broadcast_date desc
limit 30;
```

Each row becomes an entry in the **"Past Broadcasts"** list. Tapping one plays
`audio_url` straight from the public storage bucket and bumps its `play_count`.
So the moment step 10 finishes, the new recording appears on the site — no
deploy needed.

---

## Running it manually (recommended first test)

1. Go to the repo's **Actions** tab.
2. Choose **Radio Recorder (Morning Devotion)** → **Run workflow**.
3. Leave mode = **test**, duration = **60**, and run it.
4. Watch the steps go green. When it finishes, open the site's **/radio** page
   and refresh — a short recording dated today should be in *Past Broadcasts*.

Once the test works, the daily `production` schedule will capture the full
program automatically each morning.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Workflow never runs on its own | Schedule paused (60-day inactivity) or the workflow isn't on the default branch. Open Actions and re-enable / merge to default. |
| "Missing secrets" error | One of the four repo secrets isn't set. |
| Register step returns 401 | `RADIO_RECORDER_WEBHOOK_SECRET` in GitHub ≠ the value set on the Edge Function. |
| Upload step fails | `radio-recordings` bucket missing (run migrations) or wrong service-role key. |
| "Cron fired AFTER the window" | GitHub cron was very delayed that day. Rare; the next day recovers on its own. |
| Recording exists but not on the site | Row's `is_published` is false, or the site is pointed at a different Supabase project. |
| Recorded dead air / silence | `RADIO_STREAM_URL` points at the wrong stream, or the station wasn't broadcasting. |

---

## Adjusting the schedule

The broadcast time is encoded in two places in the workflow — the `cron` line
and the `05:14`/`05:31` checks. If the program time changes:

- Update the `cron` (remember it's **UTC**; Lagos = UTC + 1, so subtract 1 hour).
- Update the `05:14:00` (open) and `05:31:00` (close) times in the
  "Verify we can hit the window" and "Compute recording duration" steps.

Keep the cron scheduled a little **before** the real start so GitHub's delay
plus the built-in wait still catch the whole broadcast.
