/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  moduleNameMapper: {
    '^@njoum/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  coverageThreshold: {
    global: { lines: 70, functions: 70 },
  },
  collectCoverageFrom: [
    'src/controllers/**/*.ts',
    'src/services/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
