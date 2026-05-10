import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@my-pos/shared$': '<rootDir>/../shared/src/index.ts',
    '^@my-pos/shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^@my-pos/database$': '<rootDir>/../database/src/index.ts',
    '^@my-pos/database/(.*)$': '<rootDir>/../database/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
        },
      },
    ],
  },
};

export default config;
