# Radio Recorder on Render (GitHub Actions alternative)

If GitHub Actions is locked and you can't get it unblocked, this folder
runs the exact same recorder on Render.com — completely free, no GitHub
billing weirdness.

## How it works

- Render pulls this folder, builds the Docker image, and runs it on a
  cron schedule.
- The script sleeps until 05:14 Africa/Lagos, records 17 minutes with
  ffmpeg using the same clean-audio settings (EBU R128 normalization,
  highpass 80 Hz, lowpass 15 kHz, 128 kbps stereo MP3), uploads to
  Supabase Storage, and registers the recording row.
- Same Supabase setup as the GitHub Actions version — just a different
  trigger.

## Setup (10 minutes)

### 1. Push your repo to GitHub (or any git host)

Render needs to pull the code from somewhere. If your repo is already
on GitHub, that's fine — Render just reads the code, it doesn't run
GitHub Actions.

### 2. Sign up for Render

Go to https://render.com → Sign up with GitHub.
Free tier — no credit card needed.

### 3. Create the cron job

1. From the Render dashboard, click **New +** → **Blueprint**
2. Connect your GitHub repo (DammyTechh/YouthChurchSite)
3. Render will detect `cron-recorder/render.yaml` and propose creating
   a cron service called `morning-devotion-recorder`. Click **Apply**.
4. Wait for the first build to complete (~3 minutes). It builds the
   Docker image; it doesn't run yet.

### 4. Add the 4 environment variables

After the service is created, click on it, then **Environment** in the
sidebar. Add these (same values as you put into GitHub secrets):

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://twhtlvijldpriwkenlut.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (your service_role key from Supabase → Settings → API) |
| `RADIO_RECORDER_WEBHOOK_SECRET` | (same string you put in `supabase secrets set ...`) |
| `RADIO_STREAM_URL` | `https://cast5.my-control-panel.com/proxy/princefm/stream` |

Click **Save Changes**.

### 5. Test it manually

In the Render dashboard, click your cron service → **Trigger Run**
(top right). Watch the **Logs** tab. You should see:

```
Sleeping XXXs (~XX min) until 05:14 Africa/Lagos...
```

That means it's working — but it'll wait until tomorrow morning.

To **test immediately without waiting**, add one more env var:
- Key: `RECORD_NOW`
- Value: `1`

Then click **Trigger Run** again. It'll skip the wait and record
straight away. After confirming it works, **delete `RECORD_NOW`** so
the daily cron uses the proper 05:14 schedule.

### 6. Done

Tomorrow at 05:14 Africa/Lagos, Render will auto-trigger the job and
the morning broadcast will appear on `/radio` like nothing happened.

## Costs

Render free tier: 750 free instance-hours/month. The recorder uses
about 17 min/day = ~510 minutes/month = 8.5 hours. Way under the limit.

## If GitHub Actions later gets unlocked

You can use either one — they don't conflict because both upsert on the
same `(program_name, broadcast_date)` key. If both run on the same day,
the second just overwrites the first. To use only one, just disable
the other (delete the Render service or comment out the GitHub workflow).

## Other free alternatives

If Render doesn't work for you:
- **Fly.io** — also has free cron via `fly machines`, similar setup
- **Railway** — $5 trial credit/month, easier UI
- **A small VPS** — Hetzner CX11 is €4/mo, has Linux cron built-in
