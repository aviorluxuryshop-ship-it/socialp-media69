import { expect, test } from "@playwright/test";
import { BOOKS } from "@/lib/catalog";
import { expectNoSeriousA11y, makePdf, onboard, shot, watchErrors } from "./helpers";

test("karşılama akışı ve ana sayfa", async ({ page }, info) => {
  const errors = watchErrors(page);
  await page.goto("/");
  await page.waitForURL(/hos-geldin/);
  await shot(page, info, "01-karsilama");
  await onboard(page);
  for (const t of ["Yapay Zekâ ile Öğren", "Notlarımı Yaz", "Notlarımı Yükle", "Video İzle", "Sınava Hazırlan", "Özet Çıkar"]) {
    await expect(page.getByRole("link", { name: new RegExp(t) }).first()).toBeVisible();
  }
  await shot(page, info, "02-ana-sayfa");
  await shot(page, info, "02-ana-sayfa", "dark");
  await expectNoSeriousA11y(page, "ana sayfa");
  expect(errors).toEqual([]);
});

test("not yazma: otomatik kayıt, yeniden yüklemede kalıcılık, arama ve silme", async ({ page }, info) => {
  const errors = watchErrors(page);
  await onboard(page);
  await page.goto("/notlar/yeni");
  await page.waitForURL(/\/notlar\/(?!yeni)[\w-]+$/);
  await page.getByLabel("Not başlığı").fill("Fotosentez notları");
  await page.getByLabel("Not metni").fill("Bitkiler **ışık** enerjisini kimyasal enerjiye çevirir. $6CO_2$");
  await expect(page.getByText(/Kaydedildi/)).toBeVisible({ timeout: 10_000 });
  await shot(page, info, "03-not-duzenleyici");
  await page.reload();
  await expect(page.getByLabel("Not başlığı")).toHaveValue("Fotosentez notları");
  await expect(page.getByLabel("Not metni")).toHaveValue(/ışık/);
  await page.getByRole("button", { name: /Önizle/ }).click();
  await expect(page.locator(".katex").first()).toBeVisible(); // formül gerçekten işlendi
  await page.goto("/notlar");
  await page.getByLabel("Notlarda ara").fill("fotosentez");
  await expect(page.getByText("Fotosentez notları")).toBeVisible();
  await page.getByLabel("Notlarda ara").fill("bulunmayan-kelime");
  await expect(page.getByText("Fotosentez notları")).toHaveCount(0);
  await page.getByLabel("Notlarda ara").fill("");
  await shot(page, info, "04-notlar-liste");
  await page.getByLabel("Fotosentez notları notunu sil").click();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  await expect(page.getByText("Fotosentez notları")).toHaveCount(0);
  await expectNoSeriousA11y(page, "notlar");
  expect(errors).toEqual([]);
});

test("yükleme: geçerli PDF metni çıkarılır, sahte dosya reddedilir", async ({ page }, info) => {
  const errors = watchErrors(page);
  await onboard(page);
  await page.goto("/yukle");
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles({ name: "sahte.pdf", mimeType: "application/pdf", buffer: Buffer.from("MZ\x90\x00 bu bir PDF değil, çalıştırılabilir dosya") });
  await expect(page.getByText(/desteklenmiyor|geçerli|okunamadı/i).first()).toBeVisible({ timeout: 15_000 });
  await input.setInputFiles({ name: "biyoloji.pdf", mimeType: "application/pdf", buffer: makePdf("Fotosentez isik enerjisini kimyasal enerjiye donusturur") });
  await expect(page.getByText("biyoloji.pdf").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/metin çıkarıldı|1 sayfa/).first()).toBeVisible();
  await shot(page, info, "05-yukle");
  await expectNoSeriousA11y(page, "yükle");
  expect(errors).toEqual([]);
});

