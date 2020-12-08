module.exports = {
    'env': {
        'browser': true,
        'node': true,
        'commonjs': true,
        'es2020': true,
        'mocha' : true
    },
    'extends': 'eslint:recommended',
    'parserOptions': {
        'ecmaVersion': 12
    },
    'parser': 'babel-eslint',
    'rules': {
        'indent': [
            'error',
            4
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ]
    }
};
