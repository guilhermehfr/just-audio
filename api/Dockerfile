FROM node:20-alpine

WORKDIR /app

RUN corepack enable

RUN apk add --no-cache ffmpeg python3 curl

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY api/package.json ./api/

RUN pnpm install --frozen-lockfile

RUN mkdir -p /app/node_modules/.pnpm/youtube-dl-exec@3.1.5/node_modules/youtube-dl-exec/bin \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /app/node_modules/.pnpm/youtube-dl-exec@3.1.5/node_modules/youtube-dl-exec/bin/yt-dlp \
  && chmod +x /app/node_modules/.pnpm/youtube-dl-exec@3.1.5/node_modules/youtube-dl-exec/bin/yt-dlp

COPY . .

COPY api/cookies.txt /app/cookies.txt

RUN pnpm --filter api build

WORKDIR /app/api

EXPOSE 3000

CMD ["node", "dist/server.js"]
