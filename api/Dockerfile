FROM node:22-alpine

WORKDIR /app

RUN corepack enable

RUN apk add --no-cache ffmpeg python3 curl

# Install MinIO
RUN curl -L https://dl.min.io/server/minio/release/linux-amd64/minio -o /usr/local/bin/minio \
  && chmod +x /usr/local/bin/minio

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY api/package.json ./api/

RUN pnpm install --frozen-lockfile

# Replace bundled yt-dlp with latest (version-agnostic)
RUN cd /app/api && YT_DLP_PATH=$(node -e "console.log(require('path').dirname(require.resolve('youtube-dl-exec/package.json')) + '/bin/yt-dlp')") \
  && rm -f "$YT_DLP_PATH" \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$YT_DLP_PATH" \
  && chmod +x "$YT_DLP_PATH"

COPY . .

RUN pnpm --filter api build

COPY api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

WORKDIR /app/api

EXPOSE 3000 9000

ENTRYPOINT ["/docker-entrypoint.sh"]
