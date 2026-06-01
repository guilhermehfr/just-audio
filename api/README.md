# Just Audio API

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5-blue)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.9-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

Express.js API para extração e streaming de áudio de vídeos do YouTube via HLS.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Quickstart](#quickstart)
- [Referência da API](#referência-da-api)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Arquitetura](#arquitetura)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração do Docker](#configuração-do-docker)
- [Testes](#testes)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Limitações Conhecidas](#limitações-conhecidas)
- [Contribuindo](#contribuindo)

## Pré-requisitos

- **Node.js** v20 ou superior
- **pnpm** v8 ou superior (ou npm/yarn)
- **FFmpeg** v4.0 ou superior (para processamento de áudio)
- **Docker & Docker Compose** (para ambiente local com MinIO/S3)
- **yt-dlp** (instalado automaticamente via npm)

### Verificar Instalação

```bash
# Node.js e pnpm
node --version  # deve ser v20+
pnpm --version  # deve ser v8+

# FFmpeg (opcional se usar Docker)
ffmpeg -version

# Docker (opcional)
docker --version
docker compose --version
```

## Instalação

### 1. Clonar Repositório

```bash
git clone https://github.com/guilhermehfr/just-audio.git
cd just-audio/api
```

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo .env com suas configurações
# Ver seção "Variáveis de Ambiente" abaixo
nano .env
```

### 4. Iniciar Infraestrutura (Docker)

```bash
# Inicia MinIO e outros serviços
pnpm run infra:up

# Verificar se tudo está pronto
curl http://localhost:9000  # MinIO
```

### 5. Executar em Desenvolvimento

```bash
pnpm run dev
```

A API estará disponível em `http://localhost:3000`

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
| `UNSUPPORTED_PROVIDER` | 422 | Provedor não soportado |
| `FETCH_FAILED` | 502 | Falha ao buscar metadados |
| `STREAM_FAILED` | 502 | Falha ao criar stream |
| `EXTERNAL_SERVICE_ERROR` | 502 | Erro em serviço externo |
| `PROCESSING_FAILED` | 500 | Falha no processamento |
| `TOO_MANY_REQUESTS` | 429 | Limite de requisições excedido |

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

### GET /api/health

Health check simples para liveness probes (Kubernetes).

**Response (200):**

```json
{
  "status": "ok"
}
```

---

### GET /api/ready

Verificação de prontidão detalhada. Valida conectividade com MinIO, FFmpeg e disco temporário.

**Response (200):**

```json
{
  "status": "ready",
  "checks": {
    "minio": true,
    "ffmpeg": true,
    "tempDisk": true
  }
}
```

**Response (503):**

```json
{
  "status": "not-ready",
  "checks": {
    "minio": false,
    "ffmpeg": true,
    "tempDisk": true
  }
}
```

---

### Detalhes do Rate Limiting

O rate limiting é aplicado globalmente por IP:

| Configuração | Valor Padrão | Variável |
|--------------|--------------|----------|
| Máximo de requisições | 10 | `RATE_LIMIT_MAX` |
| Janela de tempo | 15 minutos | Configurado internamente |
| Status retornado | 429 Too Many Requests | - |

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
| **Servidor** |||
| `PORT` | | 3000 | Porta do servidor |
| `NODE_ENV` | | development | Ambiente |
| `RATE_LIMIT_MAX` | | 10 | Limite de requisições (por 15min) |
| **MinIO/S3** |||
| `MINIO_ENDPOINT` | ✓ | - | Endpoint S3/MinIO |
| `MINIO_ACCESS_KEY` | ✓ | - | Access key S3 |
| `MINIO_SECRET_KEY` | ✓ | - | Secret key S3 |
| `MINIO_BUCKET` | ✓ | - | Bucket S3 |
| `MINIO_REGION` | | auto | Região S3 |
| **Áudio** |||
| `AUDIO_TEMP_DIR` | ✓ | - | Diretório temporário |
| `MAX_DURATION` | | 14400 | Duração máx (segundos) |
| `MAX_FILE_SIZE` | | 500 | Tamanho máx (MB) |
| `AUDIO_TTL` | | 86400 | TTL do áudio (segundos) |
| `MAX_CONCURRENT_JOBS` | | 3 | Jobs concurrently |
| **CORS** |||
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

┌────────────┐     ┌──────────────────┐
│  Health    │────▶│ ReadinessProbe   │
│  (/health) │     │ (/ready)         │
└────────────┘     └──────────────────┘
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
| `pnpm run lint` | ESLint |
| `pnpm run type-check` | TypeScript |
| `pnpm run test` | Testes unitários + rota |
| `pnpm run test:unit` | Testes unitários |
| `pnpm run test:route` | Testes de rota |
| `pnpm run test:ci` | Testes para CI |
| `pnpm run test:e2e` | Testes end-to-end |
| `pnpm run test:smoke:infra` | Smoke test infraestrutura |
| `pnpm run test:smoke:api` | Smoke test API |
| `pnpm run test:load` | Load test |
| `pnpm run check` | Lint + type-check + testes |
| `pnpm run infra:up` | Inicia Docker |
| `pnpm run infra:down` | Para Docker |
| `pnpm run infra:down:clean` | Para Docker e remove volumes |

---

## Estrutura

```
src/
├── app.ts                 # Express setup
├── server.ts              # Entry point
├── config/
│   └── env.ts           # Environment variables
├── controllers/
│   └── audio.ts         # HTTP handlers
├── routes/
│   ├── index.ts          # Routes aggregation
│   ├── audio.ts         # Audio routes
│   └── ready.ts         # Readiness probe
├── services/
│   ├── AudioExtraction.ts   # Audio extraction logic
│   └── AudioStorage.ts     # S3 upload/download
├── middleware/
│   ├── cors.ts          # CORS middleware
│   └── errorHandler.ts  # Error handling
├── lib/
│   └── s3.ts           # S3 client
├── types/
│   └── index.ts      # TypeScript interfaces
├── utils/
│   ├── youtube-dl.ts    # yt-dlp wrapper
│   └── ffmpeg-stream.ts # HLS segmentation
└── tests/
    ├── unit/           # Testes unitários
    └── route/          # Testes de rota
```

---

## Testes

### Estrutura de Testes

A cobertura de testes é organizada em camadas:

```
tests/
├── unit/              # Testes unitários (serviços, utils)
├── route/             # Testes de integração (endpoints)
└── performance/       # Testes de carga e smoke
```

### Tipos de Testes

| Tipo | Comando | Descrição |
|------|---------|-----------|
| **Unitários** | `pnpm run test:unit` | Testes de serviços e utilitários |
| **Rota** | `pnpm run test:route` | Testes de endpoints HTTP |
| **CI** | `pnpm run test:ci` | Unit + Route (para CI/CD) |
| **E2E** | `pnpm run test:e2e` | Testes end-to-end |
| **Smoke** | `pnpm run test:smoke:api` | Testes de saúde da API |
| **Carga** | `pnpm run test:load` | Testes de performance |

### Executando Testes

```bash
# Todos os testes
pnpm run test

# Apenas testes unitários
pnpm run test:unit

# Apenas testes de rota
pnpm run test:route

# Com cobertura (se configurado)
pnpm run test -- --coverage
```

### Escrevendo Testes

Exemplo de teste unitário:

```typescript
import { describe, it, expect } from 'vitest'
import { AudioExtraction } from '../services/AudioExtraction'

describe('AudioExtraction', () => {
  it('deve extrair informações do vídeo', async () => {
    const service = new AudioExtraction()
    const info = await service.getVideoInfo('https://youtube.com/watch?v=...')
    
    expect(info).toBeDefined()
    expect(info.title).toBeTruthy()
    expect(info.duration).toBeGreaterThan(0)
  })
})
```

### CI/CD

Os testes rodam automaticamente em:
- Pull requests
- Commits em branches de release
- Deploy para produção

---

## Configuração do Docker

### Subir Ambiente Local

```bash
# Inicia todos os serviços (MinIO, Redis, etc)
pnpm run infra:up

# Verificar logs
docker compose logs -f

# Parar serviços
pnpm run infra:down

# Limpar volumes (cuidado!)
pnpm run infra:down:clean
```

### Serviços Disponíveis

| Serviço | Porta | URL | Credenciais |
|---------|-------|-----|-------------|
| MinIO (S3) | 9000 | http://localhost:9000 | minioadmin/minioadmin |
| MinIO Console | 9001 | http://localhost:9001 | minioadmin/minioadmin |
| API | 3000 | http://localhost:3000 | - |

### Dockerfile para Produção

```bash
# Build da imagem
docker build -t just-audio-api:latest .

# Executar container
docker run -p 3000:3000 \
  -e MINIO_ENDPOINT=minio:9000 \
  -e MINIO_ACCESS_KEY=minioadmin \
  -e MINIO_SECRET_KEY=minioadmin \
  -e MINIO_BUCKET=audio \
  -e AUDIO_TEMP_DIR=/tmp/audio \
  just-audio-api:latest
```

### Docker Compose para Produção

Ver `docker-compose.yml` para produção com Kubernetes ready.

---

## Deployment

### Ambiente de Staging

```bash
# Build para produção
pnpm run build

# Testar build localmente
pnpm run start

# Com variáveis de ambiente
NODE_ENV=production pnpm run start
```

### Kubernetes

A API está pronta para Kubernetes com:

- **Liveness Probe**: `GET /api/health`
- **Readiness Probe**: `GET /api/ready`
- **Healthchecks**: Validam FFmpeg, MinIO e disco temporário

```yaml
# Exemplo de deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: just-audio-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: just-audio-api
  template:
    metadata:
      labels:
        app: just-audio-api
    spec:
      containers:
      - name: api
        image: just-audio-api:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: MINIO_ENDPOINT
          valueFrom:
            configMapKeyRef:
              name: api-config
              key: minio_endpoint
        # ... mais variáveis
```

### Deploy em Cloud

#### AWS ECS/Fargate

```bash
# Fazer push da imagem para ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker tag just-audio-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/just-audio-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/just-audio-api:latest
```

#### Docker Hub

```bash
docker tag just-audio-api:latest guilhermehfr/just-audio-api:latest
docker push guilhermehfr/just-audio-api:latest
```

### Variáveis de Ambiente em Produção

```bash
# Exemplo .env.production
NODE_ENV=production
PORT=3000
RATE_LIMIT_MAX=100

MINIO_ENDPOINT=s3.amazonaws.com
MINIO_ACCESS_KEY=<sua_key>
MINIO_SECRET_KEY=<sua_secret>
MINIO_BUCKET=just-audio-prod
MINIO_REGION=us-east-1

AUDIO_TEMP_DIR=/tmp/audio
MAX_CONCURRENT_JOBS=5
AUDIO_TTL=604800  # 7 dias

CORS_ORIGIN=https://seu-dominio.com
```

---

## Troubleshooting

### Erro: "FFmpeg not found"

```bash
# Solução 1: Instalar FFmpeg
# macOS
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg

# Solução 2: Usar variável de ambiente
export FFMPEG_PATH=/usr/bin/ffmpeg
```

### Erro: "MinIO connection refused"

```bash
# Verificar se MinIO está rodando
docker compose ps

# Reiniciar MinIO
pnpm run infra:down:clean
pnpm run infra:up

# Verificar conectividade
curl http://localhost:9000
```

### Erro: "Too many requests (429)"

```
Solução: Aguardar 15 minutos ou aumentar RATE_LIMIT_MAX
Ou configurar em .env: RATE_LIMIT_MAX=50
```

### Erro: "AUDIO_TEMP_DIR does not exist"

```bash
# Solução: Criar diretório
mkdir -p /caminho/para/audio
chmod 755 /caminho/para/audio

# E configurar em .env
AUDIO_TEMP_DIR=/caminho/para/audio
```

### Erro: "Cannot extract video info"

```
Possíveis causas:
1. yt-dlp desatualizado: pnpm install (força atualização)
2. Vídeo indisponível ou privado
3. Restrição geográfica
4. IP bloqueado por YouTube

Solução: Verificar logs:
pnpm run dev  # Ver output
```

### Testes Falhando

```bash
# Limpar cache
rm -rf node_modules/.vitest

# Reinstalar dependências
pnpm install

# Executar novamente
pnpm run test
```

### Performance Lenta

```
Verificar:
1. Recursos disponíveis: free -h (memória)
2. Espaço em disco: df -h
3. Logs de FFmpeg: MAX_DURATION e MAX_FILE_SIZE
4. Jobs concorrentes: aumentar MAX_CONCURRENT_JOBS
```

---

## Limitações Conhecidas

### Limite de Duração

- **Máximo**: 4 horas (14400 segundos, configurável)
- **Motivo**: Gerenciar uso de memória e espaço em disco
- **Solução**: Aumentar `MAX_DURATION` se recursos permitirem

### Limite de Tamanho

- **Máximo**: 500 MB (configurável)
- **Motivo**: Evitar saturação de armazenamento
- **Solução**: Aumentar `MAX_FILE_SIZE` e garantir espaço em disco

### Limite de Requisições

- **Máximo**: 10 requisições por IP a cada 15 minutos
- **Motivo**: Proteção contra abuso
- **Solução**: Aumentar `RATE_LIMIT_MAX` para clientes confiáveis

### Formatos de Áudio

- **Suportado**: AAC, MP3, OPUS (via FFmpeg)
- **Não Suportado**: Áudios com DRM ou criptografia

### Compatibilidade com YouTube

- A API depende de `yt-dlp` que pode quebrar com mudanças no YouTube
- Manter `youtube-dl-exec` atualizado: `pnpm update youtube-dl-exec`

### Período de Retenção

- Arquivos removidos após `AUDIO_TTL` segundos (padrão: 24 horas)
- MinIO com ciclo de vida configurado em `docker-compose.yml`

### Concorrência

- Máximo `MAX_CONCURRENT_JOBS` processamentos simultâneos (padrão: 3)
- Requisições adicionais são enfileiradas

---

## Contribuindo

### Fluxo de Desenvolvimento

1. **Fork** do repositório
2. **Clone** seu fork: `git clone https://github.com/guilhermehfr/just-audio.git`
3. **Branch** para feature: `git checkout -b feat/minha-feature`
4. **Commit** suas mudanças: `git commit -m "feat: adiciona X"`
5. **Push** para seu fork: `git push origin feat/minha-feature`
6. **Pull Request** para repositório principal

### Padrões de Código

- **Linguagem**: TypeScript (tipagem obrigatória)
- **Estilo**: ESLint + Prettier (rodar antes de commit)
- **Testes**: Cobertura mínima de 80%
- **Commits**: Convenção Conventional Commits

```bash
# Antes de fazer commit
pnpm run check  # lint + type-check + testes
pnpm run format  # formatar código
```

### Tipos de Commits

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: mudanças de estilo (sem lógica)
refactor: refatoração de código
test: testes
chore: tarefas (deps, build, etc)
```

### Exemplo de PR

```markdown
## Descrição
Adiciona nova funcionalidade de X.

## Mudanças
- [ ] Implementação de X
- [ ] Testes unitários
- [ ] Documentação atualizada

## Testes
Rodar: pnpm run check

## Checklist
- [ ] Código segue padrões do projeto
- [ ] Testes passam
- [ ] Documentação atualizada
- [ ] Sem breaking changes
```

### Reportar Issues

Use o [GitHub Issues](https://github.com/guilhermehfr/just-audio/issues) com:

```markdown
## Descrição
Descrever o problema.

## Passos para Reproduzir
1. Fazer X
2. Fazer Y
3. Ver erro

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que aconteceu.

## Ambiente
- Node.js: v20.0.0
- SO: Ubuntu 22.04
- FFmpeg: v5.0
```

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## Suporte

- 📚 Documentação: [Leia o README](README.md)
- 🐛 Issues: [GitHub Issues](https://github.com/guilhermehfr/just-audio/issues)
- 💬 Discussões: [GitHub Discussions](https://github.com/guilhermehfr/just-audio/discussions)

---

**Desenvolvido com ❤️ para melhor gerenciamento de áudio do YouTube**
