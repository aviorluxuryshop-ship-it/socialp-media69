import Anthropic from "@anthropic-ai/sdk";

/** Varsayılanlar maliyet için: öğretmen = Sonnet sınıfı, hafif görevler = Haiku sınıfı. Ortam değişkeniyle değiştirilebilir. */
export const MODELS = {
  tutor: process.env.STUDYFLOW_MODEL_TUTOR || "claude-sonnet-5-5",
  fast: process.env.STUDYFLOW_MODEL_FAST || "claude-haiku-5-5",
};

export type Effort = "low" | "medium" | "high";

export class AiError extends Error {
  constructor(
    public code: "unconfigured" | "refusal" | "truncated" | "rate_limited" | "upstream" | "invalid",
    message: string,
  ) {
    super(message);
  }
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!aiConfigured()) throw new AiError("unconfigured", "Yapay zekâ bu sürümde yapılandırılmamış.");
  _client ??= new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    maxRetries: 2,
    timeout: 110_000,
  });
  return _client;
}

function logUsage(model: string, kind: string, u: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number | null } | undefined) {
  // Maliyet gözlemi için: içerik değil yalnızca sayaçlar
  console.info(JSON.stringify({ evt: "ai_usage", kind, model, in: u?.input_tokens ?? 0, out: u?.output_tokens ?? 0, cacheRead: u?.cache_read_input_tokens ?? 0 }));
}

function mapError(e: unknown): never {
  if (e instanceof AiError) throw e;
  if (e instanceof Anthropic.RateLimitError) throw new AiError("rate_limited", "Yapay zekâ servisi şu an yoğun. Birkaç saniye sonra tekrar dene.");
  if (e instanceof Anthropic.AuthenticationError) throw new AiError("upstream", "Yapay zekâ anahtarı geçersiz görünüyor. Yöneticiye bildir.");
  if (e instanceof Anthropic.BadRequestError) throw new AiError("invalid", "İstek yapay zekâ tarafından kabul edilmedi.");
  if (e instanceof Anthropic.APIError) throw new AiError("upstream", "Yapay zekâ servisine ulaşılamadı. Biraz sonra tekrar dene.");
  throw new AiError("upstream", "Yapay zekâ yanıtı alınamadı.");
}

export interface TextBlockInput {
  text: string;
  /** Kararlı (tekrar eden) bölümler önbelleğe alınır */
  cache?: boolean;
}

function systemBlocks(parts: TextBlockInput[]): Anthropic.TextBlockParam[] {
  return parts.map((p) => ({ type: "text", text: p.text, ...(p.cache ? { cache_control: { type: "ephemeral" as const } } : {}) }));
}

/** Akışlı metin üretimi. Parçaları üretir; sonunda kesilme bilgisini döndürür. */
export async function* streamText(opts: {
  model: string;
  system: TextBlockInput[];
  messages: Anthropic.MessageParam[];
  maxTokens: number;
  effort: Effort;
  signal?: AbortSignal;
}): AsyncGenerator<string, { truncated: boolean }> {
  try {
    const stream = client().messages.stream(
      {
        model: opts.model,
        max_tokens: opts.maxTokens,
        system: systemBlocks(opts.system),
        messages: opts.messages,
        output_config: { effort: opts.effort },
      },
      { signal: opts.signal },
    );
    for await (const ev of stream) {
      if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") yield ev.delta.text;
    }
    const final = await stream.finalMessage();
    logUsage(opts.model, "stream", final.usage);
    if (final.stop_reason === "refusal") throw new AiError("refusal", "Bu isteğe yanıt veremedim. Soruyu farklı bir şekilde sormayı dene.");
    return { truncated: final.stop_reason === "max_tokens" };
  } catch (e) {
    mapError(e);
  }
}

/** Şemaya uyan JSON üretimi (yapılandırılmış çıktı). */
export async function jsonCall<T>(opts: {
  model: string;
  system: TextBlockInput[];
  content: Anthropic.MessageParam["content"];
  schema: Record<string, unknown>;
  maxTokens: number;
  effort: Effort;
  kind: string;
  signal?: AbortSignal;
}): Promise<T> {
  try {
    const res = await client().messages.create(
      {
        model: opts.model,
        max_tokens: opts.maxTokens,
        system: systemBlocks(opts.system),
        messages: [{ role: "user", content: opts.content }],
        output_config: { effort: opts.effort, format: { type: "json_schema", schema: opts.schema } },
      },
      { signal: opts.signal },
    );
    logUsage(opts.model, opts.kind, res.usage);
    if (res.stop_reason === "refusal") throw new AiError("refusal", "Bu isteğe yanıt veremedim. İçeriği veya konuyu değiştirip tekrar dene.");
    if (res.stop_reason === "max_tokens") throw new AiError("truncated", "Yanıt çok uzun olduğu için yarım kaldı. Daha az öğe isteyerek tekrar dene.");
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new AiError("invalid", "Yapay zekâ geçerli bir yanıt üretemedi. Tekrar dene.");
    }
  } catch (e) {
    mapError(e);
  }
}
