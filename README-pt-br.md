<div align="center">

# 🎧 Just Audio

[![Vercel Status](https://therealsujitk-vercel-badge.vercel.app/?app=webhook-handler-generator)](https://just-audio.vercel.app/)
[![Render](https://img.shields.io/badge/render-live-brightgreen?style=flat&logo=render&logoColor=white)](https://just-audio.onrender.com/api/health)
[![Licença: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Uma aplicação para extração de áudio do YouTube e streaming HLS - API backend + frontend em Next.js. Extrai áudio de vídeos do YouTube por meio do yt-dlp, transcodifica para HLS com FFmpeg, armazena os segmentos em um armazenamento compatível com S3 (MinIO) e os disponibiliza através de um fluxo de streaming baseado em polling, com visualização de waveform e controles de reprodução.

**Backend:** TypeScript · Node.js · Express · FFmpeg · yt-dlp · MinIO/S3  
**Frontend:** Next.js · Tailwind CSS v4 · hls.js · lucide-react

🌐 _[Read in English](README.md)_

<img width="700" height="400" alt="image" src="https://github.com/user-attachments/assets/ebc2ab2a-9771-462b-9a76-049f350e2a89" />

</br>

[Demo Online](https://just-audio.vercel.app/) · [API](https://just-audio.onrender.com/api/health) · [Reportar Bug](https://github.com/guilhermehfr/just-audio/issues)

</div>

---

## ✨ Funcionalidades

- **Interface Web** - Frontend em Next.js com visualização de waveform, click-to-seek, controles de reprodução (play/pause, avançar/retroceder ±10s), seleção de velocidade (0.5x–2x), alternância de loop e controle de volume expansível.
- **Extração de áudio do YouTube** - Aceita URLs do YouTube e obtém os metadados do vídeo antes do processamento.
- **Streaming de áudio via HLS** - Converte o áudio extraído em playlists `.m3u8` e segmentos `.ts` utilizando FFmpeg.
- **Processamento assíncrono** - Inicia a extração imediatamente e permite que os clientes realizem polling até que o primeiro segmento do stream esteja disponível.
- **Armazenamento compatível com S3** - Faz upload e disponibiliza playlists e segmentos gerados através do MinIO ou de outro provedor compatível com S3.
- **Rate limiting** – Protege os endpoints contra abuso por meio de limites de requisições baseados em IP.
- **Respostas estruturadas da API** - Envelope consistente para respostas de sucesso e erro em todos os endpoints.
- **Health checks operacionais** - Endpoints de liveness e readiness para orquestração da infraestrutura.
- **Pronto para containers** - Suporte ao Docker Compose para infraestrutura local e probes compatíveis com Kubernetes.

---

## 🛠 Stack de Tecnologias

### Frontend

| Tecnologia | Finalidade |
|---|---|
| [Next.js](https://nextjs.org/) (App Router) | Framework React |
| [Tailwind CSS v4](https://tailwindcss.com/) | Estilização |
| [hls.js](https://github.com/video-dev/hls.js) | Reprodução HLS em `<audio>` |
| [lucide-react](https://lucide.dev/) | Ícones |

### Backend

| Tecnologia | Finalidade |
|---|---|
| [Node.js](https://nodejs.org/) | Runtime JavaScript |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática |
| [Express](https://expressjs.com/) | Framework para APIs HTTP |
| [FFmpeg](https://ffmpeg.org/) | Processamento de áudio e segmentação HLS |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Extração de metadados e áudio do YouTube |
| [MinIO](https://min.io/) | Armazenamento de objetos local compatível com S3 |
| [AWS S3](https://aws.amazon.com/s3/) | Armazenamento de objetos compatível com produção |
| [Docker](https://www.docker.com/) | Ambiente de desenvolvimento containerizado |
| [Kubernetes](https://kubernetes.io/) | Suporte à orquestração de deploys |

### Ferramentas

| Tecnologia | Finalidade |
|---|---|
| [pnpm](https://pnpm.io/) | Gerenciamento de pacotes |
| [ESLint](https://eslint.org/) | Linting de código |
| [Prettier](https://prettier.io/) | Formatação de código |
| [Vitest](https://vitest.dev/) | Testes |
| [Docker Compose](https://docs.docker.com/compose/) | Orquestração da infraestrutura local |

---

## 📁 Estrutura do Projeto

```text
├── api/                        # Backend em Express
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
├── web/                        # Frontend em Next.js
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

## 🚀 Primeiros Passos

### Pré-requisitos

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/)
- [FFmpeg](https://ffmpeg.org/)
- [Docker](https://www.docker.com/) e Docker Compose

### Instalação

```sh
git clone https://github.com/guilhermehfr/just-audio.git
cd just-audio/api
pnpm install
cd ../web
pnpm install
```

### Variáveis de Ambiente

**API** - copie e edite `api/.env.example` para `api/.env`:

```env
PORT=3001
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=audio
AUDIO_TEMP_DIR=/tmp/audio
```

**Web** - utiliza `http://localhost:3001` por padrão. Nenhum arquivo `.env` é necessário para desenvolvimento local. Para alterar, defina `NEXT_PUBLIC_API_URL`.

### Infraestrutura

```sh
cd api
docker compose up -d
```

Inicializa o MinIO nas portas `9000` (API S3) e `9001` (console).

### Desenvolvimento

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

## 🔌 Referência da API

Consulte [`api/README.md`](api/README.md) para a documentação completa da API - endpoints, formatos de requisição e resposta, códigos de erro e variáveis de ambiente.

---

## 🧪 Testes

```sh
cd api
pnpm test           # unit + route
pnpm test:e2e       # end-to-end
pnpm test:smoke:api # smoke tests
pnpm check          # lint + type-check + testes
```

---

## 👋 Contato

- LinkedIn: [guilhermehe](https://linkedin.com/in/guilhermehe)
- GitHub: [guilhermehfr](https://github.com/guilhermehfr)