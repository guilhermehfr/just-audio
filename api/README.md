# Just Audio API

Production-ready Express.js API for audio extraction and streaming from YouTube, Vimeo, and other video platforms.

## Status

✅ **API is operational** with all core routes tested and validated.

- ✅ YouTube metadata extraction
- ✅ Audio streaming (zero-disk I/O with FFmpeg piping)
- ✅ Service/Repository/DI architecture
- ✅ Full TypeScript strict mode
- ✅ Unit tests with Vitest

## Directory Structure

```
src/
├── controllers/      # HTTP request handlers
├── services/         # Business logic & orchestration
├── repositories/     # Data abstraction layer
├── middleware/       # Express middleware (error handling)
├── routes/          # Route definitions with DI wiring
├── types/           # TypeScript interfaces & types
├── utils/           # Utilities (yt-dlp, FFmpeg, etc.)
├── app.ts           # Express app setup
└── server.ts        # Server initialization
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm)

### Installation

```bash
cd api
pnpm install
```

### Environment Setup

Create a `.env` file in the `api/` directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Default values:
- `NODE_ENV=development`
- `PORT=3000`
- `LOG_LEVEL=info`

### Development

Run with hot reload:

```bash
pnpm run dev
```

### Production

Build and start:

```bash
pnpm run build
pnpm run start
```

Or in one command:

```bash
pnpm run start:prod
```

## Available Scripts

- `pnpm run dev` — Start dev server with watch mode
- `pnpm run build` — Build TypeScript to `dist/`
- `pnpm run start` — Start production server
- `pnpm run start:prod` — Build and start in one command
- `pnpm run test` — Run unit tests with Vitest
- `pnpm run lint` — Run ESLint
- `pnpm run lint:fix` — Fix ESLint issues automatically
- `pnpm run type-check` — Type check without emitting files

## API Endpoints

All endpoints use JSON request/response format and return standard envelope with `success`, `data`, and `timestamp` fields.

### Audio Extraction & Streaming

#### Get Video Metadata

Fetch metadata without extracting audio.

```
POST /api/audio/info
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "title": "Me at the zoo",
    "duration": 19,
    "thumbnail": "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg?..."
  },
  "timestamp": "2026-04-16T22:10:00.000Z"
}
```

#### Extract Audio (Streaming)

Initiate audio extraction. Returns immediately with a streaming URL. Extraction happens asynchronously.

```
POST /api/audio/extract
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "title": "Me at the zoo",
    "duration": 19,
    "thumbnail": "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg?...",
    "audioUrl": "/api/audio/stream/audio-1776377416099-9n511f",
    "trackingId": "audio-1776377416099-9n511f"
  },
  "timestamp": "2026-04-16T22:10:00.000Z"
}
```

**Parameters:**
- `url` (required) — Video URL (YouTube, Vimeo, Dailymotion, etc.)

#### Stream Audio File

Download the extracted audio (M4A format).

```
GET /api/audio/stream/{trackingId}?url=https://www.youtube.com/watch?v=jNQXAC9IVRw
```

**Response (200 OK):**
- Headers:
  - `Content-Type: audio/mp4`
  - `Content-Disposition: attachment; filename="audio-{trackingId}.m4a"`
- Body: Binary M4A audio data (~300KB for typical 19-second video)

**Note:** The `url` query parameter is required to stream the audio.

### Response Format

All successful responses follow this envelope:

```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2026-04-16T22:10:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "timestamp": "2026-04-16T22:10:00.000Z"
}
```

### Error Codes

- `MISSING_URL` — URL parameter not provided (400)
- `INVALID_URL` — URL is not a supported video platform (400)
- `MISSING_TRACKING_ID` — Tracking ID parameter not provided (400)
- `FETCH_FAILED` — Failed to fetch video metadata (400)
- `STREAM_ERROR` — Failed to create audio stream (500)
- `INTERNAL_ERROR` — Unexpected server error (500)

## Features

- ✅ **Express.js 5.x** with TypeScript strict mode
- ✅ **YouTube/Vimeo audio extraction** using youtube-dl-exec NPM package
- ✅ **FFmpeg streaming** with non-seekable output support (`-movflags frag_keyframe+empty_moov`)
- ✅ **Zero-disk I/O architecture** (youtube-dl → FFmpeg → HTTP response piping)
- ✅ **Service/Repository/DI pattern** for clean separation of concerns
- ✅ **Structured error handling** with custom `ApiError` class
- ✅ **CORS middleware** with configurable origin
- ✅ **Graceful shutdown** on SIGTERM/SIGINT
- ✅ **Full TypeScript compilation** with no errors
- ✅ **ESLint & Prettier** for code quality

## Architecture

### Service/Repository/Dependency Injection Pattern

**AudioController** → orchestrates HTTP requests

↓

**AudioExtractionService** → handles business logic (validation, metadata, streaming)

↓

**yt-dlp utility** → spawns YouTube audio extraction process

↓

**FFmpeg utility** → pipes audio through FFmpeg for encoding

### Key Components

- **AudioController** ([controllers/audio.ts](src/controllers/audio.ts))
  - Handles 3 HTTP endpoints
  - Delegates business logic to services
  - Manages streaming responses

- **AudioExtractionService** ([services/AudioExtractionService.ts](src/services/AudioExtractionService.ts))
  - URL validation
  - Metadata fetching via yt-dlp
  - Audio stream creation and piping

- **youtube-dl utility** ([utils/youtube-dl.ts](src/utils/youtube-dl.ts))
  - Uses youtube-dl-exec NPM package for video audio extraction
  - Handles JavaScript runtime configuration automatically
  - Returns readable stream for audio data

- **FFmpeg utility** ([utils/ffmpeg-stream.ts](src/utils/ffmpeg-stream.ts))
  - Spawns FFmpeg process directly (not fluent-ffmpeg)
  - Pipes yt-dlp output → FFmpeg stdin → PassThrough → HTTP response
  - Uses `-movflags frag_keyframe+empty_moov` for streaming to non-seekable output
  - Converts audio to M4A (AAC codec, 128k bitrate, 44100Hz)

### Data Flow

```
Client Request
    ↓
