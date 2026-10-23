// Playwright webServer için: sahte Anthropic servisini ayakta tutar (yalnızca tesisat testleri).
import { startMock } from "./mock-anthropic.mjs";

await startMock(Number(process.env.MOCK_PORT || 3299));
console.log("mock anthropic ready");
setInterval(() => {}, 1 << 30);
