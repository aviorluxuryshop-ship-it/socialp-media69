import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/** Flat config — `next lint` was removed in Next 16, so ESLint runs directly. */
const config = [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // The scene engine indexes typed arrays and Three.js attribute buffers
      // by computed offsets throughout — that's the domain, not a smell.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
]

export default config
