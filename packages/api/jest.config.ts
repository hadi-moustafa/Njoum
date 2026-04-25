import type { Config } from 'jest';

const config: Config = {
  preset:              'ts-jest',
  testEnvironment:     'node',
  rootDir:             '.',
  testMatch:           ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/controllers/**/*.ts',
    'src/services/**/*.ts',
    'src/middleware/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      lines:     70,
      functions: 70,
      branches:  60,
    },
  },
  coverageReporters: ['text', 'lcov'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@njoum/shared$': '<rootDir>/../../packages/shared/src',
  },
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  clearMocks: true,
};

export default config;
