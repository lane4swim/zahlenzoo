import { VitePWA } from 'vite-plugin-pwa';
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
  plugins: [
    // Offline-Betrieb (Spezifikation 3 und 12): Beim ersten Besuch legt der Service Worker alle
    // Dateien ab. Eine neue Version lädt nie von selbst mitten in einer Runde („prompt“): Sie wird
    // vorgemerkt, im Menü erscheint „Neue Version laden“, sonst gilt sie beim nächsten Start.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Zahlen-Zoo',
        short_name: 'Zahlen-Zoo',
        description:
          'Mathe-Spiel für die 2. Klasse: rechnen, zählen, messen und den Zoo wachsen lassen.',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#2b1f17',
        theme_color: '#4A3426',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // alles ablegen: Spielcode, Schriften, Bilder (auch Tier-Sprite-Sheets) und Daten
        globPatterns: ['**/*.{js,css,html,png,webp,json,woff,woff2,svg,ico,webmanifest,mp3}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Bilder lädt das Spiel mit ?v=<Build-Kennung>; abgelegt sind sie ohne
        ignoreURLParametersMatching: [/^v$/],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
