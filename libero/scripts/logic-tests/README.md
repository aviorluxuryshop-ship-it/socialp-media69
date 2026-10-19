Alan bazlı mantık testleri (tarayıcısız). Her `*.mjs`: `export const include = ['lib/x.ts']` + `export default async ({ ok, test, load }) => {…}`.
`scripts/check-logic.mjs` ek kaynakları derler ve bu testleri çalıştırır.
