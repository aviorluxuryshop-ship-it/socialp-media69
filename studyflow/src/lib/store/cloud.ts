import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecordKind, RecordOf } from "@/lib/types";
import type { ListOptions, Store } from "./types";

const BUCKET = "uploads";

interface Row {
  id: string;
  kind: RecordKind;
  data: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

const fromRow = <K extends RecordKind>(r: Row): RecordOf<K> =>
  ({ ...r.data, id: r.id, kind: r.kind, createdAt: r.created_at, updatedAt: r.updated_at }) as unknown as RecordOf<K>;

function fail(op: string, error: { message: string } | null): never {
  throw new Error(`${op}: ${error?.message ?? "bilinmeyen hata"}`);
}

/** Supabase (Postgres + RLS + Storage). Her satır `user_id = auth.uid()` ile korunur. */
export class CloudStore implements Store {
  readonly mode = "cloud" as const;
  constructor(
    private sb: SupabaseClient,
    private userId: string,
  ) {}

  async list<K extends RecordKind>(kind: K, opts: ListOptions = {}): Promise<RecordOf<K>[]> {
    const limit = opts.limit ?? 500;
    const off = opts.offset ?? 0;
    const { data, error } = await this.sb
      .from("records")
      .select("id,kind,data,created_at,updated_at")
      .eq("kind", kind)
      .order("updated_at", { ascending: false })
      .range(off, off + limit - 1);
    if (error) fail("Kayıtlar okunamadı", error);
    return (data as Row[]).map((r) => fromRow<K>(r));
  }

  async get<K extends RecordKind>(kind: K, id: string): Promise<RecordOf<K> | null> {
    const { data, error } = await this.sb.from("records").select("id,kind,data,created_at,updated_at").eq("kind", kind).eq("id", id).maybeSingle();
    if (error) fail("Kayıt okunamadı", error);
    return data ? fromRow<K>(data as Row) : null;
  }

  async put<K extends RecordKind>(rec: RecordOf<K>): Promise<void> {
    const { id, kind, createdAt, updatedAt, ...data } = rec as unknown as { id: string; kind: RecordKind; createdAt: number; updatedAt: number } & Record<string, unknown>;
    const { error } = await this.sb
      .from("records")
      .upsert({ id, kind, data, created_at: createdAt, updated_at: updatedAt, user_id: this.userId }, { onConflict: "user_id,id" });
    if (error) fail("Kayıt kaydedilemedi", error);
  }

  async remove(kind: RecordKind, id: string): Promise<void> {
    const { error } = await this.sb.from("records").delete().eq("kind", kind).eq("id", id);
    if (error) fail("Kayıt silinemedi", error);
  }

  async count(kind: RecordKind): Promise<number> {
    const { count, error } = await this.sb.from("records").select("id", { count: "exact", head: true }).eq("kind", kind);
    if (error) fail("Sayım yapılamadı", error);
    return count ?? 0;
  }

  async putFile(id: string, file: Blob): Promise<string> {
    const path = `${this.userId}/${id}`;
    const { error } = await this.sb.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
    if (error) fail("Dosya yüklenemedi", error);
    return path;
  }
  async getFile(path: string): Promise<Blob | null> {
    const { data, error } = await this.sb.storage.from(BUCKET).download(path);
    if (error) return null;
    return data;
  }
  async removeFile(path: string): Promise<void> {
    await this.sb.storage.from(BUCKET).remove([path]);
  }
}
