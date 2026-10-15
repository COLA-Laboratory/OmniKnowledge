// ESLint for the page's modules, the tools and the tests.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'output/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser } },
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]',
          message: 'Insert text with textContent; trusted markup goes through markup() or setMarkup() in kit/dom.js.',
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'Use markup() or setMarkup() in kit/dom.js.',
        },
      ],
    },
  },
  { files: ['kit/dom.js'], rules: { 'no-restricted-syntax': 'off' } },
  {
    files: ['tools/**', 'tests/**', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
