import { expect, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Konsol hatalarını ve yakalanmamış istisnaları toplar (testin sonunda boş olmalı). */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // Üçüncü taraf (YouTube küçük resimleri vb.) ağ hataları uygulama hatası değildir
    if (/Failed to load resource|net::ERR|ytimg|youtube|tymm\.meb/i.test(t)) return;
    errors.push(`console: ${t}`);
  });
  return errors;
}

export async function onboard(page: Page, opts: { name?: string; grade?: 9 | 10; schoolType?: string } = {}) {
  await page.goto("/");
  await page.waitForURL(/hos-geldin/);
  await page.getByLabel("Sana nasıl hitap edelim?").fill(opts.name ?? "Deniz");
  await page.getByRole("radio", { name: new RegExp(`^${opts.grade ?? 9}\\.\\s*sınıf`) }).click();
  await page.getByRole("button", { name: /Devam/ }).click();
  await page.getByLabel("İl").selectOption("Bayburt");
  await page.getByRole("radio", { name: opts.schoolType ?? "Anadolu Lisesi", exact: true }).click();
  await page.getByRole("button", { name: /Devam/ }).click();
  await page.getByRole("button", { name: /Devam/ }).click(); // dersler (varsayılan hepsi seçili)
  await page.getByRole("button", { name: /Başla/ }).click();
  await page.waitForURL((u) => u.pathname === "/", { timeout: 20_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

export async function shot(page: Page, info: TestInfo, name: string, theme: "light" | "dark" = "light") {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `tests/e2e/shots/${info.project.name}-${name}-${theme}.png`, fullPage: true });
}

/** Ciddi/kritik erişilebilirlik ihlali olmamalı (axe-core, WCAG A/AA). */
export async function expectNoSeriousA11y(page: Page, label: string) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    bad.map((v) => {
      const d = (n: (typeof v.nodes)[number]) => {
        const data = n.any[0]?.data as { fgColor?: string; bgColor?: string; contrastRatio?: number; fontSize?: string } | undefined;
        return `${n.target.join(" ")}${data?.contrastRatio ? ` [${data.fgColor} on ${data.bgColor} = ${data.contrastRatio}, ${data.fontSize}]` : ""}`;
      };
      return `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes.slice(0, 3).map(d).join(" | ")}`;
    }),
    `${label} erişilebilirlik`,
  ).toEqual([]);
}

/** İçinde gerçek metin bulunan, geçerli xref tablosuna sahip en küçük PDF. */
export function makePdf(text: string): Buffer {
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${`BT /F1 14 Tf 50 780 Td (${text}) Tj ET`.length} >>\nstream\nBT /F1 14 Tf 50 780 Td (${text}) Tj ET\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}
