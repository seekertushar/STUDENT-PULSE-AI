import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'python-analytics/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
