#!/bin/sh
set -e

MINIO_DATA_DIR="${MINIO_DATA_DIR:-/data}"

mkdir -p "$MINIO_DATA_DIR"

export MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
export MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"

minio server "$MINIO_DATA_DIR" --console-address ":9001" --address ":9000" &
MINIO_PID=$!

echo "Waiting for MinIO to be ready..."
for i in $(seq 1 30); do
  if curl -s http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    echo "MinIO ready"
    break
  fi
  if [ "$i" = 30 ]; then
    echo "MinIO failed to start"
    exit 1
  fi
  sleep 1
done

if [ -n "$COOKIES" ]; then
  printf '%s\n' "$COOKIES" | base64 -d > /app/cookies.txt
  echo "Cookies written to /app/cookies.txt"
fi

echo "Starting API server..."
node /app/api/dist/server.js &
NODE_PID=$!

cleanup() {
  echo "Shutting down..."
  kill "$NODE_PID" 2>/dev/null
  kill "$MINIO_PID" 2>/dev/null
  wait "$NODE_PID" "$MINIO_PID" 2>/dev/null
  exit
}

trap cleanup SIGTERM SIGINT

wait "$NODE_PID"
