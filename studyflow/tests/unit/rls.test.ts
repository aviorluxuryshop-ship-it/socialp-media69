// Veritabanı yetkilendirme testi: gerçek migration SQL'i gerçek bir Postgres (PGlite) üzerinde çalıştırılır.
// Supabase'e özgü auth/storage nesneleri yalnızca test için taklit edilir; RLS ilkeleri migration'dan gelir.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

let db: PGlite;

async function as(user: string | null, fn: () => Promise<void>) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user ?? ""]);
  await db.exec(`set role ${user ? "authenticated" : "anon"}`);
  try {
    await fn();
  } finally {
    await db.exec("reset role");
  }
}
const rec = (id: string, kind = "note", extra: Record<string, unknown> = {}) => ({ id, kind, data: JSON.stringify({ title: id, ...extra }) });
const insert = (r: { id: string; kind: string; data: string }, userId?: string) =>
  userId
    ? db.query(`insert into public.records (user_id,id,kind,data,created_at,updated_at) values ($1,$2,$3,$4::jsonb,1,1)`, [userId, r.id, r.kind, r.data])
    : db.query(`insert into public.records (id,kind,data,created_at,updated_at) values ($1,$2,$3::jsonb,1,1)`, [r.id, r.kind, r.data]);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, storage, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text, name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
    grant select, insert, update, delete on storage.objects to authenticated;
    insert into auth.users values ('${A}'), ('${B}');
  `);
  await db.exec(readFileSync(new URL("../../supabase/migrations/0001_init.sql", import.meta.url), "utf8"));
});
afterAll(async () => db.close());

describe("records tablosu RLS", () => {
  it("kullanıcı kendi kaydını yazar ve okur; user_id varsayılan olarak auth.uid() olur", async () => {
    await as(A, async () => {
      await insert(rec("n1", "note", { body: "gizli not" }));
      const r = await db.query<{ user_id: string }>(`select user_id from public.records where id='n1'`);
      expect(r.rows).toEqual([{ user_id: A }]);
    });
  });
  it("başka kullanıcı kaydı göremez, güncelleyemez, silemez", async () => {
    await as(B, async () => {
      expect((await db.query(`select * from public.records`)).rows).toHaveLength(0);
      expect((await db.query(`update public.records set data='{"title":"hack"}' where id='n1'`)).affectedRows).toBe(0);
      expect((await db.query(`delete from public.records where id='n1'`)).affectedRows).toBe(0);
    });
    await as(A, async () => {
      const r = await db.query<{ data: { title: string } }>(`select data from public.records where id='n1'`);
      expect(r.rows[0].data.title).toBe("n1");
    });
  });
  it("başkası adına kayıt eklenemez (WITH CHECK)", async () => {
    await as(B, async () => {
      await expect(insert(rec("spoof"), A)).rejects.toThrow(/row-level security/i);
    });
  });
  it("kayıt sahipliği başkasına devredilemez (UPDATE ... user_id)", async () => {
    await as(A, async () => {
      await expect(db.query(`update public.records set user_id='${B}' where id='n1'`)).rejects.toThrow(/row-level security/i);
    });
  });
  it("aynı kimlik farklı kullanıcılarda ayrı satırdır; upsert başkasının satırını ezmez", async () => {
    await as(B, async () => {
      await insert(rec("n1", "note", { body: "B'nin notu" }));
      await db.query(`insert into public.records (id,kind,data,created_at,updated_at) values ('n1','note','{"title":"B2"}',1,2) on conflict (user_id,id) do update set data=excluded.data`);
      const r = await db.query<{ data: { title: string } }>(`select data from public.records where id='n1'`);
      expect(r.rows).toHaveLength(1);
      expect(r.rows[0].data.title).toBe("B2");
    });
    await as(A, async () => {
      const r = await db.query<{ data: { title: string } }>(`select data from public.records where id='n1'`);
      expect(r.rows[0].data.title).toBe("n1"); // A'nın verisi değişmedi
    });
  });
  it("anonim rol hiçbir şeye erişemez", async () => {
    await as(null, async () => {
      await expect(db.query(`select * from public.records`)).rejects.toThrow(/permission denied/i);
      await expect(insert(rec("anon1"))).rejects.toThrow(/permission denied/i);
    });
  });
  it("geçersiz tür ve aşırı büyük veri reddedilir", async () => {
    await as(A, async () => {
      await expect(insert(rec("bad", "admin"))).rejects.toThrow(/check constraint/i);
      await expect(insert(rec("huge", "note", { body: "x".repeat(4_100_000) }))).rejects.toThrow(/check constraint/i);
    });
  });
  it("kullanıcı silinince kayıtları da silinir (cascade)", async () => {
    await db.query(`delete from auth.users where id='${B}'`);
    expect((await db.query(`select 1 from public.records where user_id='${B}'`)).rows).toHaveLength(0);
    expect((await db.query(`select 1 from public.records where user_id='${A}'`)).rows.length).toBeGreaterThan(0);
  });
});

describe("uploads kovası ilkeleri", () => {
  it("kova özeldir ve boyut/tür sınırı vardır", async () => {
    const r = await db.query<{ public: boolean; file_size_limit: string; allowed_mime_types: string[] }>(`select public, file_size_limit, allowed_mime_types from storage.buckets where id='uploads'`);
    expect(r.rows[0].public).toBe(false);
    expect(Number(r.rows[0].file_size_limit)).toBe(25 * 1024 * 1024);
    expect(r.rows[0].allowed_mime_types).toEqual(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
  });
  it("kullanıcı yalnızca kendi klasörüne yazar ve yalnızca kendi dosyalarını görür", async () => {
    await as(A, async () => {
      await db.query(`insert into storage.objects (bucket_id,name) values ('uploads','${A}/dosya1')`);
      await expect(db.query(`insert into storage.objects (bucket_id,name) values ('uploads','${B}/sizinti')`)).rejects.toThrow(/row-level security/i);
      await expect(db.query(`insert into storage.objects (bucket_id,name) values ('baska-kova','${A}/x')`)).rejects.toThrow(/row-level security/i);
    });
    await db.query(`insert into auth.users values ('${B}') on conflict do nothing`);
    await db.exec(`insert into storage.objects (bucket_id,name) values ('uploads','${B}/gizli')`);
    await as(A, async () => {
      const r = await db.query<{ name: string }>(`select name from storage.objects order by name`);
      expect(r.rows.map((x) => x.name)).toEqual([`${A}/dosya1`]);
      expect((await db.query(`delete from storage.objects where name='${B}/gizli'`)).affectedRows).toBe(0);
    });
  });
});
