import {
  defineConfig
} from "../../chunk-FH6HAB2V.mjs";
import "../../chunk-QFUFFP6T.mjs";
import {
  init_esm
} from "../../chunk-B4LXEYI2.mjs";

// trigger.config.ts
init_esm();
var trigger_config_default = defineConfig({
  // Your project ref from trigger.dev dashboard
  project: "proj_cjdnvdvpcwgoespajimp",
  // Path to your task files, relative to this config file
  dirs: ["./src/trigger"],
  // Retry configuration
  retries: {
    // Enable retries in dev mode for testing
    enabledInDev: false,
    // Default retry settings used if you don't specify on a task
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1e3,
      maxTimeoutInMs: 1e4,
      factor: 2,
      randomize: true
    }
  },
  // Log level
  logLevel: "debug",
  // Max duration for tasks (in seconds) — AI tasks can be long-running
  maxDuration: 300,
  build: {}
});
var resolveEnvVars = void 0;
export {
  trigger_config_default as default,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
