module.exports = {
  root: true,
  env: {
    es2022: true,
    browser: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
      rules: {
        // Codacy often runs a legacy ESLint profile and flags modern module syntax.
        'no-undef': 'off',
        'import/no-unresolved': 'off',
      },
    },
  ],
};
