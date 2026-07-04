FROM node:22-alpine

WORKDIR /app

RUN corepack enable

RUN apk add --no-cache ffmpeg python3 curl deno

# Install MinIO
RUN curl -L https://dl.min.io/server/minio/release/linux-amd64/minio -o /usr/local/bin/minio \
  && chmod +x /usr/local/bin/minio

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY api/package.json ./api/

RUN pnpm install --frozen-lockfile --ignore-scripts && pnpm rebuild esbuild

# Replace bundled yt-dlp with latest (version-agnostic) for better anti-bot handling
RUN YT_DLP_DIR=$(find /app/node_modules/.pnpm -path "*/node_modules/youtube-dl-exec" -type d | head -1) \
  && mkdir -p "$YT_DLP_DIR/bin" \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$YT_DLP_DIR/bin/yt-dlp" \
  && chmod +x "$YT_DLP_DIR/bin/yt-dlp"

COPY . .

RUN pnpm --filter api build

COPY api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

WORKDIR /app/api

EXPOSE 3000 9000

ENTRYPOINT ["/docker-entrypoint.sh"]