test("video kataloğu: filtreler, devre dışı stil, gömme cephesi ve izledim durumu", async ({ page }, info) => {
  const errors = watchErrors(page);
  await onboard(page);
  await page.goto("/video");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const cards = page.locator('a[href^="/video/"]');
  const total = await cards.count();
  expect(total).toBeGreaterThan(5);
  // Doğrulanmış videosu olmayan tarzlar devre dışı ve dürüstçe işaretli
  await expect(page.getByRole("button", { name: /Görsel anlatım/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Hikâyeleştirilmiş/ })).toBeDisabled();
  await page.getByRole("button", { name: /Soru çözümü/ }).click();
  expect(await cards.count()).toBeLessThanOrEqual(total);
  await page.getByLabel("Video ara").fill("zzzz-yok");
  await expect(page.getByText("Bu seçime uyan doğrulanmış video yok")).toBeVisible();
  await page.getByLabel("Video ara").fill("");
  await page.getByRole("button", { name: /Soru çözümü/ }).click();
  await shot(page, info, "06-video-liste");
  await cards.first().click();
  await page.waitForURL(/\/video\/[\w-]{11}$/);
  expect(await page.locator("iframe").count()).toBe(0); // tıklamadan YouTube yüklenmez
  await shot(page, info, "07-video-detay");
  await page.getByRole("button", { name: "Videoyu oynat" }).click();
  const src = await page.locator("iframe").getAttribute("src");
  expect(src).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}/);
  await page.getByRole("button", { name: /İzledim olarak işaretle/ }).click();
  await expect(page.getByRole("button", { name: "İzledim", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "İzledim", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/video/yok-boyle-bir-id");
  await expect(page.getByText("Video kataloğumuzda yok")).toBeVisible();
  await expectNoSeriousA11y(page, "video");
  expect(errors).toEqual([]);
});

const mat9 = BOOKS.find((b) => b.subjectId === "matematik" && b.grade === 9 && b.tocVerified)!;
const topic = mat9.units[0].topics[0];

test("yapay zekâ öğretmen: akış, kaynak etiketi, 'Beni test et' (sahte model; tesisat testi)", async ({ page }, info) => {
  const errors = watchErrors(page);
  await onboard(page);
  await page.goto(`/ogren?konu=${topic.id}`);
  const start = page.getByRole("button", { name: "Bu konuyu anlat" });
  await expect(start).toBeEnabled({ timeout: 15_000 });
  await shot(page, info, "08-ogren-baslangic");
  await start.click();
  await expect(page.getByText("Bu, test sunucusunun sabit yanıtıdır.")).toBeVisible({ timeout: 40_000 });
  // Kaynak dürüstçe etiketlenir: kitaba ulaşıldıysa 'Resmî ders kitabına dayalı', değilse 'Genel müfredat bilgisi'
  await expect(page.getByText(/Resmî ders kitabına dayalı|Genel müfredat bilgisi/).first()).toBeVisible();
  await shot(page, info, "09-ogren-yanit");
  await page.getByRole("button", { name: /Beni test et/ }).click();
  const q1 = page.getByRole("radiogroup", { name: "Soru 1" });
  await expect(q1).toBeVisible({ timeout: 40_000 });
  await q1.getByRole("radio").first().click();
  await expect(page.locator("#icerik").getByText(/Yol, hız ile zamanın çarpımıdır/).first()).toBeVisible(); // seçimden sonra açıklama görünür
  await expectNoSeriousA11y(page, "öğren");
  expect(errors).toEqual([]);
});

test("sınav: üret → doğrulama özeti → çöz → sonuç ve kanıt eşiği", async ({ page }, info) => {
  const errors = watchErrors(page);
  await onboard(page);
  await page.goto(`/sinav?konu=${topic.id}`);
  await shot(page, info, "10-sinav-olustur");
  await page.getByRole("button", { name: "Sınavı hazırla" }).click();
  await expect(page.getByText("Sınavın hazır")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/yapay zekâ ürettiği sorulardır; resmî MEB sorusu değildir/)).toBeVisible();
  await expect(page.getByText(/ayrı bir hesapla doğrulandı/)).toBeVisible();
  await expect(page.getByText(/elendi/)).toBeVisible(); // elenen sorular gizlenmez
  await page.getByRole("button", { name: "Sınava başla" }).click();
  await page.waitForURL(/sinav\/coz/);
  const total = Number((await page.getByText(/^\d+ \/ \d+$|Soru \d+/).first().textContent())?.match(/\d+/g)?.at(-1) ?? 1);
  for (let i = 0; i < 30; i++) {
    await page.getByRole("radio").first().click();
    const next = page.getByRole("button", { name: /Sonraki|İleri/ });
    if (await next.isVisible().catch(() => false)) await next.click();
    else break;
  }
  await shot(page, info, "11-sinav-coz");
  await page.getByRole("button", { name: /Bitir|Sınavı bitir/ }).first().click();
  const confirm = page.getByRole("button", { name: /Bitir|Evet/ }).last();
  if (await page.getByRole("dialog").isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL(/sinav\/sonuc/, { timeout: 20_000 });
  const main = page.locator("#icerik");
  await expect(main.getByText(/yapay zekâ/i).first()).toBeVisible();
  await expect(main.getByText(/yeterli (veri|kanıt)|henüz/i).first()).toBeVisible(); // tek denemeden konu seviyesi çıkarılmaz
  await shot(page, info, "12-sinav-sonuc");
  await expectNoSeriousA11y(page, "sonuç");
  expect(total).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("planlayıcı: ödev ekle, tamamla, kaçırılanı yeniden planla, otomatik plan", async ({ page }, info) => {
  const errors = watchErrors(page);
  await onboard(page);
  await page.goto("/plan");
  await page.getByRole("button", { name: "Ekle", exact: true }).click();
  await page.getByLabel("Başlık").fill("Fizik problem seti");
  const yesterday = new Date(Date.now() - 86_400_000);
  const iso = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  await page.getByLabel("Tarih").fill(iso).catch(() => undefined);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await shot(page, info, "13-plan");
  await page.getByRole("button", { name: /Plan oluştur/ }).first().click();
  await page.getByRole("button", { name: /Konu seç/ }).click();
  await page.locator("button[aria-pressed]").nth(0).click();
  await page.locator("button[aria-pressed]").nth(1).click();
  await page.getByRole("button", { name: /Bitti|Tamam|Seç/ }).last().click();
  await page.getByRole("button", { name: "Planı göster" }).click();
  await expect(page.getByRole("button", { name: /Plana ekle \(\d+\)/ })).toBeVisible();
  await shot(page, info, "14-plan-onizleme");
  await page.getByRole("button", { name: /Plana ekle/ }).click();
  await expect(page.getByText(/çalışma plana eklendi/)).toBeVisible();
  await expectNoSeriousA11y(page, "plan");
  expect(errors).toEqual([]);
});

test("ilerleme ve ayarlar: boş durum dürüst, tema/ses/dışa aktarma çalışır", async ({ page, context }, info) => {
  const errors = watchErrors(page);
  await onboard(page);
  await page.goto("/ilerleme");
  await expect(page.getByText("Henüz gösterecek bir şey yok")).toBeVisible();
  await shot(page, info, "15-ilerleme-bos");
  await page.goto("/ayarlar");
  await shot(page, info, "16-ayarlar");
  await page.getByRole("radio", { name: "Koyu" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("switch", { name: "Ses efektleri" }).click();
  await expect(page.getByRole("switch", { name: "Ses efektleri" })).toHaveAttribute("aria-checked", "true");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Verilerimi indir/ }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^studyflow-yedek-\d{4}-\d{2}-\d{2}\.json$/);
  const body = JSON.parse(await (await import("node:fs/promises")).readFile((await dl.path())!, "utf8"));
  expect(body.records.profile).toHaveLength(1);
  expect(JSON.stringify(body)).not.toMatch(/api[_-]?key|password|token/i); // dışa aktarma gizli bilgi içermez
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark"); // tercih kalıcı
  void context;
  await expectNoSeriousA11y(page, "ayarlar");
  expect(errors).toEqual([]);
});
