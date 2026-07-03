# Just Audio Web

Next.js frontend for YouTube-to-HLS audio extraction and playback.

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org/) (App Router) | React framework |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [hls.js](https://github.com/video-dev/hls.js) | HLS playback in `<audio>` |
| [lucide-react](https://lucide.dev/) | Icons |

## Component Architecture

```
search-bar.tsx          ← state machine: holds useAudioPlayer, tracks extraction lifecycle
├── MetadataBar         ← title + URL display
├── Waveform            ← responsive bars (55/49), click-to-seek, two-tone progress
├── WaveformSpinner     ← loading equalizer (shown during polling)
└── PlayerControls      ← transport + speed/loop pills + volume slider
    └── Volume2 button  ← expandable slider with draggable dot

use-audio-player.ts     ← custom hook wrapping hls.js lifecycle
```

### Extraction Flow

1. User pastes YouTube URL, clicks Play
2. `POST /api/audio` → returns `{ trackingId, title, duration }`
3. Poll `GET /api/audio/:trackingId/status` (JSON, always 200 — no console 404s)
4. On `ready: true` → compute `playlistUrl`, feed to `useAudioPlayer`
5. `useAudioPlayer` creates hls.js instance, attaches to hidden `<audio>`
6. Waveform + PlayerControls render, driven by `currentTime` / `duration` from audio events

### Key Features

- **Waveform click-to-seek**: click anywhere on the bars to seek to that position
- **Volume slider**: click Volume2 button to expand a draggable slider (default 50%, mute icon at 0)
- **Skip ±10s**: disabled at track bounds via `hasLoaded` guard
- **Speed pills**: 0.5x / 1x / 1.5x / 2x
- **Loop toggle**: repeat track on end

## Getting Started

```bash
pnpm install
pnpm dev
```

The dev server starts on `http://localhost:3000`. The API must be running on `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).

### Environment

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API base URL |
