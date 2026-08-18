import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  globalSetup: "<rootDir>/src/__tests__/setup.ts",
  globalTeardown: "<rootDir>/src/__tests__/teardown.ts",
  setupFilesAfterEnv: [],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
};

export default config;
