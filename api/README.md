# Just Audio API

Express.js API for extracting and streaming audio from YouTube videos via HLS.

## Quickstart

```bash
# 1. Start the server
pnpm run dev

# 2. Start extraction
curl -X POST http://localhost:3000/api/audio \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# 3. Poll for audio (until 200)
curl -o playlist.m3u8 http://localhost:3000/api/audio/audio-dQw4w9WgXcQ/playlist.m3u8
```

## API Reference

### POST /api/audio

Inicia extração de áudio do YouTube. Retorna imediatamente — o processamento ocorre em background.

**Request:**

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "trackingId": "audio-dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "duration": 213
  },
  "timestamp": "2026-04-26T21:44:00.000Z"
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `trackingId` | string | ID para polling (formato: `audio-{videoId}`) |
| `title` | string | Título do vídeo |
| `duration` | number | Duração em segundos |

**Erros:**

| Código | HTTP | Descrição |
|--------|------|-----------|
| `MISSING_URL` | 400 | URL não fornecida |
| `INVALID_URL` | 400 | URL não é do YouTube |
| `FETCH_FAILED` | 502 | Falha ao buscar metadados |
| `PROCESSING_FAILED` | 500 | Falha no processamento |

---

### GET /api/audio/:trackingId/:file

Stream de áudio via HLS. O primeiro segmento fica disponível após alguns segundos — faça polling até receber 200.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `trackingId` | string | ID retornado pelo POST |
| `file` | string | `playlist.m3u8` ou `segment_000.ts` |

**Response:**

- `playlist.m3u8` → `Content-Type: application/vnd.apple.mpegurl`
- `segment_*.ts` → `Content-Type: video/mp2t`

**Exemplo:**

```bash
# Poll until ready
until curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:3000/api/audio/audio-dQw4w9WgXcQ/playlist.m3u8 \
  | grep -q 200; do
  sleep 2
done

# Download
curl http://localhost:3000/api/audio/audio-dQw4w9WgXcQ/playlist.m3u8
```

**Erros:**

| Código | HTTP | Descrição |
|--------|------|-----------|
| `MISSING_PARAMETERS` | 400 | trackingId ou file não fornecido |
| `NOT_FOUND` | 404 | Arquivo não encontrado |
| `INTERNAL_ERROR` | 500 | Erro inesperado |

---

## Formato de Resposta

Todas respostas seguem o mesmo envelope:

**Sucesso:**

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-26T21:44:00.000Z"
}
```

**Erro:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem legível"
  },
  "timestamp": "2026-04-26T21:44:00.000Z"
}
```

---

## Variáveis de Ambiente

| Variável | Obrigatório | Padrão | Descrição |
|----------|:-----------:|--------|----------|
| `PORT` | | 3000 | Porta do servidor |
| `NODE_ENV` | | development | Ambiente |
| `MINIO_ENDPOINT` | ✓ | - | Endpoint S3/MinIO |
| `MINIO_ACCESS_KEY` | ✓ | - | Access key S3 |
| `MINIO_SECRET_KEY` | ✓ | - | Secret key S3 |
| `MINIO_BUCKET` | ✓ | - | Bucket S3 |
| `MINIO_REGION` | | auto | Região S3 |
| `AUDIO_TEMP_DIR` | ✓ | - | Diretório temporário |
| `MAX_DURATION` | | 14400 | Duração máx (segundos) |
| `MAX_FILE_SIZE` | | 500 | Tamanho máx (MB) |
| `AUDIO_TTL` | | 86400 | TTL do áudio (segundos) |
| `CORS_ORIGIN` | | * | Origem CORS |

---

## Arquitetura

```
┌────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Client   │────▶│  AudioController │────▶│ yt-dlp      │
└────────────┘     └──────────────────┘     └─────────────┘
                           │                          │
                           ▼                          ▼
                    ┌──────────────────┐     ┌─────────────┐
                    │  AudioExtraction │────▶│  FFmpeg     │
                    │  Service         │     │ (HLS seg)   │
                    └──────────────────┘     └─────────────┘
                           │                          │
                           ▼                          ▼
                    ┌─────────────────┐     ┌─────────────┐
                    │ AudioStorage    │◀────│  S3/MinIO   │
                    │ (downloadFile)  │     └─────────────┘
                    └─────────────────┘
```

### Fire and Forget + Short-Polling

1. **POST** retorna antes do processamento terminar
2. Cliente faz **polling no GET** até 200
3. **404** = FFmpeg ainda não escreveu o primeiro segmento
4. **200** = primeiro segmento disponível

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm run dev` | Desenvolvimento com hot reload |
| `pnpm run build` | Compila TypeScript |
| `pnpm run start` | Inicia produção |
| `pnpm run test` | Testes unitários |
| `pnpm run test:route` | Testes de rota |
| `pnpm run lint` | ESLint |

---

## Estrutura

```
src/
├── app.ts                 # Express setup
├── server.ts              # Entry point
├── controllers/audio.ts    # HTTP handlers
├── services/
│   ├── AudioExtraction.ts # Lógica de extração
│   └── AudioStorage.ts   # Upload/download S3
├── routes/audio.ts       # Definição de rotas
├── middleware/errorHandler.ts # ApiError
├── config/env.ts         # Environment
├── lib/s3.ts            # S3Client
├── types/index.ts       # Interfaces
└── utils/
    ├── youtube-dl.ts    # yt-dlp spawn
    └── ffmpeg-stream.ts # HLS segmentation
```
