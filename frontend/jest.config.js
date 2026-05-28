// eslint-disable-next-line no-undef
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '.',
  moduleNameMapper: {
    '^@slices(.*)$': '<rootDir>/src/services/slices$1',
    '^@store(.*)$': '<rootDir>/src/services/store$1',
    '^@types$': '<rootDir>/src/types',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
};