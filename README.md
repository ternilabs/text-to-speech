# TerniLabs Text-to-Speech

A browser-only text-to-speech app for generating single or bulk audio locally with Kokoro.js.

## Overview

TerniLabs Text-to-Speech runs model loading, speech generation, audio encoding, and bulk zip export in the browser. It does not require a backend service for the MVP flow.

## CSV Bulk Input

Bulk mode accepts a CSV file with these columns:

```csv
id,text
intro,"Welcome to the audio lesson."
summary,"This is the closing narration."
```

- `id` is used as the filename stem.
- `text` is the content sent to Kokoro for generation.
- Empty text rows are skipped during parsing.

## Output Formats

- `WAV` is the baseline output format.
- `MP3 Experimental` attempts browser/WASM MP3 encoding at 192 kbps.

If MP3 encoding or validation fails, the app writes a WAV fallback instead. Bulk exports record this as `mp3_failed_fallback_wav` in `results.json`.

## Browser Capability Fallbacks

- Generation runs in a Web Worker so the UI remains responsive.
- WebGPU can be selected only when the browser exposes support.
- Runtime WebGPU failures fall back to WASM/CPU generation.
- Browsers without File System Access API use an in-memory zip download path.

## Development

```bash
npm install
npm run dev
npm run test
npm run build
```
