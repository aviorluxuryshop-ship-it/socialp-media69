import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/** Flat config — `next lint` Next 16'da kaldırıldı, ESLint doğrudan çalışır. */
const config = [
  { ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts", "scripts/.cache/**", "playwright-report/**", "test-results/**"] },
  ...coreWebVitals,
  ...typescript,
];

export default config;
