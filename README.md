<div align="center">

# 🎧 Just Audio (API)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-oriented audio extraction and HLS streaming API built with Node.js, Express, and TypeScript. It extracts audio from YouTube videos, processes it asynchronously with FFmpeg, stores HLS segments in S3-compatible storage, and exposes them through a polling-based streaming workflow.

**Backend:** TypeScript · Node.js · Express · FFmpeg · yt-dlp · MinIO/S3

**Infrastructure:** Docker Compose · Kubernetes-ready probes

🌐 *[Leia em Português](api/README.md)*

</br>

[Report Bug](https://github.com/guilhermehfr/just-audio/issues) · [Request Feature](https://github.com/guilhermehfr/just-audio/issues)

</div>

---

## ✨ Features

* **YouTube audio extraction** – Accepts YouTube URLs and retrieves video metadata before processing.
* **HLS audio streaming** – Converts extracted audio into `.m3u8` playlists and segmented `.ts` files through FFmpeg.
* **Asynchronous processing** – Starts extraction immediately and lets clients poll until the first stream segment becomes available.
* **S3-compatible storage** – Uploads and serves generated playlists and segments through MinIO or another S3-compatible provider.
* **Rate limiting** – Protects endpoints against abuse with IP-based request limits.
* **Structured API responses** – Uses a consistent success and error envelope across endpoints.
* **Operational health checks** – Includes liveness and readiness endpoints for infrastructure orchestration.
* **Container-ready** – Includes Docker Compose support for local infrastructure and Kubernetes-compatible probes.
* **Testing layers** – Supports unit, route, end-to-end, smoke, and load testing workflows.

---

## 🛠 Tech Stack

### Backend

| Technology                                    | Purpose                               |
| --------------------------------------------- | ------------------------------------- |
| [Node.js](https://nodejs.org/)                | JavaScript runtime                    |
| [TypeScript](https://www.typescriptlang.org/) | Static typing                         |
| [Express](https://expressjs.com/)             | HTTP API framework                    |
| [FFmpeg](https://ffmpeg.org/)                 | Audio processing and HLS segmentation |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp)    | YouTube metadata and audio extraction |
| [MinIO](https://min.io/)                      | Local S3-compatible object storage    |
| [AWS S3](https://aws.amazon.com/s3/)          | Production-compatible object storage  |
| [Docker](https://www.docker.com/)             | Containerized development environment |
| [Kubernetes](https://kubernetes.io/)          | Deployment orchestration support      |

### Tooling

| Technology                                         | Purpose                            |
| -------------------------------------------------- | ---------------------------------- |
| [pnpm](https://pnpm.io/)                           | Package management                 |
| [ESLint](https://eslint.org/)                      | Code linting                       |
| [Prettier](https://prettier.io/)                   | Code formatting                    |
| [Vitest](https://vitest.dev/)                      | Testing                            |
| [Docker Compose](https://docs.docker.com/compose/) | Local infrastructure orchestration |

---

## 📁 Project Structure

```text
src/
├── config/
│   └── env.ts                  # Environment configuration
├── controllers/
│   └── audio.ts                # HTTP request handlers
├── routes/
│   ├── audio.ts                # Audio endpoints
│   ├── index.ts                # Route aggregation
│   └── ready.ts                # Readiness endpoint
├── services/
│   ├── AudioExtraction.ts      # Extraction orchestration
│   └── AudioStorage.ts         # S3/MinIO storage operations
├── middleware/
│   ├── cors.ts                 # CORS configuration
│   └── errorHandler.ts         # Centralized error handling
├── lib/
│   └── s3.ts                   # S3 client setup
├── utils/
│   ├── youtube-dl.ts           # yt-dlp wrapper
│   └── ffmpeg-stream.ts        # HLS segmentation logic
├── tests/
│   ├── unit/                   # Unit tests
│   ├── route/                  # Route tests
│   └── performance/            # Smoke and load tests
├── app.ts                      # Express application setup
└── server.ts                   # Application entry point
```

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) v20+
* [pnpm](https://pnpm.io/)
* [FFmpeg](https://ffmpeg.org/)
* [Docker](https://www.docker.com/) and Docker Compose
* A local [MinIO](https://min.io/) instance or S3-compatible storage

### Installation

```sh
git clone https://github.com/guilhermehfr/just-audio.git
cd just-audio/api
pnpm install
```

### Environment Variables

```sh
cp .env.example .env
```

Configure `.env`:

```env
PORT=3000
NODE_ENV=development
RATE_LIMIT_MAX=10

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=audio
MINIO_REGION=auto

AUDIO_TEMP_DIR=/tmp/audio
MAX_DURATION=14400
MAX_FILE_SIZE=500
AUDIO_TTL=86400
MAX_CONCURRENT_JOBS=3

CORS_ORIGIN=*
```

### Infrastructure

```sh
pnpm run infra:up
```

This starts local services such as MinIO through Docker Compose.

### Development

```sh
pnpm run dev
```

The API becomes available at:

```text
http://localhost:3000
```

### Build and Production

```sh
pnpm run build
pnpm run start
```

---

## 🔌 API Overview

### Start audio extraction

```http
POST /api/audio
```

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

The API returns a `trackingId` immediately while extraction continues in the background.

### Poll the HLS playlist

```http
GET /api/audio/:trackingId/playlist.m3u8
```

Clients should poll this endpoint until it returns `200 OK`. A `404` response means FFmpeg has not produced the first HLS segment yet.

### Health endpoints

```http
GET /api/health
GET /api/ready
```

`/api/health` provides a lightweight liveness check. `/api/ready` validates MinIO connectivity, FFmpeg availability, and temporary disk access.

---

## 🧪 Testing

```sh
# Run all tests
pnpm run test

# Unit tests
pnpm run test:unit

# Route tests
pnpm run test:route

# End-to-end tests
pnpm run test:e2e

# API smoke tests
pnpm run test:smoke:api

# Load tests
pnpm run test:load

# Full validation
pnpm run check
```

---

## 👋 Contact

* LinkedIn: [guilhermehe](https://linkedin.com/in/guilhermehe)
* GitHub: [guilhermehfr](https://github.com/guilhermehfr)
