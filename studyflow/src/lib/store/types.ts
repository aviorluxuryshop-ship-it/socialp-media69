import type { RecordKind, RecordOf } from "@/lib/types";

export interface ListOptions {
  limit?: number;
  offset?: number;
}

/** Kalıcı depo. Yerel (IndexedDB) ve bulut (Supabase) aynı sözleşmeyi uygular. */
export interface Store {
  readonly mode: "local" | "cloud";
  list<K extends RecordKind>(kind: K, opts?: ListOptions): Promise<RecordOf<K>[]>;
  get<K extends RecordKind>(kind: K, id: string): Promise<RecordOf<K> | null>;
  put<K extends RecordKind>(rec: RecordOf<K>): Promise<void>;
  remove(kind: RecordKind, id: string): Promise<void>;
  count(kind: RecordKind): Promise<number>;
  putFile(id: string, file: Blob): Promise<string>;
  getFile(idOrPath: string): Promise<Blob | null>;
  removeFile(idOrPath: string): Promise<void>;
}
