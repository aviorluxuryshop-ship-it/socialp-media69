"use client";

import clsx from "clsx";
import { ArrowLeft, Crown, Info, LockKeyhole, Scissors } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { Avatar, Field, Segmented } from "@/components/ui";
import { api, REMOTE } from "@/lib/remote";
import { remoteLogin, useStore } from "@/lib/store";

type Mode = "owner" | "staff";

interface PublicInfo {
  studioName: string;
  demo: boolean;
  branches: { id: string; name: string; color: string }[];
  staff: { id: string; name: string; role: string; color: string; branchId: string }[];
  demoPins: { id: string; name: string; pin: string }[] | null;
}

/** Giriş ekranının ihtiyaç duyduğu bilgiler: yerel modda cihazdaki veriden, sunucu modunda /api/public'ten. */
function usePublicInfo(): { info: PublicInfo | null; error: string | null } {
  const staff = useStore((s) => s.staff);
  const branches = useStore((s) => s.branches);
  const studioName = useStore((s) => s.settings.studioName);
  const demo = useStore((s) => s.demo);
  const [remote, setRemote] = useState<PublicInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!REMOTE) return;
    api<PublicInfo>("public")
      .then(setRemote)
      .catch((e: Error) => setError(e.message));
  }, []);
  if (REMOTE) return { info: remote, error };
  const active = staff.filter((s) => s.active);
  return {
    error: null,
    info: { studioName, demo, branches, staff: active, demoPins: demo ? active.map(({ id, name, pin }) => ({ id, name, pin })) : null },
  };
}

