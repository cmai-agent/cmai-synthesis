---
name: voice-to-text
description: Transcribe audio into text using the scripts bundled inside this skill. Use when the user wants to know what an audio says, needs a transcript from a file, or sends a WhatsApp voice note that should be converted into text and optionally logged into workspace memory.
---

# Voice to Text

Use this skill when the job is to turn audio into text.

For `cmai`, this helps the agent operate in real community workflows where voice notes and audio-first coordination would otherwise stay outside the agent loop.

This skill is intentionally self-contained:
- it only describes the files that exist inside `skills/voice_to_text/`
- it only uses the bundled scripts in this folder
- it does not depend on helper files outside this folder

## Files In This Skill

Core files:
- [`scripts/elevenlabs_transcribe.sh`](scripts/elevenlabs_transcribe.sh)
- [`scripts/transcribe_whatsapp_audio.sh`](scripts/transcribe_whatsapp_audio.sh)

Use them as follows:
- `elevenlabs_transcribe.sh`: general-purpose transcription for a local audio file
- `transcribe_whatsapp_audio.sh`: WhatsApp-oriented flow that transcribes the file and appends the transcript to `memory/YYYY-MM-DD.md`

## Recommended Routing

Pick the script by source:
- if the input is a WhatsApp voice note or a message attachment, use `scripts/transcribe_whatsapp_audio.sh`
- if the input is just a standalone local audio file, use `scripts/elevenlabs_transcribe.sh`

## Quick Start

### General audio transcription

```bash
skills/voice_to_text/scripts/elevenlabs_transcribe.sh /path/to/audio.mp3
skills/voice_to_text/scripts/elevenlabs_transcribe.sh /path/to/audio.mp3 --lang en
skills/voice_to_text/scripts/elevenlabs_transcribe.sh /path/to/audio.mp3 --diarize
skills/voice_to_text/scripts/elevenlabs_transcribe.sh /path/to/audio.mp3 --json
```

### WhatsApp audio transcription

```bash
WORKSPACE_DIR=/path/to/workspace skills/voice_to_text/scripts/transcribe_whatsapp_audio.sh /path/to/voice-note.ogg
```

If `WORKSPACE_DIR` is not set, the script infers the workspace from the skill location.

## Requirements

Required tools:
- `bash`
- `curl`
- `jq`
- `python3`

Optional tools:
- `ffprobe` for duration-aware fallback behavior in the WhatsApp flow
- `whisper` CLI for short-audio local fallback when the cloud transcription attempt fails

Required environment:
- local transcription provider access configured outside the repo

Optional environment:
- local settings to control the workspace path, default language, short-audio threshold, and fallback model

## Script Details

### `scripts/elevenlabs_transcribe.sh`

Use this for direct file transcription.

Capabilities:
- plain text output by default
- JSON output with `--json`
- diarization with `--diarize`
- audio event tagging with `--events`
- explicit language selection with `--lang <code>`

### `scripts/transcribe_whatsapp_audio.sh`

Use this when the audio came from WhatsApp or should be preserved in the workspace memory flow.

What it does:
1. validates the input file
2. calls the bundled ElevenLabs transcription script in this same skill
3. falls back to local `whisper` for short clips when configured and needed
4. appends the transcript to `memory/YYYY-MM-DD.md`
5. prints the normalized transcript to stdout

## Operating Rules

- do not claim transcription failed until the relevant bundled script has actually been tried
- prefer the WhatsApp script for inbound voice notes because it preserves the transcript in memory
- keep transcripts private unless the user explicitly asks for the raw text
- answer from the transcript when a summary is more useful than dumping everything
- do not mention files or references that are not present in this folder
