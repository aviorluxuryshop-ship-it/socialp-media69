import { hasPlan, trailAt, type Frame, type TechMotion } from '@/lib/motion/timeline';
import { Figure } from './Figure';
import { PlanView } from './PlanView';

/**
 * Sahne: yandan çizim + (gerekirse) "Üstten bakış" kutusu + görünüm rozeti.
 * Oynatıcı ve statik şerit aynı sahneyi kullanır; durum yok, her şey `frame`den gelir.
 */
export function Stage({ m, frame, label, planLabel, trail = true }: { m: TechMotion; frame: Frame; label: string; planLabel: string; trail?: boolean }) {
  const plan = hasPlan(m);
  return (
    <div className="tm__stage">
      <Figure m={m} frame={frame} trail={trail ? trailAt(m, frame.t) : undefined} label={label} />
      {plan && (
        <div className="tm__plan">
          <PlanView m={m} frame={frame} label={planLabel} />
          <span className="tm__plan-t mono" aria-hidden="true">
            Üstten bakış
          </span>
        </div>
      )}
      <span className="tm__view mono">Sağ ayaklı oyuncu · sağdan görünüm</span>
    </div>
  );
}
