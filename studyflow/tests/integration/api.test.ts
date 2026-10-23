// Üretim derlemesi (next start) üzerinde sunucu uçlarının entegrasyon testi.
// Anthropic yerine tests/integration/mock-anthropic.mjs kullanılır: bu testler YAPAY ZEKÂ KALİTESİNİ DEĞİL,
// kimlik/hız sınırı koruması, girdi doğrulama, akış biçimi, doğrulama hattı ve hata yollarını sınar.
// Çalıştırmadan önce `npm run build` gerekir. Kaynak getirme gerçek MEB PDF'lerine ağdan erişir (yoksa dürüstçe düşer).
import { type ChildProcess, spawn } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BOOKS } from "@/lib/catalog";
// @ts-expect-error — düz JS modülü
import { startMock } from "./mock-anthropic.mjs";

const MOCK_PORT = 3299;
const base = (port: number) => `http://127.0.0.1:${port}`;

interface Srv {
  port: number;
  proc: ChildProcess;
  url: string;
}
const servers: Srv[] = [];

async function startNext(port: number, env: Record<string, string>): Promise<Srv> {
  const proc = spawn("node_modules/.bin/next", ["start", "-p", String(port), "-H", "127.0.0.1"], {
    env: { ...process.env, NODE_ENV: "production", ANTHROPIC_BASE_URL: base(MOCK_PORT), NODE_USE_ENV_PROXY: "1", NO_PROXY: "127.0.0.1,localhost", no_proxy: "127.0.0.1,localhost", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  proc.stdout?.on("data", (d) => (log += d));
  proc.stderr?.on("data", (d) => (log += d));
  const srv = { port, proc, url: base(port) };
  servers.push(srv);
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`${srv.url}/api/status`);
      if (r.ok) return srv;
    } catch {
      /* henüz açılmadı */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Sunucu açılmadı:\n" + log.slice(-2000));
}

const post = (s: Srv, path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${s.url}${path}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });

let mock: { close: () => Promise<void>; requests: { headers: Record<string, string>; body: Record<string, unknown> }[] };
let app: Srv; // yapay zekâ açık, hesap yok, anonim izinli
const mat9 = BOOKS.find((b) => b.subjectId === "matematik" && b.grade === 9 && b.tocVerified)!;
const topic = mat9.units[0].topics[0];

async function readNdjson(res: Response) {
  const text = await res.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { t: string; x?: string; [k: string]: unknown });
}

beforeAll(async () => {
  mock = await startMock(MOCK_PORT);
  app = await startNext(3201, { ANTHROPIC_API_KEY: "test-key-not-real", STUDYFLOW_ALLOW_ANON_AI: "1", STUDYFLOW_AI_DAILY_LIMIT: "500" });
});
afterAll(async () => {
  for (const s of servers) s.proc.kill("SIGKILL");
  await mock?.close();
});

