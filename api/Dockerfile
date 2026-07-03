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

COPY . .

RUN pnpm --filter api build

COPY api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

WORKDIR /app/api

EXPOSE 3000 9000

ENTRYPOINT ["/docker-entrypoint.sh"]
