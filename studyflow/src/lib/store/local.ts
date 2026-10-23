import type { RecordKind, RecordOf } from "@/lib/types";
import type { ListOptions, Store } from "./types";

const DB_NAME = "studyflow";
const REC = "records";
const FILES = "files";

type Row = { key: string; kind: RecordKind; updatedAt: number; rec: unknown };

/** Tarayıcı IndexedDB'sini kullanır; kullanılamazsa (gizli sekme vb.) bellek içi çalışır ve bunu bildirir. */
export class LocalStore implements Store {
  readonly mode = "local" as const;
  private dbp: Promise<IDBDatabase | null> | null = null;
  private mem = new Map<string, Row>();
  private memFiles = new Map<string, Blob>();
  /** Kalıcı depolama gerçekten çalışıyor mu? */
  persistent = true;

  private db(): Promise<IDBDatabase | null> {
    if (this.dbp) return this.dbp;
    this.dbp = new Promise((resolve) => {
      try {
        if (typeof indexedDB === "undefined") throw new Error("no idb");
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          const s = db.createObjectStore(REC, { keyPath: "key" });
          s.createIndex("kind", "kind");
          db.createObjectStore(FILES);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          this.persistent = false;
          resolve(null);
        };
        req.onblocked = () => resolve(null);
      } catch {
        this.persistent = false;
        resolve(null);
      }
    });
    return this.dbp;
  }

  private tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return this.db().then(
      (db) =>
        new Promise<T>((resolve, reject) => {
          if (!db) return reject(new Error("idb-unavailable"));
          const r = run(db.transaction(store, mode).objectStore(store));
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        }),
    );
  }

  async list<K extends RecordKind>(kind: K, opts: ListOptions = {}): Promise<RecordOf<K>[]> {
    let rows: Row[];
    try {
      rows = await this.tx<Row[]>(REC, "readonly", (s) => s.index("kind").getAll(kind) as IDBRequest<Row[]>);
    } catch {
      this.persistent = false;
      rows = [...this.mem.values()].filter((r) => r.kind === kind);
    }
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    const off = opts.offset ?? 0;
    const slice = opts.limit ? rows.slice(off, off + opts.limit) : rows.slice(off);
    return slice.map((r) => r.rec as RecordOf<K>);
  }

  async get<K extends RecordKind>(kind: K, id: string): Promise<RecordOf<K> | null> {
    const key = `${kind}:${id}`;
    try {
      const row = await this.tx<Row | undefined>(REC, "readonly", (s) => s.get(key) as IDBRequest<Row | undefined>);
      return (row?.rec as RecordOf<K>) ?? null;
    } catch {
      return (this.mem.get(key)?.rec as RecordOf<K>) ?? null;
    }
  }

  async put<K extends RecordKind>(rec: RecordOf<K>): Promise<void> {
    const row: Row = { key: `${rec.kind}:${rec.id}`, kind: rec.kind, updatedAt: rec.updatedAt, rec };
    try {
      await this.tx(REC, "readwrite", (s) => s.put(row));
    } catch {
      this.persistent = false;
      this.mem.set(row.key, row);
    }
  }

  async remove(kind: RecordKind, id: string): Promise<void> {
    const key = `${kind}:${id}`;
    this.mem.delete(key);
    try {
      await this.tx(REC, "readwrite", (s) => s.delete(key));
    } catch {
      /* bellek içi kayıt zaten silindi */
    }
  }

  async count(kind: RecordKind): Promise<number> {
    try {
      return await this.tx<number>(REC, "readonly", (s) => s.index("kind").count(kind));
    } catch {
      return [...this.mem.values()].filter((r) => r.kind === kind).length;
    }
  }

  async putFile(id: string, file: Blob): Promise<string> {
    try {
      await this.tx(FILES, "readwrite", (s) => s.put(file, id));
    } catch {
      this.memFiles.set(id, file);
    }
    return id;
  }
  async getFile(id: string): Promise<Blob | null> {
    try {
      return ((await this.tx(FILES, "readonly", (s) => s.get(id))) as Blob | undefined) ?? this.memFiles.get(id) ?? null;
    } catch {
      return this.memFiles.get(id) ?? null;
    }
  }
  async removeFile(id: string): Promise<void> {
    this.memFiles.delete(id);
    try {
      await this.tx(FILES, "readwrite", (s) => s.delete(id));
    } catch {
      /* yok say */
    }
  }

  /** Bu cihazdaki tüm kayıtları döker (hesaba aktarma / silme için) */
  async dumpAll(): Promise<{ rec: Row["rec"]; kind: RecordKind }[]> {
    try {
      const rows = await this.tx<Row[]>(REC, "readonly", (s) => s.getAll() as IDBRequest<Row[]>);
      return rows.map((r) => ({ rec: r.rec, kind: r.kind }));
    } catch {
      return [...this.mem.values()].map((r) => ({ rec: r.rec, kind: r.kind }));
    }
  }
  async clearAll(): Promise<void> {
    this.mem.clear();
    this.memFiles.clear();
    try {
      await this.tx(REC, "readwrite", (s) => s.clear());
      await this.tx(FILES, "readwrite", (s) => s.clear());
    } catch {
      /* yok say */
    }
  }
}
