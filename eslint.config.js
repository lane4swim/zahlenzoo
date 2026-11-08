import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', 'dev-dist/', 'coverage/', 'stilprobe/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['vite.config.ts', 'eslint.config.js', 'art/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Spiellogik bleibt ohne Phaser testbar (Spezifikation, Abschnitt 4).
    files: ['src/logic/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'phaser', message: 'src/logic/ darf Phaser nicht importieren.' }],
          patterns: [
            { group: ['phaser/*'], message: 'src/logic/ darf Phaser nicht importieren.' },
            {
              group: ['**/scenes/**', '**/ui/**'],
              message: 'src/logic/ darf keine Szenen oder UI-Bausteine importieren.',
            },
          ],
        },
      ],
      // Zufall nur über src/logic/rng.ts (Spezifikation, Abschnitt 6).
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'createRng() aus src/logic/rng.ts nutzen.' },
      ],
    },
  },
  prettier,
);
