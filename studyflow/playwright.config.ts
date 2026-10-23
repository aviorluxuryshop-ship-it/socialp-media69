import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3230);
const REMOTE = process.env.E2E_BASE_URL; // dağıtılmış adrese karşı çalıştırmak için

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: REMOTE ?? `http://127.0.0.1:${PORT}`, trace: "retain-on-failure", locale: "tr-TR", timezoneId: "Europe/Istanbul" },
  projects: [
    { name: "mobil", use: { ...devices["Pixel 7"] } },
    { name: "masaüstü", use: { viewport: { width: 1280, height: 860 } } },
  ],
  webServer: REMOTE
    ? undefined
    : [
        { command: "node tests/integration/run-mock.mjs", port: 3299, reuseExistingServer: true, timeout: 20_000 },
        {
          command: `node_modules/.bin/next start -p ${PORT} -H 127.0.0.1`,
          port: PORT,
          reuseExistingServer: false,
          timeout: 60_000,
          env: { NODE_ENV: "production", ANTHROPIC_API_KEY: "test-key-not-real", ANTHROPIC_BASE_URL: "http://127.0.0.1:3299", STUDYFLOW_ALLOW_ANON_AI: "1", STUDYFLOW_AI_DAILY_LIMIT: "500", NODE_USE_ENV_PROXY: "1", NO_PROXY: "127.0.0.1,localhost", no_proxy: "127.0.0.1,localhost" },
        },
      ],
});
