module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  env: {
    es6: true,
    node: true
  },
  globals: {
    document: false,
    navigator: false,
    window: false
  },
  parserOptions: {
    ecmaVersion: 2017
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: false
      }
    ],
    'no-unused-vars': ['error', { vars: 'all', args: 'none' }],
    'no-console': ['off']
  }
}
