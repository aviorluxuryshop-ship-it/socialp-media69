/** Çakışmasız, URL güvenli kimlik. Yerel ve bulut aynı kimlikleri kullanır. */
export function uid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, "").slice(0, 20);
  return Array.from({ length: 20 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}
