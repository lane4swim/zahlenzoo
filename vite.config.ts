import { defineConfig } from 'vitest/config';

// Bei Hosting unter einem Unterpfad (z. B. GitHub Pages: /zahlenzoo/) BASE_PATH setzen:
//   BASE_PATH=/zahlenzoo/ npm run build
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  build: {
    target: 'es2022',
    // Phaser ist groß; die Warnschwelle passt zum erwarteten Bundle.
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
