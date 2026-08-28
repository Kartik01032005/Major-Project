const config = {
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
        tsconfig: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          isolatedModules: true,
        },
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

module.exports = config;
