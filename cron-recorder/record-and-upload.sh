#!/usr/bin/env bash
# record-and-upload.sh
# Captures Morning Devotion live broadcast from 05:14 Africa/Lagos,
# encodes a clean MP3, uploads to Supabase Storage, and registers
# the row via the radio-recorder edge function.
#
# Designed to be triggered by a cron service (Render, cron-job.org, etc.)
# at the right time. The script itself sleeps until 05:14 Africa/Lagos
# unless RECORD_NOW=1 is set.

set -e

: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required}"
: "${RADIO_RECORDER_WEBHOOK_SECRET:?RADIO_RECORDER_WEBHOOK_SECRET is required}"
: "${RADIO_STREAM_URL:?RADIO_STREAM_URL is required}"

DURATION="${DURATION:-1020}"   # 17 minutes by default
PROGRAM_NAME="${PROGRAM_NAME:-Morning Devotion}"

export TZ="Africa/Lagos"

# ── Wait until 05:14 Africa/Lagos (skip if RECORD_NOW=1) ─────────────
if [ "${RECORD_NOW:-0}" != "1" ]; then
  TARGET_S=$(date -d 'today 05:14:00' +%s)
  NOW_S=$(date +%s)
  DIFF=$(( TARGET_S - NOW_S ))
  if [ "$DIFF" -gt 0 ]; then
    MIN=$(( DIFF / 60 ))
    echo "Sleeping ${DIFF}s (~${MIN} min) until 05:14 Africa/Lagos..."
    sleep "$DIFF"
  else
    echo "Past 05:14 already — recording now ($DIFF s late)."
  fi
fi

BCAST_DATE="$(date +%F)"
STARTED_AT="$(date -u +%FT%TZ)"
OUT="/tmp/recording-${BCAST_DATE}.mp3"

echo "═══════════════════════════════════════════════════════════"
echo "Morning Devotion recorder"
echo "  Date:       $BCAST_DATE"
echo "  Started at: $STARTED_AT"
echo "  Duration:   ${DURATION}s"
echo "  Output:     $OUT"
echo "═══════════════════════════════════════════════════════════"

# ── Record with ffmpeg, clean-audio chain ────────────────────────────
ffmpeg -hide_banner -loglevel info \
  -reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5 \
  -i "$RADIO_STREAM_URL" \
  -t "$DURATION" \
  -vn \
  -ac 2 -ar 44100 \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=80,lowpass=f=15000" \
  -codec:a libmp3lame -b:a 128k \
  "$OUT" 2>&1 | tail -30

if [ ! -s "$OUT" ]; then
  echo "::error::ffmpeg produced an empty file."
  exit 1
fi

SIZE="$(stat -c%s "$OUT" 2>/dev/null || stat -f%z "$OUT")"
DUR="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT" | cut -d. -f1)"
echo "✅ Captured ${SIZE} bytes / ${DUR} seconds"

# ── Upload to Supabase Storage ────────────────────────────────────────
STORAGE_PATH="radio/${BCAST_DATE}.mp3"
UPLOAD_URL="${SUPABASE_URL}/storage/v1/object/radio-recordings/${STORAGE_PATH}"
echo "Uploading to ${UPLOAD_URL}"

HTTP=$(curl -sS -o /tmp/upload-resp.json -w "%{http_code}" -X POST "$UPLOAD_URL" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: audio/mpeg" \
  -H "x-upsert: true" \
  --data-binary "@${OUT}")

echo "HTTP ${HTTP}"
cat /tmp/upload-resp.json
echo ""
if [ "$HTTP" -ge 300 ]; then
  echo "::error::Upload failed (HTTP $HTTP)"
  exit 1
fi
echo "✅ Upload succeeded."

# ── Register the recording row ───────────────────────────────────────
ENDED_AT="$(date -u +%FT%TZ)"
PAYLOAD=$(cat <<JSON
{
  "broadcast_date": "${BCAST_DATE}",
  "broadcast_started_at": "${STARTED_AT}",
  "broadcast_ended_at": "${ENDED_AT}",
  "storage_path": "${STORAGE_PATH}",
  "duration_seconds": ${DUR},
  "file_size_bytes": ${SIZE},
  "program_name": "${PROGRAM_NAME}",
  "title": "${PROGRAM_NAME} — ${BCAST_DATE}"
}
JSON
)

echo "Registering row..."
HTTP=$(curl -sS -o /tmp/register-resp.json -w "%{http_code}" -X POST \
  "${SUPABASE_URL}/functions/v1/radio-recorder" \
  -H "Content-Type: application/json" \
  -H "x-recorder-secret: ${RADIO_RECORDER_WEBHOOK_SECRET}" \
  -d "$PAYLOAD")

echo "HTTP ${HTTP}"
cat /tmp/register-resp.json
echo ""
if [ "$HTTP" -ge 300 ]; then
  echo "::error::Register failed (HTTP $HTTP)"
  exit 1
fi
echo "✅ Recording registered. All done."

# Clean up local file (Render free tier has limited disk)
rm -f "$OUT"
