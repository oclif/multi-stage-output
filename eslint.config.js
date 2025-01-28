import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import xoReactSpace from 'eslint-config-xo-react/space'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettier,
  ...xoReactSpace,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'jsdoc/require-returns-check': 'off',
      'no-useless-constructor': 'off',
      'perfectionist/sort-intersection-types': 'off',
      'perfectionist/sort-jsx-props': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-union-types': 'off',
      'react/jsx-tag-spacing': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prefer-module': 'off',
    },
  },
  {
    files: ['test/**/*'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'mocha/max-top-level-suites': 'off',
    },
  },
]
