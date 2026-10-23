// Anthropic Messages API taklidi — yalnızca sunucu uçlarının tesisatını (istek biçimi, akış, doğrulama hattı,
// hata yolları) sınamak içindir. Yanıtların kalitesi hakkında HİÇBİR şey söylemez; gerçek model kullanılmaz.
import http from "node:http";

const MODEL_TEXT = "Merhaba! Bu, test sunucusunun sabit yanıtıdır. [K1]";

function sse(res, events) {
  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
  for (const [name, data] of events) res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
  res.end();
}

function streamEvents(text, stop = "end_turn") {
  const chunks = text.match(/.{1,12}/gs) ?? [""];
  return [
    ["message_start", { type: "message_start", message: { id: "msg_mock", type: "message", role: "assistant", model: "mock", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 25, output_tokens: 1 } } }],
    ["content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }],
    ...chunks.map((c) => ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: c } }]),
    ["content_block_stop", { type: "content_block_stop", index: 0 }],
    ["message_delta", { type: "message_delta", delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 30 } }],
    ["message_stop", { type: "message_stop" }],
  ];
}

const message = (text, stop = "end_turn") => ({ id: "msg_mock", type: "message", role: "assistant", model: "mock", content: [{ type: "text", text }], stop_reason: stop, stop_sequence: null, usage: { input_tokens: 100, output_tokens: 50 } });

function userText(body) {
  const m = body.messages?.at(-1);
  if (!m) return "";
  return typeof m.content === "string" ? m.content : m.content.map((b) => (b.type === "text" ? b.text : "")).join("\n");
}

const NOUNS = ["bisikletli", "tren", "kayık", "koşucu", "uçak", "gemi", "yüzücü", "atlet", "araba", "kuş", "kamyon", "paraşüt"];
const EXTRA = ["sakin", "rüzgârlı", "yokuşlu", "düz", "kumlu", "sisli", "karlı", "ılık", "parlak", "gölgeli", "engebeli", "ıslak"];
const ADV = ["yavaşça", "aniden", "dikkatle", "sessizce", "hızlıca", "temkinle", "isteyerek", "tereddütle", "coşkuyla", "yorgunca", "gururla", "usulca"];

function generateQuestions(body) {
  const text = userText(body);
  const topicId = text.match(/^- (b\d+-t[\d.]+):/m)?.[1] ?? "x";
  const n = Number(text.match(/İstenen: (\d+) soru/)?.[1] ?? 5);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = 3 + i;
    const b = 4 + (i % 5);
    const right = a * b;
    const wrong = [a + b, right + 3, right - 2];
    const pos = i % 4;
    const choices = [...wrong.slice(0, pos), right, ...wrong.slice(pos)].map(String);
    const flags = i === 4 ? " [X]" : "";
    let q = {
      type: "mcq",
      stem: `${NOUNS[i % 12]} ${EXTRA[i % 12]} yolda ${ADV[(i * 5) % 12]} sabit ${a} m/s hızla ${b} saniye boyunca giderse toplam kaç metre yol alır?${flags}`,
      choices,
      answerIndex: pos,
      answerText: "",
      rubric: [],
      explanation: `Yol, hız ile zamanın çarpımıdır; ${a} × ${b} = ${right} metre bulunur ve toplama yapmak yaygın bir hatadır.`,
      commonMistake: "Hız ile zamanı toplamak",
      choiceTags: choices.map((_, k) => (k === pos ? "" : "işlem hatası")),
      topicId,
      difficulty: "kolay",
      calcExpr: `${a}*${b}`,
      sourcePage: 0,
    };
    if (i === 1) q = { ...q, calcExpr: `${a}*${b}+1` }; // hesap kontrolü yakalamalı
    if (i === 2) q = { ...q, choices: q.choices.map((c, k) => (k === (pos + 1) % 4 ? "Hepsi doğru" : c)) }; // belirsiz seçenek
    if (i === 3) q = { ...q, stem: out[0].stem }; // tekrar
    out.push(q);
  }
  return { questions: out };
}

function solveQuestions(body) {
  const list = JSON.parse(userText(body));
  return {
    answers: list.map((q) => {
      const m = q.stem.match(/(\d+) m\/s hızla (\d+) saniye/);
      const idx = m ? q.choices.indexOf(String(Number(m[1]) * Number(m[2]))) : 0;
      if (q.stem.includes("[AMB]")) return { id: q.id, answerIndex: idx, ambiguous: true };
      return { id: q.id, answerIndex: q.stem.includes("[X]") ? (idx + 1) % q.choices.length : idx, ambiguous: false };
    }),
  };
}

function fromSchema(s) {
  if (!s || typeof s !== "object") return null;
  if (s.type === "object") return Object.fromEntries(Object.entries(s.properties ?? {}).map(([k, v]) => [k, fromSchema(v)]));
  if (s.type === "array") return [fromSchema(s.items), fromSchema(s.items)].filter((x) => x !== null);
  if (s.type === "integer") return 0;
  if (s.type === "boolean") return true;
  return "örnek metin";
}

export function startMock(port) {
  const requests = [];
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (d) => (raw += d));
    req.on("end", () => {
      if (req.method === "GET" && req.url === "/__requests") {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify(requests));
      }
      if (req.method !== "POST" || !req.url?.startsWith("/v1/messages")) {
        res.writeHead(404);
        return res.end("{}");
      }
      const body = JSON.parse(raw || "{}");
      requests.push({ headers: { "x-api-key": req.headers["x-api-key"] }, body });
      const text = userText(body);
      if (text.includes("__RATE__")) {
        res.writeHead(429, { "content-type": "application/json", "retry-after": "0" });
        return res.end(JSON.stringify({ type: "error", error: { type: "rate_limit_error", message: "slow down" } }));
      }
      const refuse = text.includes("__REFUSE__");
      if (body.stream) return sse(res, streamEvents(refuse ? "" : text.includes("__TRUNC__") ? "Yarım kalan yanıt" : MODEL_TEXT, refuse ? "refusal" : text.includes("__TRUNC__") ? "max_tokens" : "end_turn"));
      const schema = body.output_config?.format?.schema;
      let payload;
      if (schema?.required?.includes("questions")) payload = generateQuestions(body);
      else if (schema?.required?.includes("answers")) payload = solveQuestions(body);
      else payload = fromSchema(schema);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(message(JSON.stringify(payload), refuse ? "refusal" : "end_turn")));
    });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve({ close: () => new Promise((r) => server.close(r)), requests })));
}
