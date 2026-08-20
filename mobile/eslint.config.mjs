import expoConfig from "eslint-config-expo/flat.js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig([
  expoConfig,
  globalIgnores([".expo/**", "dist/**", "node_modules/**"]),
  // Dev-only Node scripts (e.g. scripts/setup-dev-env.cjs) run in Node, not the
  // RN bundler, so expose Node's globals for that directory only.
  {
    files: ["scripts/**"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]);
