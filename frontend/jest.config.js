export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/main.jsx'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov']
};
