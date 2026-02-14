export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'color-hex-length': 'long',
    'declaration-block-no-redundant-longhand-properties': true,
    'no-descending-specificity': null,
    'selector-class-pattern': null,
    'at-rule-no-unknown': [true, {
      ignoreAtRules: ['tailwind', 'apply', 'layer', 'config', 'variant']
    }],
    'function-no-unknown': [true, {
      ignoreFunctions: ['theme']
    }],
    'declaration-block-single-line-max-declarations': null
  },
  ignoreFiles: ['node_modules/**', 'dist/**', 'coverage/**']
};
