"use client";

import { Cloud, Download, LogIn, LogOut, Pencil, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmSheet, KeyValue, Notice, PageHeader, SectionTitle, Segmented, Spinner } from "@/components/ui";
import { useApp } from "@/lib/app";
import { useAuth } from "@/lib/auth";
import { SCHOOL_TYPES } from "@/lib/catalog/data";
import { editionLabel, getBook } from "@/lib/catalog";
import { playTone } from "@/lib/sound";
import { LocalStore } from "@/lib/store/local";
import { useStoreCtx } from "@/lib/store/provider";
import type { AnyRecord, RecordKind, ThemeMode } from "@/lib/types";

function download(name: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function SettingsPage() {
  const { profile, patchProfile, toast } = useApp();
  const auth = useAuth();
  const { store, save } = useStoreCtx();
  const [busy, setBusy] = useState<null | "export" | "migrate" | "wipe">(null);
  const [confirm, setConfirm] = useState<null | "wipe" | "signout">(null);

  async function exportAll() {
    setBusy("export");
    try {
      const kinds: RecordKind[] = ["profile", "note", "upload", "summary", "card", "exam", "attempt", "task", "session", "chat", "event", "video"];
      const out: Record<string, unknown[]> = {};
      for (const k of kinds) {
        const rows = await store.list(k, { limit: 5000 });
        out[k] = k === "upload" ? rows.map((r) => ({ ...r, pages: undefined, note: "Sayfa metinleri dışa aktarmaya dahil edilmedi." })) : rows;
      }
      download(`studyflow-yedek-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), mode: store.mode, records: out }, null, 2), "application/json");
      toast("Yedek dosyası indirildi.", "ok");
    } catch {
      toast("Dışa aktarma tamamlanamadı.", "error");
    }
    setBusy(null);
  }

  async function migrate() {
    setBusy("migrate");
    try {
      const local = new LocalStore();
      const all = await local.dumpAll();
      let moved = 0;
      for (const { rec } of all) {
        await save(rec as AnyRecord);
        moved++;
      }
      toast(moved ? `${moved} kayıt hesabına aktarıldı.` : "Bu cihazda aktarılacak veri yok.", moved ? "ok" : "info");
    } catch {
      toast("Aktarma tamamlanamadı. Bağlantını kontrol edip tekrar dene.", "error");
    }
    setBusy(null);
  }

  async function wipeLocal() {
    setBusy("wipe");
    try {
      await new LocalStore().clearAll();
      toast("Bu cihazdaki veriler silindi.", "ok");
      // Bellekteki durumu sıfırlamak için sayfayı yeniden yükle; profil yoksa karşılama ekranı açılır.
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast("Silinemedi.", "error");
    }
    setBusy(null);
  }

  if (!profile) {
    return (
      <div>
        <PageHeader eyebrow="Ayarlar" title="Ayarlar" />
        <Notice tone="info" title="Önce profilini oluştur" action={<Link href="/hos-geldin" className="btn btn-primary btn-sm">Başlayalım</Link>}>
          Tema ve ses tercihleri profilinle birlikte saklanır.
        </Notice>
      </div>
    );
  }

  const school = SCHOOL_TYPES.find((s) => s.id === profile.schoolType);
  const books = profile.bookIds.map((id) => getBook(id)).filter(Boolean);
  const signedIn = auth.status === "signed-in";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Ayarlar" title="Ayarlar ve hesap" />

      <SectionTitle aside={<Link href="/hos-geldin?duzenle=1" className="inline-flex items-center gap-1 text-accent hover:underline"><Pencil size={14} /> Düzenle</Link>}>Profil</SectionTitle>
      <dl className="card hair px-4 py-1.5">
        <KeyValue k="Ad" v={profile.name || "—"} />
        <KeyValue k="Sınıf" v={`${profile.grade}. sınıf`} />
        <KeyValue k="İl" v={profile.province || "—"} />
        <KeyValue k="Okul türü" v={school?.name ?? "—"} />
        <KeyValue k="Ders kitapları" v={books.length ? `${books.length} kitap` : "Seçilmedi"} />
      </dl>
      {books.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[13px] text-ink-3">
          {books.slice(0, 6).map((b) => b && <li key={b.id}>{editionLabel(b)}</li>)}
          {books.length > 6 && <li>… ve {books.length - 6} kitap daha</li>}
        </ul>
      )}

      <SectionTitle>Görünüm ve ses</SectionTitle>
      <div className="card space-y-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-ink">Tema</span>
          <Segmented<ThemeMode>
            label="Tema"
            size="sm"
            value={profile.theme}
            onChange={(theme) => void patchProfile({ theme })}
            options={[
              { value: "system", label: "Sistem" },
              { value: "light", label: "Açık" },
              { value: "dark", label: "Koyu" },
            ]}
          />
        </div>
        <Toggle
          label="Hareketi azalt"
          hint="Geçiş animasyonlarını en aza indirir. Cihazının erişilebilirlik ayarı da otomatik olarak dikkate alınır."
          checked={profile.reduceMotion}
          onChange={(reduceMotion) => void patchProfile({ reduceMotion })}
        />
        <Toggle
          label="Ses efektleri"
          hint="Tamamlanan görevlerde çok hafif, kısa bir ses. Varsayılan olarak kapalıdır."
          checked={profile.sound}
          onChange={(sound) => {
            void patchProfile({ sound });
            if (sound) setTimeout(() => playTone("success"), 120);
          }}
        />
      </div>

      <SectionTitle>Hesap ve veri</SectionTitle>
      <div className="card space-y-4 p-4">
        {auth.status === "unconfigured" && (
          <Notice tone="info" title="Bu sürümde hesap sistemi kapalı">
            Verilerin yalnızca bu tarayıcıda saklanıyor. Tarayıcı verilerini temizlersen kaybolurlar; düzenli olarak yedek almanı öneririz.
          </Notice>
        )}
        {auth.status === "signed-out" && (
          <div className="space-y-3">
            <p className="text-ink-2">Verilerin şu an yalnızca bu tarayıcıda. Hesap açarsan başka cihazlarda da erişebilirsin.</p>
            <Link href="/giris" className="btn btn-primary">
              <LogIn size={17} /> Giriş yap / hesap aç
            </Link>
          </div>
        )}
        {signedIn && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-ink">
              <Cloud size={17} className="text-ok" /> {auth.user?.email} olarak giriş yaptın
            </p>
            <p className="text-sm text-ink-3">Yeni oluşturduğun veriler hesabında saklanır. Bu cihazda hesap açmadan önce oluşturduğun verileri hesabına taşıyabilirsin.</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-secondary" onClick={() => void migrate()} disabled={busy !== null}>
                {busy === "migrate" ? <Spinner size={16} /> : <Upload size={16} />} Bu cihazdaki verileri hesabıma aktar
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirm("signout")}>
                <LogOut size={16} /> Çıkış yap
              </button>
            </div>
            <p className="text-[12.5px] text-ink-3">Aktarılan dosya içerikleri (yüklenen PDF/görsel dosyaları) değil, yalnızca kayıtlar taşınır.</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <button className="btn btn-secondary" onClick={() => void exportAll()} disabled={busy !== null}>
            {busy === "export" ? <Spinner size={16} /> : <Download size={16} />} Verilerimi indir (JSON)
          </button>
          <button className="btn btn-ghost text-danger" onClick={() => setConfirm("wipe")} disabled={busy !== null}>
            <Trash2 size={16} /> Bu cihazdaki verileri sil
          </button>
        </div>
      </div>

      <p className="mt-8 text-[12.5px] leading-relaxed text-ink-3">
        Ders kitabı metinleri StudyFlow&apos;da saklanmaz; yalnızca MEB&apos;in resmî PDF&apos;inden, ihtiyaç anında ilgili sayfalar okunur ve kaynak olarak bağlantı verilir. Şifreler ve gizli anahtarlar tarayıcıda tutulmaz.
      </p>

      <ConfirmSheet
        open={confirm === "wipe"}
        title="Bu cihazdaki veriler silinsin mi?"
        text="Bu tarayıcıda saklanan notlar, planlar, sınav sonuçları ve yüklemeler kalıcı olarak silinir. Hesabındaki (bulut) veriler etkilenmez. Önce yedek almanı öneririz."
        confirmLabel="Evet, sil"
        danger
        onConfirm={() => void wipeLocal()}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet open={confirm === "signout"} title="Çıkış yapılsın mı?" text="Çıkış yaptıktan sonra verilerin hesabında güvende kalır; bu cihazda yalnızca yerel verilerini görürsün." confirmLabel="Çıkış yap" onConfirm={() => void auth.signOut()} onClose={() => setConfirm(null)} />
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-ink">{label}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-3">{hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border border-line transition-colors ${checked ? "bg-accent" : "bg-surface-2"}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