Express Route → AudioController
    ↓
AudioExtractionService (validates, fetches metadata, initiates streaming)
    ↓
youtube-dl-exec Process (downloads audio from YouTube)
    ↓
FFmpeg Process (encodes to M4A)
    ↓
PassThrough Stream
    ↓
HTTP Response ← Client receives audio file
```

### Middleware

- **Error Handler** ([middleware/errorHandler.ts](src/middleware/errorHandler.ts))
  - Catches all errors and returns structured JSON responses
  - Uses console.log for error tracking

## Testing

All 3 routes have 9 unit tests covering success cases and validation:

```
✅ POST /api/audio/info        (metadata extraction)
✅ POST /api/audio/extract    (streaming initialization)
✅ GET /api/audio/stream/:id  (validation & error handling)
```

Test file: [src/routes/audio.test.ts](src/routes/audio.test.ts)

## Implementation Status

### ✅ Completed
- [x] Audio metadata extraction (`POST /api/audio/info`)
- [x] Audio streaming (`POST /api/audio/extract` + `GET /api/audio/stream/:id`)
- [x] YouTube/Vimeo support (youtube-dl-exec integration)
- [x] FFmpeg streaming with non-seekable output support
- [x] Service/Repository/DI architecture
- [x] Error handling middleware
- [x] CORS middleware with configurable origin
- [x] TypeScript strict mode
- [x] ESLint configuration
- [x] Prettier code formatting
- [x] All routes tested with real YouTube videos

### 🔮 Future Enhancements
- [ ] Redis integration for production-grade progress tracking
- [ ] Database persistence for extraction history
- [ ] Audio trimming/cutting support
- [ ] Multiple format output (MP3, WAV, etc.)
- [ ] Rate limiting & request validation
- [ ] Authentication & authorization
- [ ] File upload management routes
- [ ] S3 integration for file storage
- [ ] WebSocket support for real-time progress updates

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment (development \| production) |
| `PORT` | 3000 | Server port |
| `LOG_LEVEL` | info | Logging level (debug, info, warn, error) |
| `AUDIO_TEMP_DIR` | /tmp/just-audio | Temporary directory for audio processing |
| `AUDIO_QUALITY` | 0 | Audio quality preset (0=best, higher=faster) |
| `MAX_DURATION` | 3600 | Maximum allowed video duration in seconds |
| `MAX_FILE_SIZE` | 500 | Maximum file size in MB |
| `CORS_ORIGIN` | * | CORS origin setting (use specific domain in production) |

## Technical Notes

### FFmpeg Streaming to Non-Seekable Output

The M4A format (ISO Base Media File Format) requires seeking in output files. When piping to stdout (HTTP response), the output is non-seekable. To solve this:

```bash
ffmpeg -i pipe:0 -c:a aac -b:a 128k -ar 44100 \
  -movflags frag_keyframe+empty_moov \
  -f ipod pipe:1
```

Key flag: `-movflags frag_keyframe+empty_moov`
- `frag_keyframe` — Fragment output at keyframes
- `empty_moov` — Emit empty moov atom upfront (allows streaming before file is complete)

This was essential to make FFmpeg work with Node.js PassThrough streams piped to HTTP responses.

### youtube-dl-exec Setup

The API uses the `youtube-dl-exec` NPM package which handles YouTube audio extraction. This is bundled and requires no system-level yt-dlp installation:

```bash
npm install youtube-dl-exec
```

The package automatically manages the YouTube-DL binary and JavaScript runtime for modern video extraction.

### FFmpeg Installation

FFmpeg is installed via the `@ffmpeg-installer/ffmpeg` NPM package, providing cross-platform FFmpeg binary management:

```bash
npm install @ffmpeg-installer/ffmpeg
```

This handles FFmpeg setup for encoding audio streams without requiring system-level FFmpeg installation (though it's recommended to have FFmpeg installed for better compatibility).

## Running in Monorepo

This API is part of the Just Audio monorepo. Commands:

```bash
# From repository root
pnpm --filter api run dev
pnpm --filter api run build
pnpm --filter api run start

# From api/ directory
cd api
pnpm run dev
```
