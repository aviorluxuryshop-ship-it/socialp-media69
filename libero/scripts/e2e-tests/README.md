Alan bazlı tarayıcı testleri. Her `*.mjs` dosyası `export default async (h) => { await h.test('ad', async () => {…}) }`
biçiminde olmalıdır (h: BASE, newPage, go, ok, test, txt, txts, tmp, testVideo, consoleErrors). `scripts/e2e.mjs` bunları sırayla yükler.
