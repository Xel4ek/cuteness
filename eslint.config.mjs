import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  { ignores: ['**/dist/**', '**/out-tsc/**', '**/target/**', '**/pkg/**', '**/vitest.config.*.timestamp*'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
      ],
      '@angular-eslint/prefer-standalone': 'off',
      '@typescript-eslint/ban-ts-comment': ['warn'],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'array-bracket-spacing': ['error', 'never'],
      'arrow-body-style': 'off',
      'comma-dangle': ['error', 'always-multiline'],
      curly: ['error', 'all'],
      'max-len': ['error', { code: 180, ignoreStrings: true, ignoreComments: true, ignoreTemplateLiterals: true }],
      'no-bitwise': 'off',
      'no-console': 'warn',
      'no-duplicate-imports': 'error',
      'sort-imports': ['error', { ignoreDeclarationSort: true }],
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': ['warn', { ignore: [1, 0, -1, 100], ignoreReadonlyClassProperties: true }],
      'no-nested-ternary': 'warn',
      'no-prototype-builtins': 'warn',
      'no-restricted-imports': ['error', { paths: ['lodash'], patterns: ['lodash/*'] }],
      'no-shadow': 'off',
      'no-underscore-dangle': 'off',
      'object-curly-spacing': ['error', 'always'],
      'operator-linebreak': ['error', 'before', { overrides: { '=': 'after' } }],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: ['if', 'for', 'while', 'do', 'switch'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['if', 'for', 'while', 'do', 'switch'] },
      ],
      'prefer-arrow-callback': 'error',
      quotes: ['warn', 'single'],
      radix: 'off',
    },
  },
  {
    files: ['**/*.{spec,test}.{ts,tsx}'],
    rules: {
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
      '@angular-eslint/template/mouse-events-have-key-events': 'warn',
      '@angular-eslint/template/elements-content': 'warn',
    },
  },
];
