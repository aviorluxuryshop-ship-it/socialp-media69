// Kalıcı depo. Üretimde Neon Postgres (Vercel'de DATABASE_URL), geliştirmede bellek içi depo.
import { neon } from "@neondatabase/serverless";
import { promises as fs } from "node:fs";
import path from "node:path";
import { buildDemoData } from "@/lib/seed";
import type { Appointment, Customer } from "@/lib/types";
import { istanbulNow, toRows, type RecordKind, type Row } from "./records";

export interface Db {
  version(): Promise<{ version: number; epoch: string }>;
  all(): Promise<Row[]>;
  byKinds(kinds: RecordKind[]): Promise<Row[]>;
  changes(since: number): Promise<Row[]>;
  get<T>(kind: RecordKind, id: string): Promise<T | null>;
  apptsByStaff(staffId: string, date?: string): Promise<Appointment[]>;
  customersByIds(ids: string[]): Promise<Customer[]>;
  upsert(kind: RecordKind, id: string, data: unknown): Promise<void>;
  remove(kind: RecordKind, id: string): Promise<void>;
  removeApptsOfCustomer(customerId: string): Promise<void>;
  replaceAll(rows: Row[]): Promise<void>;
  authGet<T>(key: string): Promise<T | null>;
  authSet(key: string, value: unknown): Promise<void>;
  authDel(key: string): Promise<void>;
}

export class DbNotConfigured extends Error {
  constructor() {
    super("Veritabanı bağlı değil. Vercel → proje → Storage bölümünden Neon veritabanını bağlayın.");
  }
}

export function newEpoch() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function demoRows(): Row[] {
  const { today, minutes } = istanbulNow();
  return toRows(buildDemoData(today, minutes), { demo: true, epoch: newEpoch() });
}

/* ───────── Neon Postgres ───────── */

class PgDb implements Db {
  private sql;
  private ready: Promise<void> | null = null;
  constructor(url: string) {
    this.sql = neon(url);
  }

  private q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
    return this.ensure().then(() => this.sql.query(text, params) as Promise<T[]>);
  }

  ensure(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        const s = this.sql;
        await s.query(`create table if not exists mp_records (
          kind text not null, id text not null, data jsonb not null,
          rev bigint not null, deleted boolean not null default false,
          primary key (kind, id))`);
        await s.query(`create index if not exists mp_records_rev on mp_records (rev)`);
        await s.query(`create sequence if not exists mp_rev_seq`);
        await s.query(`create table if not exists mp_auth (key text primary key, value jsonb not null, updated_at timestamptz not null default now())`);
        const has = (await s.query(`select 1 from mp_records where kind = 'meta' limit 1`)) as unknown[];
        if (!has.length) await this.writeAll(demoRows());
      })().catch((e) => {
        this.ready = null;
        throw e;
      });
    }
    return this.ready;
  }

  async version() {
    const [r] = await this.q<{ v: string; e: string | null }>(
      `select (select coalesce(max(rev), 0) from mp_records)::text as v,
              (select data->>'epoch' from mp_records where kind = 'meta' and id = 'main') as e`,
    );
    return { version: Number(r?.v ?? 0), epoch: r?.e ?? "" };
  }
  all() {
    return this.q<Row>(`select kind, id, data from mp_records where not deleted`);
  }
  byKinds(kinds: RecordKind[]) {
    return this.q<Row>(`select kind, id, data from mp_records where not deleted and kind = any($1::text[])`, [kinds]);
  }
  changes(since: number) {
    return this.q<Row>(`select kind, id, data, deleted from mp_records where rev > $1`, [since]);
  }
  async get<T>(kind: RecordKind, id: string) {
    const [r] = await this.q<{ data: T }>(`select data from mp_records where kind = $1 and id = $2 and not deleted`, [kind, id]);
    return r?.data ?? null;
  }
  async apptsByStaff(staffId: string, date?: string) {
    const rows = date
      ? await this.q<{ data: Appointment }>(`select data from mp_records where kind = 'appt' and not deleted and data->>'staffId' = $1 and data->>'date' = $2`, [staffId, date])
      : await this.q<{ data: Appointment }>(`select data from mp_records where kind = 'appt' and not deleted and data->>'staffId' = $1`, [staffId]);
    return rows.map((r) => r.data);
  }
  async customersByIds(ids: string[]) {
    if (!ids.length) return [];
    const rows = await this.q<{ data: Customer }>(`select data from mp_records where kind = 'customer' and not deleted and id = any($1::text[])`, [ids]);
    return rows.map((r) => r.data);
  }
  async upsert(kind: RecordKind, id: string, data: unknown) {
    await this.q(
      `insert into mp_records (kind, id, data, rev, deleted) values ($1, $2, $3::jsonb, nextval('mp_rev_seq'), false)
       on conflict (kind, id) do update set data = excluded.data, rev = excluded.rev, deleted = false`,
      [kind, id, JSON.stringify(data)],
    );
  }
  async remove(kind: RecordKind, id: string) {
    await this.q(`update mp_records set deleted = true, rev = nextval('mp_rev_seq') where kind = $1 and id = $2 and not deleted`, [kind, id]);
  }
  async removeApptsOfCustomer(customerId: string) {
    await this.q(`update mp_records set deleted = true, rev = nextval('mp_rev_seq') where kind = 'appt' and not deleted and data->>'customerId' = $1`, [customerId]);
  }
  private async writeAll(rows: Row[]) {
    const payload = JSON.stringify(rows.map((r) => ({ k: r.kind, i: r.id, d: r.data })));
    await this.sql.transaction([
      this.sql.query(`select pg_advisory_xact_lock(7461)`),
      this.sql.query(`delete from mp_records`),
      this.sql.query(
        `insert into mp_records (kind, id, data, rev, deleted)
         select r->>'k', r->>'i', r->'d', nextval('mp_rev_seq'), false from jsonb_array_elements($1::jsonb) r`,
        [payload],
      ),
    ]);
  }
  async replaceAll(rows: Row[]) {
    await this.ensure();
    await this.writeAll(rows);
  }
  async authGet<T>(key: string) {
    const [r] = await this.q<{ value: T }>(`select value from mp_auth where key = $1`, [key]);
    return r?.value ?? null;
  }
  async authSet(key: string, value: unknown) {
    await this.q(`insert into mp_auth (key, value) values ($1, $2::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now()`, [key, JSON.stringify(value)]);
  }
  async authDel(key: string) {
    await this.q(`delete from mp_auth where key = $1`, [key]);
  }
}

