<div align="center">

# 🎧 Just Audio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

YouTube audio extraction and HLS streaming - backend API + Next.js frontend. Extracts audio from YouTube videos via yt-dlp, transcodes to HLS with FFmpeg, stores segments in S3-compatible storage (MinIO), and serves them through a polling-based streaming workflow with waveform visualization and transport controls.

**Backend:** TypeScript · Node.js · Express · FFmpeg · yt-dlp · MinIO/S3  
**Frontend:** Next.js · Tailwind CSS v4 · hls.js · lucide-react

🌐 *[Leia em Português](api/README.md)*

</br>

[Report Bug](https://github.com/guilhermehfr/just-audio/issues) · [Request Feature](https://github.com/guilhermehfr/just-audio/issues)

</div>

---

## ✨ Features

- **Web UI** – Next.js frontend with waveform visualization, click-to-seek, transport controls (play/pause, skip ±10s), speed pills (0.5x–2x), loop toggle, and expandable volume slider.
- **YouTube audio extraction** – Accepts YouTube URLs and retrieves video metadata before processing.
- **HLS audio streaming** – Converts extracted audio into `.m3u8` playlists and segmented `.ts` files through FFmpeg.
- **Asynchronous processing** – Starts extraction immediately and lets clients poll until the first stream segment becomes available.
- **S3-compatible storage** – Uploads and serves generated playlists and segments through MinIO or another S3-compatible provider.
- **Rate limiting** – Protects endpoints against abuse with IP-based request limits.
- **Structured API responses** – Consistent success and error envelope across endpoints.
- **Operational health checks** – Liveness and readiness endpoints for infrastructure orchestration.
- **Container-ready** – Docker Compose support for local infrastructure and Kubernetes-compatible probes.

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org/) (App Router) | React framework |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [hls.js](https://github.com/video-dev/hls.js) | HLS playback in `<audio>` |
| [lucide-react](https://lucide.dev/) | Icons |

### Backend

| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | JavaScript runtime |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [Express](https://expressjs.com/) | HTTP API framework |
| [FFmpeg](https://ffmpeg.org/) | Audio processing and HLS segmentation |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | YouTube metadata and audio extraction |
| [MinIO](https://min.io/) | Local S3-compatible object storage |
| [AWS S3](https://aws.amazon.com/s3/) | Production-compatible object storage |
| [Docker](https://www.docker.com/) | Containerized development environment |
| [Kubernetes](https://kubernetes.io/) | Deployment orchestration support |

### Tooling

| Technology | Purpose |
|---|---|
| [pnpm](https://pnpm.io/) | Package management |
| [ESLint](https://eslint.org/) | Code linting |
| [Prettier](https://prettier.io/) | Code formatting |
| [Vitest](https://vitest.dev/) | Testing |
| [Docker Compose](https://docs.docker.com/compose/) | Local infrastructure orchestration |

---

## 📁 Project Structure

```
├── api/                        # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── controllers/
│   │   │   └── audio.ts
│   │   ├── routes/
│   │   │   ├── audio.ts
│   │   │   ├── index.ts
│   │   │   └── ready.ts
│   │   ├── services/
│   │   │   ├── AudioExtraction.ts
│   │   │   └── AudioStorage.ts
│   │   ├── middleware/
│   │   │   ├── cors.ts
│   │   │   └── errorHandler.ts
│   │   ├── lib/
│   │   │   └── s3.ts
│   │   ├── utils/
│   │   │   ├── youtube-dl.ts
│   │   │   └── ffmpeg-stream.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── docker-compose.yml
│   └── package.json
│
├── web/                        # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── search-bar.tsx
│   │   │   ├── player-controls.tsx
│   │   │   ├── waveform.tsx
│   │   │   ├── waveform-spinner.tsx
│   │   │   ├── metadata-bar.tsx
│   │   │   ├── navbar.tsx
│   │   │   └── footer.tsx
│   │   └── lib/
│   │       ├── use-audio-player.ts
│   │       └── api.ts
│   └── package.json
│
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/)
- [FFmpeg](https://ffmpeg.org/)
- [Docker](https://www.docker.com/) and Docker Compose

### Installation

```sh
git clone https://github.com/guilhermehfr/just-audio.git
cd just-audio/api
pnpm install
cd ../web
pnpm install
```

### Environment Variables

**API** - copy and edit `api/.env.example` to `api/.env`:

```env
PORT=3001
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=audio
AUDIO_TEMP_DIR=/tmp/audio
```

**Web** - defaults to `http://localhost:3001`, no `.env` needed for local dev. Override with `NEXT_PUBLIC_API_URL`.

### Infrastructure

```sh
cd api
docker compose up -d
```

Starts MinIO on ports `9000` (S3 API) and `9001` (console).

### Development

```sh
# Terminal 1 - API
cd api
pnpm dev          → http://localhost:3001

# Terminal 2 - Web
cd web
pnpm dev          → http://localhost:3000
```

### Build

```sh
cd api && pnpm build && pnpm start
cd web && pnpm build && pnpm start
```

---

## 🔌 API Reference

See [`api/README.md`](api/README.md) for full API documentation - endpoints, request/response formats, error codes, and environment variables.

---

## 🧪 Testing

```sh
cd api
pnpm test          # unit + route
pnpm test:e2e      # end-to-end
pnpm test:smoke:api # smoke tests
pnpm check         # lint + type-check + tests
```

---

## 👋 Contact

- LinkedIn: [guilhermehe](https://linkedin.com/in/guilhermehe)
- GitHub: [guilhermehfr](https://github.com/guilhermehfr)
