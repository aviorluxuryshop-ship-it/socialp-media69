"use client";

import { Database, Download, KeyRound, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Card, Confirm, Field, PageHeader, toast } from "@/components/ui";
import { download } from "@/lib/csv";
import { exportData, isAppData, useStore } from "@/lib/store";
import { useNow } from "@/lib/hooks";
import { api, ApiError, REMOTE } from "@/lib/remote";

export default function SettingsPage() {
  const { today } = useNow();
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);
  const demo = useStore((s) => s.demo);
  const loadDemo = useStore((s) => s.loadDemo);
  const startEmpty = useStore((s) => s.startEmpty);
  const importData = useStore((s) => s.importData);
  const counts = useStore(useShallow((s) => ({ a: s.appointments.length, c: s.customers.length, t: s.transactions.length })));

  const [studioName, setStudioName] = useState(settings.studioName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [confirm, setConfirm] = useState<"empty" | "demo" | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pinErr = pin && !/^\d{4,6}$/.test(pin) ? "PIN 4–6 haneli rakam olmalı." : pin && pin2 && pin !== pin2 ? "PIN'ler eşleşmiyor." : null;

  async function onImport(file: File) {
    setImportErr(null);
    try {
      const json = JSON.parse(await file.text());
      const d = json?.data ?? json;
      if (!isAppData(d)) throw new Error("format");
      await importData(d);
      toast("Yedek geri yüklendi");
    } catch (e) {
      setImportErr(e instanceof ApiError ? e.message : "Dosya okunamadı. Bu panelden alınmış bir .json yedeği seçin.");
    }
  }

  return (
    <>
      <PageHeader title="Ayarlar" sub="Stüdyo bilgileri, güvenlik ve veri yönetimi" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Stüdyo">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Stüdyo adı">
              {(id) => <input id={id} className="input" value={studioName} onChange={(e) => setStudioName(e.target.value)} />}
            </Field>
            <Field label="Yönetici adı" hint="Karşılama mesajında kullanılır.">
              {(id, d) => <input id={id} aria-describedby={d} className="input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />}
            </Field>
            <Field label="Takvim adımı" hint="Randevu saatleri bu aralıklarla seçilir.">
              {(id, d) => (
                <select id={id} aria-describedby={d} className="input" value={settings.slotMinutes} onChange={(e) => saveSettings({ slotMinutes: Number(e.target.value) as 15 | 30 })}>
                  <option value={15}>15 dakika</option>
                  <option value={30}>30 dakika</option>
                </select>
              )}
            </Field>
          </div>
          <button
            type="button"
            className="btn btn-primary mt-4"
            disabled={!studioName.trim() || (studioName === settings.studioName && ownerName === settings.ownerName)}
            onClick={() => {
              saveSettings({ studioName: studioName.trim(), ownerName: ownerName.trim() });
              toast("Stüdyo bilgileri kaydedildi");
            }}
          >
            Kaydet
          </button>
          <p className="mt-4 text-[13px] text-ink-3">Şube adresleri, telefonları ve çalışma saatleri Şubeler sayfasından; personel PIN&apos;leri Personel sayfasından düzenlenir.</p>
        </Card>

        {REMOTE ? (
          <OwnerPasswordCard />
        ) : (
        <Card title="Yönetici PIN" sub="Panele giriş için kullanılır">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Yeni PIN" error={pinErr}>
              {(id, d) => <input id={id} aria-describedby={d} className="input num tracking-[0.3em]" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />}
            </Field>
            <Field label="Yeni PIN (tekrar)">
              {(id) => <input id={id} className="input num tracking-[0.3em]" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} />}
            </Field>
          </div>
          <button
            type="button"
            className="btn btn-primary mt-4"
            disabled={!pin || pin !== pin2 || !!pinErr}
            onClick={() => {
              saveSettings({ ownerPin: pin });
              setPin("");
              setPin2("");
              toast("Yönetici PIN değiştirildi");
            }}
          >
            <KeyRound size={16} aria-hidden /> PIN’i değiştir
          </button>
          {settings.ownerPin === "0000" && <p className="mt-3 text-[13px] font-semibold text-warn">Varsayılan PIN (0000) kullanılıyor — gerçek kullanımdan önce değiştirin.</p>}
        </Card>
        )}

        <Card title="Yedekleme" sub={REMOTE ? "Veriler sunucudaki veritabanında saklanır. Yine de düzenli yedek alın." : "Veriler bu tarayıcıda saklanır. Düzenli yedek alın."}>
          <p className="num mb-4 text-[14px] text-ink-2">
            {counts.a} randevu · {counts.c} müşteri · {counts.t} gelir/gider kaydı
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              data-export
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                download(`melopee-yedek-${today}.json`, JSON.stringify({ app: "melopee-panel", version: 1, exportedAt: new Date().toISOString(), data: exportData(useStore.getState()) }), "application/json");
              }}
            >
              <Download size={16} aria-hidden /> Yedek indir (.json)
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={16} aria-hidden /> Yedekten geri yükle
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImport(file);
                e.target.value = "";
              }}
            />
          </div>
          {importErr && (
            <p className="mt-3 text-[13px] font-semibold text-bad" role="alert">
              {importErr}
            </p>
          )}
        </Card>

        <Card title="Veri" sub={demo ? "Şu an tanıtım verisi kullanılıyor" : "Gerçek veri kullanılıyor"}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
              <div className="max-w-md">
                <p className="font-semibold">Gerçek kullanıma başla</p>
                <p className="text-[13px] text-ink-3">Tanıtım randevuları, müşterileri, personeli ve kayıtları silinir. {demo ? "Şubeler ve hizmet adları kalır; örnek fiyatlar sıfırlanır." : "Şubeler ve hizmet listesi kalır."}</p>
              </div>
              <button type="button" className="btn btn-danger" onClick={() => setConfirm("empty")}>
                <Database size={16} aria-hidden /> Boş başla
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
              <div className="max-w-md">
                <p className="font-semibold">Tanıtım verisini yükle</p>
                <p className="text-[13px] text-ink-3">Paneli denemek için örnek iki şube, altı personel ve dört aylık kayıt.</p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirm("demo")}>
                <RotateCcw size={16} aria-hidden /> Tanıtım verisi
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Confirm
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === "empty" ? "Tüm veriler silinsin mi?" : "Tanıtım verisi yüklensin mi?"}
        confirmLabel={confirm === "empty" ? "Sil ve boş başla" : "Yükle"}
        onConfirm={() => {
          const mode = confirm;
          void (async () => {
            try {
              if (mode === "empty") {
                await startEmpty();
                toast("Panel sıfırlandı — Personel sayfasından ekibinizi ekleyin");
              } else {
                await loadDemo();
                toast("Tanıtım verisi yüklendi");
              }
            } catch (e) {
              toast(e instanceof ApiError ? e.message : "İşlem tamamlanamadı");
            }
          })();
        }}
      >
        {confirm === "empty"
          ? "Randevular, müşteriler, personel ve gelir-gider kayıtları kalıcı olarak silinir. Devam etmeden önce yedek almanızı öneririz."
          : "Mevcut tüm veriler tanıtım verisiyle değiştirilir. Gerçek kayıtlarınız varsa önce yedek alın."}
      </Confirm>
    </>
  );
}

function OwnerPasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mismatch = next && next2 && next !== next2 ? "Şifreler eşleşmiyor." : null;
  return (
    <Card title="Yönetici şifresi" sub="Panele yönetici olarak giriş için kullanılır">
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          setBusy(true);
          try {
            await api("auth/password", { current, next });
            setCurrent("");
            setNext("");
            setNext2("");
            toast("Yönetici şifresi değiştirildi");
          } catch (e) {
            setErr(e instanceof ApiError ? e.message : "Şifre değiştirilemedi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Mevcut şifre" className="sm:col-span-2" error={err}>
          {(id, d) => <input id={id} aria-describedby={d} className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />}
        </Field>
        <Field label="Yeni şifre" hint="En az 6 karakter.">
          {(id, d) => <input id={id} aria-describedby={d} className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
        </Field>
        <Field label="Yeni şifre (tekrar)" error={mismatch}>
          {(id, d) => <input id={id} aria-describedby={d} className="input" type="password" autoComplete="new-password" value={next2} onChange={(e) => setNext2(e.target.value)} />}
        </Field>
        <div className="sm:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={busy || !current || next.length < 6 || next !== next2}>
            <KeyRound size={16} aria-hidden /> {busy ? "Kaydediliyor…" : "Şifreyi değiştir"}
          </button>
        </div>
      </form>
    </Card>
  );
}
