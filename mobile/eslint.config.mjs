import expoConfig from "eslint-config-expo/flat.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  expoConfig,
  globalIgnores([".expo/**", "dist/**", "node_modules/**"]),
]);
