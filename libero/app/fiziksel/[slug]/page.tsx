import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EXCAT_NAME, EXERCISES, EX_BY_ID, MUSCLE_NAME } from '@/data/exercises';
import { BAND_NAME, allowedInBand, doseFor } from '@/lib/training';
import { ENV_NAME, EQUIP_NAME } from '@/lib/environments';
import type { AgeBand } from '@/lib/program-types';
import { Icon } from '@/components/Icon';
import { MuscleMap } from '@/components/MuscleMap';
import { PageHead } from '@/components/PageHead';
import { StarRating } from '@/components/StarRating';
import { MarkExercise } from '@/components/MarkExercise';

export const dynamicParams = false;
export function generateStaticParams() {
  return EXERCISES.map((e) => ({ slug: e.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = EX_BY_ID[slug];
  return e ? { title: e.name, description: e.why } : {};
}

const BANDS: AgeBand[] = ['u12', '12-14', '15-17', '18+'];

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = EX_BY_ID[slug];
  if (!e) notFound();
  const alts = e.alt.map((id) => EX_BY_ID[id]).filter(Boolean);
  return (
    <>
      <PageHead crumbs={[{ href: '/fiziksel/', label: 'Fiziksel gelişim' }, { label: e.name }]} eyebrow={EXCAT_NAME[e.cat]} title={e.name} lead={e.why}>
        <div className="tech-meta">
          <span className="tag">Ortam: {e.env.map((x) => ENV_NAME[x]).join(', ')}</span>
          <span className="tag">{e.equip.map((x) => EQUIP_NAME[x]).join(', ')}</span>
          <span className="tag">Önerilen en erken yaş: {e.minAge}</span>
          <span className="tag">Zorluk <StarRating value={e.lv} readOnly size="sm" showName={false} label="Zorluk" /></span>
        </div>
      </PageHead>
      <div className="container tech-layout">
        <aside className="tech-aside">
          <div className="card card--marks card--pad">
            <p className="panel__title"><span>Çalışan kaslar</span></p>
            <MuscleMap primary={e.muscles} secondary={e.secondary} />
            <ul className="ex-muscles">
              {e.muscles.map((m) => <li key={m}><i className="dot dot--on" /> {MUSCLE_NAME[m]} <span className="muted">ana</span></li>)}
              {e.secondary.map((m) => <li key={m}><i className="dot" /> {MUSCLE_NAME[m]} <span className="muted">yardımcı</span></li>)}
            </ul>
          </div>
          <MarkExercise id={e.id} name={e.name} />
        </aside>
        <div className="tech-main">
          <section className="tsec">
            <h2 className="h3 tsec__h"><span className="tsec__n mono">01</span> Nasıl yapılır?</h2>
            <ol className="steps">{e.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </section>
          <section className="tsec">
            <h2 className="h3 tsec__h"><span className="tsec__n mono">02</span> Doğru teknik için</h2>
            <ul className="ticks">{e.cues.map((s) => <li key={s}>{s}</li>)}</ul>
            {e.mistakes.length > 0 && (
              <>
                <h3 className="h4" style={{ marginTop: 22 }}>Sık yapılan hatalar</h3>
                <ul className="ticks ticks--warn" style={{ marginTop: 8 }}>{e.mistakes.map((s) => <li key={s}>{s}</li>)}</ul>
              </>
            )}
            {e.caution && (
              <div className="note note--warn" style={{ marginTop: 20 }}>
                <Icon name="warn" />
                <p><strong>Dikkat: </strong>{e.caution}</p>
              </div>
            )}
          </section>
          <section className="tsec">
            <h2 className="h3 tsec__h"><span className="tsec__n mono">03</span> Yaşa ve seviyeye göre doz</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Yaş</th><th>1–2★</th><th>3–4★</th><th>5★</th><th>Dinlenme</th></tr>
                </thead>
                <tbody>
                  {BANDS.map((b) => {
                    const ok = allowedInBand(e, b);
                    if (!ok) return <tr key={b}><td>{BAND_NAME[b]}</td><td colSpan={4} className="muted">Bu yaş grubu için önerilmez</td></tr>;
                    return (
                      <tr key={b}>
                        <td>{BAND_NAME[b]}</td>
                        <td>{doseFor(e, b, 2).text}</td>
                        <td>{doseFor(e, b, 3).text}</td>
                        <td>{doseFor(e, b, 5).text}</td>
                        <td>{doseFor(e, b, 3).rest}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="field__hint" style={{ marginTop: 10 }}>Bu dozlar genel başlangıç noktasıdır. Teknik bozulursa set biter; ağrı varsa durun.</p>
          </section>
          {alts.length > 0 && (
            <section className="tsec">
              <h2 className="h3 tsec__h"><span className="tsec__n mono">04</span> Alternatifler</h2>
              <ul className="rel-list">
                {alts.map((a) => (
                  <li key={a.id}>
                    <Link href={`/fiziksel/${a.id}/`} className="card rel">
                      <span className="rel__glyph tag">{EXCAT_NAME[a.cat]}</span>
                      <span className="rel__name">{a.name}</span>
                      <Icon name="arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
