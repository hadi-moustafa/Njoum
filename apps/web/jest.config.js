/** @type {import('jest').Config} */
module.exports = {
  preset:          'ts-jest',
  testEnvironment: 'node',
  rootDir:         '.',
  testMatch:       ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json', diagnostics: false }],
  },
  moduleNameMapper: {
    '^@/(.*)$':        '<rootDir>/$1',
    '^@njoum/shared$': '<rootDir>/../../packages/shared/src',
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
};
