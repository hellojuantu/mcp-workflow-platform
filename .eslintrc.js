module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'plugin:@typescript-eslint/recommended'
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'curly': ['error', 'all'],
        'indent': ['error', 2, {
            'SwitchCase': 1,
            'FunctionDeclaration': {
                'parameters': 'first'
            },
            'FunctionExpression': {
                'parameters': 'first'
            },
            'CallExpression': {
                'arguments': 'first'
            },
            'ArrayExpression': 'first',
            'ObjectExpression': 'first'
        }],
        'semi': ['error', 'always'],
        'quotes': ['error', 'single'],
        'no-multiple-empty-lines': ['error', { 'max': 1 }],
        'no-trailing-spaces': 'error',
        'eol-last': 'error',
        'comma-dangle': ['error', 'always-multiline'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'space-before-function-paren': ['error', {
            'anonymous': 'always',
            'named': 'never',
            'asyncArrow': 'always'
        }],
        'arrow-spacing': ['error', { 'before': true, 'after': true }]
    }
}; 