'use client';

import { useMemo, useRef, useState } from 'react';
import { GOALS } from '@/lib/program';
import { exportData, importData, resetAll, setProfile, useMeta, useStore, type AppState, type EnvId, type EquipId, type Goal, type Profile } from '@/lib/store';
import { toast } from '@/lib/toast';
import { BAND_NAME, ageBand } from '@/lib/training';
import { LEVEL_HINTS, LEVEL_NAMES, POSITIONS, type Level, type PositionId } from '@/lib/types';
import { fmtDate, todayKey } from '@/lib/utils';
import { Icon } from './Icon';
import { StarRating } from './StarRating';

const selProfile = (s: AppState) => s.profile;
const selLevels = (s: AppState) => s.levels;
const selPracticed = (s: AppState) => s.practiced;
const selLogs = (s: AppState) => s.logs;
const selQuiz = (s: AppState) => s.quiz;
const selTests = (s: AppState) => s.tests;
const selFav = (s: AppState) => s.fav;
const selBoard = (s: AppState) => s.board;
const selVideoNotes = (s: AppState) => s.videoNotes;
const selProgram = (s: AppState) => s.program;
const selCreated = (s: AppState) => s.createdAt;

const EQUIP: { id: EquipId; name: string }[] = [
  { id: 'top', name: 'Top' },
  { id: 'koni', name: 'Koni' },
  { id: 'bant', name: 'Direnç bandı' },
  { id: 'dambil', name: 'Dambıl' },
  { id: 'barfiks', name: 'Barfiks' },
  { id: 'merdiven', name: 'İp merdiven' },
  { id: 'kutu', name: 'Kutu / basamak' },
];
const ENVS: { id: EnvId; name: string }[] = [
  { id: 'ev', name: 'Ev' },
  { id: 'salon', name: 'Spor salonu' },
  { id: 'saha', name: 'Saha' },
];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/* ── Özet kartları ───────────────────────────────────────── */
export function ProfileSummary() {
  const levels = useStore(selLevels);
  const practiced = useStore(selPracticed);
  const logs = useStore(selLogs);
  const quiz = useStore(selQuiz);
  const tests = useStore(selTests);
  const fav = useStore(selFav);
  const board = useStore(selBoard);
  const notes = useStore(selVideoNotes);
  const program = useStore(selProgram);

  const stats = useMemo(() => {
    const rated = Object.keys(levels).length;
    const dist: number[] = [0, 0, 0, 0, 0];
    Object.values(levels).forEach((l) => {
      if (l.level >= 1 && l.level <= 5) dist[l.level - 1]++;
    });
    const practicedCount = Object.keys(practiced).length;
    const done = logs.filter((l) => l.status === 'done').length;
    const partial = logs.filter((l) => l.status !== 'done').length;
    const q = Object.values(quiz);
    const tries = q.reduce((a, b) => a + b.tries, 0);
    const right = q.reduce((a, b) => a + b.right, 0);
    return { rated, dist, practicedCount, done, partial, tries, right, quizQ: q.length };
  }, [levels, practiced, logs, quiz]);

  const items: { n: string; l: string; sub?: string }[] = [
    { n: String(stats.rated), l: 'Seviye verilen teknik', sub: stats.rated ? `${stats.dist.map((c, i) => (c ? `${i + 1}★ ${c}` : '')).filter(Boolean).join(' · ')}` : 'Henüz yıldız vermedin' },
    { n: String(stats.practicedCount), l: 'Çalışıldı işaretlenen teknik' },
    { n: String(stats.done), l: 'Tamamlanan antrenman', sub: stats.partial ? `${stats.partial} yarım kalan` : undefined },
    { n: stats.tries ? `%${Math.round((stats.right / stats.tries) * 100)}` : '—', l: 'Futbol IQ doğruluğu', sub: stats.tries ? `${stats.right}/${stats.tries} doğru · ${stats.quizQ} soru` : 'Henüz soru çözülmedi' },
    { n: String(tests.length), l: 'Test kaydı' },
    { n: String(fav.length), l: 'Favori' },
    { n: String(board.length), l: 'Kayıtlı taktik tahtası' },
    { n: String(Object.keys(notes).length), l: 'Video analiz notu' },
  ];

  return (
    <div>
      <div className="summary">
        {items.map((it) => (
          <div key={it.l} className="summary__item">
            <span className="summary__n num">{it.n}</span>
            <span className="summary__l">{it.l}</span>
            {it.sub && <span className="summary__s mono">{it.sub}</span>}
          </div>
        ))}
      </div>
      <p className="field__hint" style={{ marginTop: 14 }}>
        {program ? 'Aktif bir antrenman programın var.' : 'Henüz bir antrenman programı oluşturmadın.'} Bu sayılar yalnızca bu tarayıcıdaki kayıtlarından hesaplanır.
      </p>
    </div>
  );
}

