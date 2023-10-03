import jest from 'jest'

// Add any custom config to be passed to Jest
const customJestConfig: jest.Config = {
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: 'ts-jest',
  moduleFileExtensions: ['js', 'json', 'ts'],
  modulePaths: ['.'],
  moduleNameMapper: {
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@server/(.*)$': '<rootDir>/src/server/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  modulePathIgnorePatterns: ['e2e', 'e2e_results'],
  collectCoverageFrom: ['src/server/**/*.(t|j)s'],
  coveragePathIgnorePatterns: ['src/server/console', 'src/server/migration'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  // testEnvironment: 'jest-environment-jsdom',
  verbose: true,
}

export default customJestConfig

// import type { Config } from '@jest/types'
//
// const config: Config.InitialOptions = {

// }
//
// export default config
//
