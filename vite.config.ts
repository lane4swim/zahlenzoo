import { defineConfig } from 'vitest/config';

// Gehostet auf GitHub Pages unter https://lane4swim.github.io/zahlenzoo/.
// Für anderes Hosting überschreiben, z. B. BASE_PATH=/ npm run build
const base = process.env.BASE_PATH ?? '/zahlenzoo/';

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
