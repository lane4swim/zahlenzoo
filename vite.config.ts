import { defineConfig } from 'vitest/config';

// Gehostet auf GitHub Pages unter https://lane4swim.github.io/zahlenzoo/.
// Für anderes Hosting überschreiben, z. B. BASE_PATH=/ npm run build
const base = process.env.BASE_PATH ?? '/zahlenzoo/';

// Kennung des Builds: in GitHub Actions der Commit, sonst ein Zeitstempel.
const buildId = (process.env.GITHUB_SHA ?? '').slice(0, 8) || Date.now().toString(36);

export default defineConfig({
  base,
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
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
