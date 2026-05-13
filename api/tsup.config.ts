import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  external: ['dotenv'],
  bundle: true,
  splitting: false,
  clean: true,
})
