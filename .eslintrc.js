module.exports = {
  extends: ['last'],
  env: {
    node: true
  },
  globals: {
    document: false,
    navigator: false,
    window: false
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