describe("durum ve koruma", () => {
  it("/api/status gizli bilgi sızdırmaz", async () => {
    const r = await fetch(`${app.url}/api/status`);
    const j = await r.json();
    expect(j).toEqual({ ai: true, accounts: false, aiReady: true });
    expect(JSON.stringify(j)).not.toMatch(/test-key/);
    expect(r.headers.get("cache-control")).toMatch(/no-store/);
  });
  it("güvenlik başlıkları gönderilir", async () => {
    const r = await fetch(`${app.url}/`);
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
    expect(r.headers.get("x-frame-options")).toBe("DENY");
    expect(r.headers.get("referrer-policy")).toBeTruthy();
    expect(r.headers.get("x-powered-by")).toBeNull();
  });
  it("anahtar yoksa AI uçları 503 ve açıklayıcı hata verir", async () => {
    const s = await startNext(3202, {});
    expect((await (await fetch(`${s.url}/api/status`)).json()).ai).toBe(false);
    for (const p of ["tutor", "quiz", "exam", "summary", "ocr"]) {
      const r = await post(s, `/api/ai/${p}`, {});
      expect(r.status, p).toBe(503);
      expect((await r.json()).error).toBe("ai_unconfigured");
    }
  });
  it("üretimde hesap yoksa ve anonim izin verilmediyse anahtarı korur (503)", async () => {
    const s = await startNext(3203, { ANTHROPIC_API_KEY: "test-key-not-real" });
    const st = await (await fetch(`${s.url}/api/status`)).json();
    expect(st).toEqual({ ai: true, accounts: false, aiReady: false });
    const r = await post(s, "/api/ai/quiz", {});
    expect(r.status).toBe(503);
    expect((await r.json()).error).toBe("accounts_unconfigured");
  });
  it("hesap sistemi açıkken belirteçsiz veya geçersiz belirteçle AI'ya izin vermez (401)", async () => {
    const s = await startNext(3205, { ANTHROPIC_API_KEY: "test-key-not-real", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:1", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-not-real" });
    expect(await (await fetch(`${s.url}/api/status`)).json()).toEqual({ ai: true, accounts: true, aiReady: true });
    const none = await post(s, "/api/ai/quiz", {});
    expect(none.status).toBe(401);
    const bad = await post(s, "/api/ai/tutor", { messages: [{ role: "user", content: "selam" }] }, { authorization: "Bearer sahte-belirtec" });
    expect(bad.status).toBe(401);
    expect((await bad.json()).error).toBe("auth_required");
  });
  it("günlük sınırı uygular (429)", async () => {
    const s = await startNext(3204, { ANTHROPIC_API_KEY: "test-key-not-real", STUDYFLOW_ALLOW_ANON_AI: "1", STUDYFLOW_AI_DAILY_LIMIT: "3" });
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await post(s, "/api/ai/quiz", {})).status);
    expect(codes).toEqual([400, 400, 400, 429, 429]);
    const r = await post(s, "/api/ai/quiz", {});
    expect((await r.json()).error).toBe("rate_limited");
  });
});

describe("girdi doğrulama", () => {
  it("bozuk JSON ve geçersiz mesaj dizisi 400 döner", async () => {
    expect((await post(app, "/api/ai/tutor", "{bozuk")).status).toBe(400);
    expect((await post(app, "/api/ai/tutor", { messages: [] })).status).toBe(400);
    expect((await post(app, "/api/ai/tutor", { messages: [{ role: "assistant", content: "x" }] })).status).toBe(400);
    expect((await post(app, "/api/ai/quiz", { subjectId: "yok" })).status).toBe(400);
    expect((await post(app, "/api/ai/exam", { plan: [] })).status).toBe(400);
    expect((await post(app, "/api/ai/exam", { plan: [{ subjectId: "matematik", topicIds: [] }] })).status).toBe(400);
    expect((await post(app, "/api/ai/summary", { sections: [] })).status).toBe(400);
    expect((await post(app, "/api/ai/ocr", { images: [] })).status).toBe(400);
  });
  it("çok büyük gövdeyi reddeder (413)", async () => {
    const r = await post(app, "/api/ai/tutor", JSON.stringify({ messages: [{ role: "user", content: "x".repeat(200_000) }] }));
    expect(r.status).toBe(413);
  });
  it("OCR yalnızca izinli görsel türü ve base64 kabul eder", async () => {
    expect((await post(app, "/api/ai/ocr", { images: [{ mime: "application/pdf", data: "AAAA" }] })).status).toBe(400);
    expect((await post(app, "/api/ai/ocr", { images: [{ mime: "image/png", data: "<script>" }] })).status).toBe(400);
  });
});