/* ───────── Geliştirme deposu (bellek + .data/dev-db.json) ───────── */

interface MemRow extends Row {
  rev: number;
}

class MemDb implements Db {
  private rows = new Map<string, MemRow>();
  private auth = new Map<string, unknown>();
  private rev = 0;
  private loaded: Promise<void> | null = null;
  private file = path.join(process.cwd(), ".data", "dev-db.json");

  private load() {
    if (!this.loaded) {
      this.loaded = (async () => {
        try {
          const j = JSON.parse(await fs.readFile(this.file, "utf8"));
          this.rev = j.rev;
          for (const r of j.rows as MemRow[]) this.rows.set(`${r.kind}|${r.id}`, r);
          for (const [k, v] of Object.entries(j.auth ?? {})) this.auth.set(k, v);
        } catch {
          this.setAll(demoRows());
        }
      })();
    }
    return this.loaded;
  }
  private async save() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify({ rev: this.rev, rows: [...this.rows.values()], auth: Object.fromEntries(this.auth) }));
  }
  private setAll(rows: Row[]) {
    this.rows.clear();
    for (const r of rows) this.rows.set(`${r.kind}|${r.id}`, { ...r, deleted: false, rev: ++this.rev });
  }
  private live() {
    return [...this.rows.values()].filter((r) => !r.deleted);
  }

  async version() {
    await this.load();
    const meta = this.rows.get("meta|main");
    return { version: this.rev, epoch: (meta?.data as { epoch?: string })?.epoch ?? "" };
  }
  async all() {
    await this.load();
    return this.live().map(({ kind, id, data }) => ({ kind, id, data }));
  }
  async byKinds(kinds: RecordKind[]) {
    await this.load();
    return this.live()
      .filter((r) => kinds.includes(r.kind))
      .map(({ kind, id, data }) => ({ kind, id, data }));
  }
  async changes(since: number) {
    await this.load();
    return [...this.rows.values()].filter((r) => r.rev > since).map(({ kind, id, data, deleted }) => ({ kind, id, data, deleted }));
  }
  async get<T>(kind: RecordKind, id: string) {
    await this.load();
    const r = this.rows.get(`${kind}|${id}`);
    return r && !r.deleted ? (r.data as T) : null;
  }
  async apptsByStaff(staffId: string, date?: string) {
    await this.load();
    return this.live()
      .filter((r) => r.kind === "appt")
      .map((r) => r.data as Appointment)
      .filter((a) => a.staffId === staffId && (!date || a.date === date));
  }
  async customersByIds(ids: string[]) {
    await this.load();
    const set = new Set(ids);
    return this.live()
      .filter((r) => r.kind === "customer" && set.has(r.id))
      .map((r) => r.data as Customer);
  }
  async upsert(kind: RecordKind, id: string, data: unknown) {
    await this.load();
    this.rows.set(`${kind}|${id}`, { kind, id, data, deleted: false, rev: ++this.rev });
    await this.save();
  }
  async remove(kind: RecordKind, id: string) {
    await this.load();
    const r = this.rows.get(`${kind}|${id}`);
    if (r && !r.deleted) {
      r.deleted = true;
      r.rev = ++this.rev;
      await this.save();
    }
  }
  async removeApptsOfCustomer(customerId: string) {
    await this.load();
    for (const r of this.rows.values()) {
      if (r.kind === "appt" && !r.deleted && (r.data as Appointment).customerId === customerId) {
        r.deleted = true;
        r.rev = ++this.rev;
      }
    }
    await this.save();
  }
  async replaceAll(rows: Row[]) {
    await this.load();
    this.setAll(rows);
    await this.save();
  }
  async authGet<T>(key: string) {
    await this.load();
    return (this.auth.get(key) as T) ?? null;
  }
  async authSet(key: string, value: unknown) {
    await this.load();
    this.auth.set(key, value);
    await this.save();
  }
  async authDel(key: string) {
    await this.load();
    this.auth.delete(key);
    await this.save();
  }
}

let instance: Db | null = null;

export function getDb(): Db {
  if (instance) return instance;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) instance = new PgDb(url);
  else if (process.env.VERCEL) throw new DbNotConfigured();
  else instance = new MemDb();
  return instance;
}
