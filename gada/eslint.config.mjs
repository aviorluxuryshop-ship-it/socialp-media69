import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/** Flat config — `next lint` was removed in Next 16, so ESLint runs directly. */
const config = [
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts', 'scripts/**'],
  },
  ...coreWebVitals,
  ...typescript,
]

export default config
