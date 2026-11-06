import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

const FEATURES = ['events', 'finances', 'settings', 'shops'];

const featureImportRestrictions = FEATURES.map((feature) => ({
  group: [`@/features/${feature}/*`],
  message: `Import from public barrel '@/features/${feature}' instead of internal files.`,
}));

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'react-refresh/only-export-components': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='asChild']",
          message:
            "Do not use 'asChild' (Radix pattern). Use Base UI's 'render' prop instead, e.g. render={<Button />} or render={<Link to={to} />}.",
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: featureImportRestrictions,
        },
      ],
    },
  },
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**/*.{js,jsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: FEATURES.filter((other) => other !== feature).map(
            (other) => ({
              group: [`@/features/${other}/*`],
              message: `Import from public barrel '@/features/${other}' instead of internal files.`,
            })
          ),
        },
      ],
    },
  })),
  {
    files: ['**/*.test.{js,jsx}', 'src/test/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
  eslintConfigPrettier,
]);