/* ── Profil formu ────────────────────────────────────────── */
export function ProfileForm() {
  const profile = useStore(selProfile);
  const { ready } = useMeta();
  const [ageText, setAgeText] = useState<string | null>(null);
  const ageShown = ageText ?? (profile.age ? String(profile.age) : '');
  const ageNum = Number(ageShown);
  const validAge = ageShown !== '' && Number.isFinite(ageNum) && ageNum >= 6 && ageNum <= 70;
  const band = validAge ? ageBand(ageNum) : null;
  const patch = (p: Partial<Profile>) => setProfile(p);

  return (
    <div className="grid cols-2" style={{ '--gap': '28px' } as React.CSSProperties} aria-busy={!ready}>
      <div className="panel">
        <p className="panel__title">Kimlik ve seviye</p>
        <div className="stack" style={{ '--stack': '1.4rem' } as React.CSSProperties}>
          <div className="field">
            <label htmlFor="p-name">Adın <span className="muted">(isteğe bağlı)</span></label>
            <input id="p-name" className="input" maxLength={40} value={profile.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Örn. Efe" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="p-age">Yaş</label>
            <input
              id="p-age"
              className="input"
              inputMode="numeric"
              value={ageShown}
              onChange={(e) => {
                const t = e.target.value.replace(/\D/g, '').slice(0, 2);
                setAgeText(t);
                const n = Number(t);
                if (t === '') patch({ age: null });
                else if (n >= 6 && n <= 70) patch({ age: n });
              }}
              onBlur={() => setAgeText(null)}
              placeholder="Örn. 14"
              aria-describedby="p-age-h"
              aria-invalid={ageShown !== '' && !validAge}
            />
            <span id="p-age-h" className="field__hint">
              {ageShown !== '' && !validAge ? '6 ile 70 arasında bir yaş girin.' : band ? `Yaş grubu: ${BAND_NAME[band]}. Egzersiz dozu ve güvenlik kuralları buna göre uygulanır.` : 'Yaş, doz ve egzersiz güvenliğini belirler.'}
            </span>
          </div>
          <div className="field">
            <span className="field__label">Genel yetenek seviyesi</span>
            <StarRating value={profile.level} onChange={(v: Level) => patch({ level: v })} label="Genel yetenek seviyeniz" />
            <span className="field__hint">{LEVEL_NAMES[profile.level]} — {LEVEL_HINTS[profile.level]}. Tek tek tekniklerin seviyesini teknik sayfasından ayrıca değiştirebilirsin.</span>
          </div>
          <div className="field">
            <span className="field__label">Pozisyon(lar)</span>
            <div className="chips">
              {POSITIONS.map((p) => (
                <button key={p.id} type="button" className="chip" aria-pressed={profile.positions.includes(p.id)} onClick={() => patch({ positions: toggle<PositionId>(profile.positions, p.id) })}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="panel__title">Antrenman tercihleri</p>
        <div className="stack" style={{ '--stack': '1.4rem' } as React.CSSProperties}>
          <div className="field">
            <label htmlFor="p-goal">Hedef</label>
            <select id="p-goal" className="select" value={profile.goal} onChange={(e) => patch({ goal: e.target.value as Goal })}>
              {GOALS.map((g) => (
                <option key={g.id} value={g.id}>{g.name} — {g.hint}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="field__label">Antrenman ortamı</span>
            <div className="chips">
              {ENVS.map((e) => (
                <button key={e.id} type="button" className="chip" aria-pressed={profile.envs.includes(e.id)} onClick={() => patch({ envs: toggle<EnvId>(profile.envs, e.id) })}>{e.name}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field__label">Elimdeki ekipman</span>
            <div className="chips">
              {EQUIP.map((e) => (
                <button key={e.id} type="button" className="chip" aria-pressed={profile.equipment.includes(e.id)} onClick={() => patch({ equipment: toggle<EquipId>(profile.equipment, e.id) })}>{e.name}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field__label">Haftada kaç antrenman?</span>
            <div className="seg" role="group" aria-label="Haftalık antrenman sayısı">
              {[2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" aria-pressed={profile.perWeek === n} onClick={() => patch({ perWeek: n })}>{n}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field__label">Antrenman süresi</span>
            <div className="seg" role="group" aria-label="Antrenman süresi">
              {[30, 45, 60, 75, 90].map((n) => (
                <button key={n} type="button" aria-pressed={profile.minutes === n} onClick={() => patch({ minutes: n })}>{n} dk</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Veri: depolama durumu, yedek, sıfırlama ─────────────── */
export function DataTools() {
  const { ready, storageOk } = useMeta();
  const created = useStore(selCreated);
  // state değiştiğinde yeniden hesaplamak için geniş bir abonelik
  const logs = useStore(selLogs);
  const tests = useStore(selTests);
  const levels = useStore(selLevels);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const size = useMemo(() => {
    if (!ready) return 0;
    try {
      return new Blob([exportData()]).size;
    } catch {
      return 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, logs, tests, levels]);

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `libero-yedek-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Yedek dosyası indirildi.');
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setMsg({ kind: 'err', text: 'Dosya çok büyük görünüyor (8 MB üstü). Bir Libero yedeği seçtiğinden emin ol.' });
      return;
    }
    const text = await f.text();
    if (!window.confirm('Bu yedek, bu tarayıcıdaki mevcut verilerinin yerine geçecek. Devam edilsin mi?')) return;
    const r = importData(text);
    if (r.ok) {
      setMsg({ kind: 'ok', text: 'Yedek yüklendi. Verilerin geri geldi.' });
      toast('Yedek yüklendi.');
    } else {
      setMsg({ kind: 'err', text: r.error });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const reset = () => {
    if (!window.confirm('Bu tarayıcıdaki tüm Libero verileri (profil, seviyeler, programlar, antrenman geçmişi, notlar) silinecek. Bu işlem geri alınamaz. Önce yedek almanı öneririz. Silinsin mi?')) return;
    resetAll();
    setMsg({ kind: 'ok', text: 'Tüm veriler silindi.' });
    toast('Veriler sıfırlandı.');
  };

  return (
    <div className="stack" style={{ '--stack': '1.4rem' } as React.CSSProperties}>
      {ready && !storageOk && (
        <div className="note note--warn" role="alert">
          <Icon name="warn" />
          <p><strong>Bu tarayıcı veri saklamaya izin vermiyor</strong> (gizli sekme ya da engellenmiş site verisi olabilir). Yaptıkların bu sekme kapanınca kaybolur. Önemli bir şey yaptıysan aşağıdan yedek dosyası indir.</p>
        </div>
      )}
      <div className="note">
        <Icon name="info" />
        <div>
          <p><strong>Verilerin nerede duruyor?</strong></p>
          <p style={{ marginTop: 6 }}>
            Libero’da hesap ve sunucu yok. Profilin, yıldız seviyelerin, programın, antrenman geçmişin ve notların <strong>yalnızca şu an kullandığın tarayıcıda</strong> (localStorage) tutulur. Bu yüzden:
          </p>
          <ul style={{ marginTop: 8, paddingLeft: 18, listStyle: 'disc' }}>
            <li>Başka bir telefon, bilgisayar ya da başka bir tarayıcıda aynı verileri göremezsin.</li>
            <li>Tarayıcı verilerini (çerez/site verisi) temizlersen kayıtların silinir.</li>
            <li>Gizli/özel sekmede kayıtlar sekme kapanınca kaybolur.</li>
            <li>Cihaz değiştirmeden önce <strong>yedek dosyası indir</strong>, yeni cihazda aşağıdan yükle.</li>
          </ul>
          <p style={{ marginTop: 8 }}>Hiçbir veri bize gönderilmez; yüklediğin videolar da cihazından çıkmaz.</p>
        </div>
      </div>

      <dl className="kv">
        <div><dt>Depolama durumu</dt><dd>{!ready ? 'Kontrol ediliyor…' : storageOk ? 'Çalışıyor' : 'Kullanılamıyor'}</dd></div>
        <div><dt>Kayıt boyutu</dt><dd className="num">{ready ? `${(size / 1024).toFixed(1)} KB` : '—'}</dd></div>
        <div><dt>İlk kayıt</dt><dd>{created ? fmtDate(created.slice(0, 10)) : '—'}</dd></div>
      </dl>

      <div className="levelcard__actions">
        <button type="button" className="btn btn--primary" onClick={download} disabled={!ready}>
          Yedek indir (.json) <Icon name="arrow" />
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()} disabled={!ready}>Yedekten geri yükle</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden aria-label="Yedek dosyası seç" onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" className="btn btn--danger" onClick={reset} disabled={!ready}>Tüm verilerimi sil</button>
      </div>
      {msg && (
        <p className={`note ${msg.kind === 'err' ? 'note--warn' : ''}`} role={msg.kind === 'err' ? 'alert' : 'status'}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
