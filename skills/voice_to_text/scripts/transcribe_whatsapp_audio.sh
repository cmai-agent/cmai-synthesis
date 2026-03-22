#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $(basename "$0") <audio-file>" >&2
  exit 64
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SKILL_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
WORKSPACE_DIR=${WORKSPACE_DIR:-$(cd "$SKILL_DIR/../.." && pwd)}
ELEVENLABS_SCRIPT="$SCRIPT_DIR/elevenlabs_transcribe.sh"

INPUT_PATH=$1
export INPUT_PATH WORKSPACE_DIR

if [[ ! -f "$INPUT_PATH" ]]; then
  echo "audio file not found: $INPUT_PATH" >&2
  exit 66
fi

if [[ ! -x "$ELEVENLABS_SCRIPT" ]]; then
  echo "ElevenLabs STT script not found or not executable: $ELEVENLABS_SCRIPT" >&2
  exit 69
fi

if [[ -f /root/.config/environment.d/elevenlabs.conf ]]; then
  set -a
  source /root/.config/environment.d/elevenlabs.conf
  set +a
fi

if [[ -z "${ELEVENLABS_API_KEY:-}" ]]; then
  echo "ELEVENLABS_API_KEY not configured" >&2
  exit 69
fi

TMP_DIR=$(mktemp -d /tmp/whatsapp-audio-transcriber.XXXXXX)
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

LANGUAGE=${WHATSAPP_AUDIO_LANGUAGE:-es}
SHORT_AUDIO_THRESHOLD_SECONDS=${SHORT_AUDIO_THRESHOLD_SECONDS:-45}
TRANSCRIPT_FILE="$TMP_DIR/transcript.txt"
ELEVENLABS_ERROR_FILE="$TMP_DIR/elevenlabs.error.txt"

DURATION_SECONDS=""
if command -v ffprobe >/dev/null 2>&1; then
  DURATION_SECONDS=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$INPUT_PATH" 2>/dev/null || true)
fi

use_local_fallback=false
if bash "$ELEVENLABS_SCRIPT" "$INPUT_PATH" --lang "$LANGUAGE" > "$TRANSCRIPT_FILE" 2>"$ELEVENLABS_ERROR_FILE"; then
  :
else
  if [[ -n "$DURATION_SECONDS" ]] && python3 - <<'PY' "$DURATION_SECONDS" "$SHORT_AUDIO_THRESHOLD_SECONDS"
import sys
seconds=float(sys.argv[1])
threshold=float(sys.argv[2])
raise SystemExit(0 if seconds < threshold else 1)
PY
  then
    use_local_fallback=true
  else
    cat "$ELEVENLABS_ERROR_FILE" >&2
    exit 65
  fi
fi

if [[ "$use_local_fallback" == "true" ]]; then
  if ! command -v whisper >/dev/null 2>&1; then
    cat "$ELEVENLABS_ERROR_FILE" >&2
    echo "whisper CLI not found for short-audio fallback" >&2
    exit 69
  fi

  LOCAL_OUT_DIR="$TMP_DIR/local-whisper"
  mkdir -p "$LOCAL_OUT_DIR"
  whisper "$INPUT_PATH" --model "${WHISPER_MODEL:-tiny}" --output_dir "$LOCAL_OUT_DIR" --output_format txt --fp16 False ${LANGUAGE:+--language "$LANGUAGE"} >/dev/null 2>&1
  LOCAL_TRANSCRIPT_FILE="$LOCAL_OUT_DIR/$(basename "${INPUT_PATH%.*}").txt"
  if [[ ! -s "$LOCAL_TRANSCRIPT_FILE" ]]; then
    echo "transcript was empty" >&2
    exit 65
  fi
  cp "$LOCAL_TRANSCRIPT_FILE" "$TRANSCRIPT_FILE"
fi

if [[ ! -s "$TRANSCRIPT_FILE" ]]; then
  echo "transcript was empty" >&2
  exit 65
fi

python3 - "$TRANSCRIPT_FILE" <<'PY'
import hashlib
import os
import pathlib
import sys
from datetime import datetime, timezone

transcript_path = pathlib.Path(sys.argv[1])
audio_path = pathlib.Path(os.environ["INPUT_PATH"])
workspace_dir = pathlib.Path(os.environ.get("WORKSPACE_DIR", "."))
memory_dir = workspace_dir / "memory"
memory_dir.mkdir(parents=True, exist_ok=True)

now = datetime.now(timezone.utc)
day_file = memory_dir / f"{now.date().isoformat()}.md"

text = transcript_path.read_text(encoding="utf-8").strip()
lines = [line.strip() for line in text.splitlines() if line.strip()]
normalized = "\n".join(lines)

digest = hashlib.sha256(audio_path.read_bytes()).hexdigest()[:12]
entry = "\n".join(
    [
        f"## {now.strftime('%H:%M:%S UTC')} - WhatsApp Audio",
        f"- File: `{audio_path.name}`",
        f"- Fingerprint: `{digest}`",
        "- Transcript:",
        normalized,
        "",
    ]
)

existing = day_file.read_text(encoding="utf-8") if day_file.exists() else ""
if f"`{digest}`" not in existing:
    with day_file.open("a", encoding="utf-8") as fh:
        if not day_file.exists() or day_file.stat().st_size == 0:
            fh.write(f"# {now.date().isoformat()}\n\n")
        fh.write(entry)

print(normalized)
PY