describe("öğretmen (akış)", () => {
  it("meta → delta → done sırasıyla NDJSON akıtır ve isteği doğru kurar", async () => {
    const before = mock.requests.length;
    const res = await post(app, "/api/ai/tutor", {
      messages: [{ role: "user", content: `${topic.title} konusunu kısaca anlat` }],
      mode: "hizli",
      grade: 9,
      subjectId: "matematik",
      bookIds: [mat9.id],
      topicId: topic.id,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/ndjson/);
    const ev = await readNdjson(res);
    const types = ev.map((e) => e.t);
    expect(types).toContain("meta");
    expect(types.at(-1)).toBe("done");
    expect(types.indexOf("meta")).toBeLessThan(types.indexOf("delta"));
    expect(ev.filter((e) => e.t === "delta").map((e) => e.x).join("")).toBe("Merhaba! Bu, test sunucusunun sabit yanıtıdır. [K1]");
    const meta = ev.find((e) => e.t === "meta") as unknown as { grounding: string; note: string | null; labels: Record<string, { pages?: number[]; url?: string }>; topicId: string };
    expect(meta.topicId).toBe(topic.id);
    // Kitap sayfalarına ulaşıldıysa 'textbook', ulaşılamadıysa dürüstçe 'general' + açıklama notu
    expect(["textbook", "general"]).toContain(meta.grounding);
    if (meta.grounding === "general") expect(meta.note).toBeTruthy();
    else expect(meta.labels.K1.url).toMatch(/^https:\/\/tymm\.meb\.gov\.tr\/.+\.pdf#page=\d+$/);
    console.info(`[bilgi] tutor grounding=${meta.grounding}`);

    const sent = mock.requests.slice(before).at(-1)!.body as { model: string; stream: boolean; system: { cache_control?: unknown; text: string }[]; messages: { content: string }[]; output_config: { effort: string } };
    expect(sent.model).toBe("claude-sonnet-5-5");
    expect(sent.stream).toBe(true);
    expect(sent.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(sent.output_config.effort).toBe("low");
    expect(sent.messages.at(-1)!.content).toContain("ÖĞRENCİ MESAJI");
    if (meta.grounding === "textbook") expect(sent.messages.at(-1)!.content).toContain("[K1]");
  });
  it("kullanıcı materyali varsa 'user-material' olarak etiketler ve kitap seçili değilse kitaba dayalı demez", async () => {
    const res = await post(app, "/api/ai/tutor", {
      messages: [{ role: "user", content: "Notumu özetler misin" }],
      mode: "konu",
      materials: [{ title: "Notum", text: "Hücre zarı seçici geçirgendir ve madde geçişini kontrol eder. ".repeat(3), type: "note", recordId: "n1" }],
    });
    const meta = (await readNdjson(res)).find((e) => e.t === "meta") as unknown as { grounding: string };
    expect(meta.grounding).toBe("user-material");
  });
  it("kitap/materyal yoksa 'general' ve açıklayıcı not verir", async () => {
    const meta = (await readNdjson(await post(app, "/api/ai/tutor", { messages: [{ role: "user", content: "Merhaba" }] }))).find((e) => e.t === "meta") as unknown as { grounding: string; note: string };
    expect(meta.grounding).toBe("general");
    expect(meta.note).toMatch(/genel müfredat/i);
  });
  it("modelin reddini ve kesilmeyi kullanıcıya doğru bildirir", async () => {
    const refused = await readNdjson(await post(app, "/api/ai/tutor", { messages: [{ role: "user", content: "__REFUSE__" }] }));
    expect(refused.at(-1)).toMatchObject({ t: "error", code: "refusal" });
    const cut = await readNdjson(await post(app, "/api/ai/tutor", { messages: [{ role: "user", content: "__TRUNC__" }] }));
    expect(cut.at(-1)).toMatchObject({ t: "done", truncated: true });
  });
  it("istemcide geçersiz kitap kimliklerini ve rol tahrifini yok sayar", async () => {
    const res = await post(app, "/api/ai/tutor", { messages: [{ role: "user", content: "selam" }], bookIds: [999999, "x", -1], mode: "çılgın" });
    expect(res.status).toBe(200);
    expect((await readNdjson(res)).at(-1)?.t).toBe("done");
  });
});

describe("soru üretimi ve doğrulama hattı", () => {
  it("hatalı soruları eler, geri kalanı 'yapay zekâ üretimi' + gerçek kontrol sonuçlarıyla etiketler", async () => {
    const r = await post(app, "/api/ai/exam", { grade: 9, examKind: "topic", plan: [{ subjectId: "matematik", topicIds: [topic.id] }], bookIds: [mat9.id], count: 5, difficulty: "kolay", types: ["mcq"] });
    expect(r.status).toBe(200);
    const j = (await r.json()) as { questions: { provenance: string; checks: { calc: string; crossCheck: string }; choices: string[]; answerIndex: number; topicId: string }[]; generation: { requested: number; kept: number; dropped: { reason: string }[] } };
    expect(j.questions.length).toBe(j.generation.kept);
    expect(j.questions.length).toBeGreaterThanOrEqual(3);
    const reasons = j.generation.dropped.map((d) => d.reason).join(" | ");
    expect(reasons).toMatch(/Hesap kontrolü/); // yanlış calcExpr
    expect(reasons).toMatch(/Belirsiz seçenek/); // "Hepsi doğru"
    expect(reasons).toMatch(/Benzer soru/); // tekrar
    expect(reasons).toMatch(/Bağımsız çözüm/); // çapraz kontrol uyuşmazlığı
    for (const q of j.questions) {
      expect(q.provenance).toBe("ai-generated");
      expect(q.checks).toEqual({ structure: true, calc: "passed", crossCheck: "passed" });
      expect(q.topicId).toBe(topic.id);
      expect(q.choices).toHaveLength(4);
    }
    // Üretim ve çapraz kontrol farklı model sınıflarıyla yapıldı
    const models = mock.requests.slice(-4).map((x) => (x.body as { model: string }).model);
    expect(models).toContain("claude-sonnet-5-5");
    expect(models).toContain("claude-haiku-5-5");
  });
  it("hızlı test uç noktası doğrulanmış soruları döndürür", async () => {
    const r = await post(app, "/api/ai/quiz", { grade: 9, subjectId: "matematik", topicId: topic.id, bookIds: [mat9.id], count: 3 });
    expect(r.status).toBe(200);
    const j = (await r.json()) as { questions: { provenance: string }[] };
    expect(j.questions.length).toBeGreaterThanOrEqual(1);
    expect(j.questions.every((q) => q.provenance === "ai-generated")).toBe(true);
  });
});

describe("özet ve OCR", () => {
  it("özeti şemaya göre döndürür ve kaynakları listeler", async () => {
    const r = await post(app, "/api/ai/summary", { grade: 9, subjectId: "matematik", topicIds: [topic.id], materials: [], sections: ["quick", "keyConcepts"] });
    expect(r.status).toBe(200);
    const j = (await r.json()) as { content: { quick?: string[]; keyConcepts?: unknown[]; formulas?: unknown }; grounding: string; sources: { type: string; label: string }[] };
    expect(j.content.quick?.length).toBeGreaterThan(0);
    expect(j.content.keyConcepts?.length).toBeGreaterThan(0);
    expect(j.content.formulas).toBeUndefined(); // istenmeyen bölüm eklenmez
    expect(["textbook", "general"]).toContain(j.grounding);
    expect(j.sources.some((s) => s.type === "textbook")).toBe(true);
  });
  it("OCR istenen görsel sayısı kadar sayfa döndürür", async () => {
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const r = await post(app, "/api/ai/ocr", { images: [{ mime: "image/png", data: png }] });
    expect(r.status).toBe(200);
    const j = (await r.json()) as { pages: { index: number; text: string }[] };
    expect(j.pages).toHaveLength(1);
    const sent = mock.requests.at(-1)!.body as { model: string; messages: { content: { type: string }[] }[] };
    expect(sent.model).toBe("claude-haiku-5-5");
    expect(sent.messages[0].content[0].type).toBe("image");
  });
});

describe("üst servis hataları", () => {
  it("servis sınırına takılırsa kullanıcıya 429 olarak yansıtır", async () => {
    const r = await post(app, "/api/ai/summary", { grade: 9, subjectId: null, topicIds: [], materials: [{ title: "N", text: "__RATE__ ".repeat(20), type: "note" }], sections: ["quick"] });
    expect(r.status).toBe(429);
    expect((await r.json()).error).toBe("rate_limited");
  }, 60_000);
});