export default function LoginPage() {
  const router = useRouter();
  const session = useStore((s) => s.session);
  const ownerPin = useStore((s) => s.settings.ownerPin);
  const localStaff = useStore((s) => s.staff);
  const login = useStore((s) => s.login);
  const { info, error: infoError } = usePublicInfo();

  const [mode, setMode] = useState<Mode>("owner");
  const [staffId, setStaffId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session?.role === "owner") router.replace("/panel");
    else if (session?.role === "staff") router.replace("/personel");
  }, [session, router]);

  const staff = info?.staff ?? [];
  const branches = info?.branches ?? [];
  const person = staff.find((s) => s.id === staffId);
  const ownerPassword = REMOTE && mode === "owner";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (REMOTE) {
      setBusy(true);
      try {
        await remoteLogin(mode === "owner" ? { role: "owner" } : { role: "staff", staffId: person!.id }, pin);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Giriş yapılamadı.");
        setPin("");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (mode === "owner") {
      if (pin === ownerPin) login({ role: "owner" });
      else setError("PIN hatalı. Tekrar deneyin.");
    } else if (person) {
      if (pin === localStaff.find((s) => s.id === person.id)?.pin) login({ role: "staff", staffId: person.id });
      else setError("PIN hatalı. Tekrar deneyin.");
    }
    setPin("");
  }

  const showPin = mode === "owner" || !!person;
  const studioName = info?.studioName ?? "Melopee Nail Art Studio";

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Marka yüzü */}
      <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-14" style={{ background: "linear-gradient(160deg,#f6e4db 0%,#f2eae3 55%,#ebe0d7 100%)" }}>
        <Brand size="lg" />
        <svg aria-hidden viewBox="0 0 400 400" className="pointer-events-none absolute -right-24 top-1/2 h-[560px] w-[560px] -translate-y-1/2 opacity-[0.5]">
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx="200" cy="200" rx={70 + i * 26} ry={120 + i * 30} fill="none" stroke="#b84c36" strokeOpacity={0.22 - i * 0.03} strokeWidth="1.2" />
          ))}
        </svg>
        <div className="relative max-w-md">
          <p className="display text-[40px] leading-[1.08] text-ink">Stüdyonuzun ritmi, tek bir panelde.</p>
          <p className="mt-4 text-[15px] text-ink-2">
            Randevular, müşteriler, personel, gelir-gider ve raporlar — iki şubenin tamamı ya da yalnızca seçtiğiniz şube.
          </p>
        </div>
        <p className="relative text-[12.5px] text-ink-3">{studioName} · Yönetim Paneli</p>
      </section>

      {/* Giriş */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <Brand size="md" />
          </div>
          <h1 className="display text-[34px]">Hoş geldiniz</h1>
          <p className="mt-1 text-ink-2">Devam etmek için giriş türünü seçin.</p>

          <div className="mt-6">
            <Segmented<Mode>
              label="Giriş türü"
              value={mode}
              onChange={(m) => {
                setMode(m);
                setStaffId(null);
                setPin("");
                setError(null);
              }}
              options={[
                { value: "owner", label: <><Crown size={15} aria-hidden /> Yönetici</> },
                { value: "staff", label: <><Scissors size={15} aria-hidden /> Personel</> },
              ]}
            />
          </div>

          <form onSubmit={submit} className="card mt-5 p-5">
            {mode === "staff" && !person && (
              <div>
                <p className="mb-3 text-[13px] font-semibold text-ink-2">Adınızı seçin</p>
                {!info && !infoError && <p className="text-[14px] text-ink-3">Yükleniyor…</p>}
                {info && staff.length === 0 && <p className="text-[14px] text-ink-3">Henüz personel eklenmemiş. Yönetici panelinden personel ekleyin.</p>}
                <div className="flex flex-col gap-4">
                  {branches.map((b) => {
                    const list = staff.filter((s) => s.branchId === b.id);
                    if (!list.length) return null;
                    return (
                      <div key={b.id}>
                        <p className="eyebrow mb-2">{b.name}</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {list.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setStaffId(s.id);
                                setError(null);
                              }}
                              className="flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 py-2 text-left transition-colors hover:border-rose hover:bg-rose-50"
                            >
                              <Avatar name={s.name} color={s.color} size={30} />
                              <span className="min-w-0">
                                <span className="block truncate text-[14px] font-semibold">{s.name}</span>
                                <span className="block truncate text-[12px] text-ink-3">{s.role}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {showPin && (
              <div className="flex flex-col gap-4">
                {mode === "staff" && person && (
                  <div className="flex items-center gap-3">
                    <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setStaffId(null)} aria-label="Personel seçimine dön">
                      <ArrowLeft size={16} />
                    </button>
                    <Avatar name={person.name} color={person.color} size={36} />
                    <div>
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-[12.5px] text-ink-3">{branches.find((b) => b.id === person.branchId)?.name}</p>
                    </div>
                  </div>
                )}
                <Field label={ownerPassword ? "Yönetici şifresi" : mode === "owner" ? "Yönetici PIN" : "Personel PIN"} error={error}>
                  {(id, d) =>
                    ownerPassword ? (
                      <input
                        id={id}
                        aria-describedby={d}
                        aria-invalid={!!error}
                        className="input"
                        type="password"
                        autoComplete="current-password"
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value);
                          setError(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <input
                        id={id}
                        aria-describedby={d}
                        aria-invalid={!!error}
                        className="input num text-center text-[22px] tracking-[0.6em]"
                        type="password"
                        inputMode="numeric"
                        autoComplete="current-password"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value.replace(/\D/g, ""));
                          setError(null);
                        }}
                        autoFocus
                        placeholder="••••"
                      />
                    )
                  }
                </Field>
                <button type="submit" className="btn btn-primary w-full" disabled={busy || (ownerPassword ? pin.length < 1 : pin.length < 4)}>
                  <LockKeyhole size={16} aria-hidden /> {busy ? "Giriş yapılıyor…" : "Giriş yap"}
                </button>
              </div>
            )}
          </form>

          {infoError && (
            <p className="mt-4 rounded-xl bg-bad-50 px-4 py-3 text-[13.5px] font-semibold text-bad" role="alert">
              {infoError}
            </p>
          )}
          {info?.demoPins && (
            <div className={clsx("mt-4 flex gap-2.5 rounded-xl border border-[#e7d9c3] bg-[#fbf6ee] px-4 py-3 text-[13px] text-[#6e5530]")}>
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
              <p>
                <strong>Tanıtım modu.</strong> {REMOTE ? "Yönetici şifresi size ayrıca iletildi." : <>Yönetici PIN: <span className="num font-bold">{ownerPin}</span>.</>} Personel PIN&apos;leri:{" "}
                {info.demoPins.slice(0, 6).map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ", "}
                    {s.name.split(" ")[0]} <span className="num font-bold">{s.pin}</span>
                  </span>
                ))}
                . Gerçek kullanıma geçerken Ayarlar&apos;dan tanıtım verisini silin.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
