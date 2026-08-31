import { Picture } from './Picture';

export type Variant = 'video' | 'photo' | 'edit' | 'social' | 'post' | 'ads' | 'web';

/**
 * Per-service depth visuals.
 *
 * Each service gets a distinct spatial idea rather than a shared card. These are
 * built from real CSS 3D (`perspective` + `translateZ`), so the planes genuinely
 * sit at different distances and separate as the pointer moves — they reuse the
 * existing `data-depth` / `data-parallax` attributes the motion engine already
 * drives, so no new animation code is needed.
 *
 * There is no WebGL here: the site's only 3D scene is the exploded view inside
 * Hakkımızda, and only on desktop.
 */
export function ServiceVisual({ variant, alts }: { variant: Variant; alts: Record<string, string> }) {
  const shell = 'stage relative aspect-[4/3] w-full';
  const inner = 'stage-inner absolute inset-0';

  if (variant === 'video') {
    // Behind-the-scenes production plates, stepping back into depth.
    const plates: [string, string, number, number][] = [
      ['showroom-otomotiv', 'left-[4%] top-[8%] w-[48%]', -140, 16],
      ['mekan-video-kurulum', 'right-[6%] top-[22%] w-[42%]', 40, 30],
      ['icerik-hazir', 'left-[26%] bottom-[6%] w-[34%]', 130, 44],
    ];
    return (
      <div className={shell}>
        <div data-tilt="5" className={inner}>
          {plates.map(([id, pos, z, depth]) => (
            <div key={id} data-depth={depth} className={`absolute ${pos}`} style={{ transform: `translateZ(${z}px)` }}>
              <div className="media aspect-[3/4] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)]">
                <Picture id={id} alt={alts[id] ?? ''} sizes="24vw" className="cover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'photo') {
    // Three photo plates fanned back into depth.
    const plates: [string, string, number, number][] = [
      ['guzellik-merkezi', 'left-[6%] top-[10%] w-[46%]', -180, 14],
      ['studyo-sanat', 'left-[30%] top-[24%] w-[44%]', -60, 26],
      ['kamera-detay', 'left-[54%] top-[6%] w-[38%]', 60, 38],
    ];
    return (
      <div className={shell}>
        <div data-tilt="5" className={inner}>
          {plates.map(([id, pos, z, depth]) => (
            <div
              key={id}
              data-depth={depth}
              className={`absolute ${pos}`}
              style={{ transform: `translateZ(${z}px)` }}
            >
              <div className="media aspect-[3/4] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)]">
                <Picture id={id} alt={alts[id] ?? ''} sizes="22vw" className="cover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'edit') {
    // An editing timeline: filmstrip, playhead and a waveform, layered in Z.
    return (
      <div className={shell}>
        <div data-tilt="4" className={inner}>
          <div data-depth="16" className="absolute inset-x-[6%] top-[12%]" style={{ transform: 'translateZ(-40px)' }}>
            <div className="media aspect-[16/9] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)]">
              <Picture id="roportaj-stüdyo" alt={alts['roportaj-stüdyo'] ?? ''} sizes="30vw" className="cover" />
            </div>
          </div>
          {/* Filmstrip of cut frames */}
          <div data-depth="30" className="absolute inset-x-[4%] bottom-[20%]" style={{ transform: 'translateZ(50px)' }}>
            <div className="flex gap-1.5 border border-white/12 bg-black/85 p-1.5 backdrop-blur-sm">
              {['kafe-tanitim', 'konsept-editorial', 'icerik-hazir', 'cekim-kamera', 'mekan-isik'].map((id, i) => (
                <div key={id} className={`media aspect-square flex-1 ${i === 2 ? 'ring-1 ring-[#3ECF8E]' : ''}`}>
                  <Picture id={id} alt="" sizes="8vw" className="cover" />
                </div>
              ))}
            </div>
            {/* Playhead */}
            <div className="relative mt-2 h-6 border-t border-white/12">
              <span className="absolute left-[46%] top-0 h-6 w-px bg-[#3ECF8E]" />
              <span className="absolute left-[46%] top-0 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-[#3ECF8E]" />
              <div className="flex h-6 items-end gap-[3px] pt-1">
                {[4, 9, 6, 14, 8, 17, 7, 12, 5, 15, 9, 6, 13, 7, 11, 4, 10, 6, 16, 8].map((v, i) => (
                  <span key={i} className="flex-1 bg-white/22" style={{ height: `${v}px` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'social') {
    // A phone plane floating in front of the feed it publishes to.
    return (
      <div className={shell}>
        <div data-tilt="6" className={inner}>
          <div data-depth="12" className="absolute left-[4%] top-[8%] w-[42%]" style={{ transform: 'translateZ(-120px)' }}>
            <div className="media aspect-[4/5] opacity-55">
              <Picture id="ekip-salon" alt={alts['ekip-salon'] ?? ''} sizes="20vw" className="cover" />
            </div>
          </div>
          <div data-depth="22" className="absolute right-[6%] top-[26%] w-[34%]" style={{ transform: 'translateZ(-40px)' }}>
            <div className="media aspect-[4/5] opacity-70">
              <Picture id="cekim-studyo" alt="" sizes="18vw" className="cover" />
            </div>
          </div>
          {/* Phone */}
          <div
            data-depth="42"
            className="absolute left-1/2 top-[12%] w-[30%] -translate-x-1/2"
            style={{ transform: 'translateZ(90px)' }}
          >
            <div className="rounded-[1.6rem] border border-white/18 bg-black p-1.5 shadow-[0_40px_100px_-24px_rgba(0,0,0,0.95)]">
              <div className="media aspect-[9/19] overflow-hidden rounded-[1.2rem]">
                <Picture id="nail-dergi" alt={alts['nail-dergi'] ?? ''} sizes="16vw" className="cover" />
                <span className="absolute left-1/2 top-1.5 h-1 w-8 -translate-x-1/2 rounded-full bg-white/35" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'post' || variant === 'ads') {
    // A deck of content frames stepping back into space.
    const ids =
      variant === 'post'
        ? ['instagram-tepsi', 'telefon-tepsi', 'fon-perde']
        : ['meta-tepsi', 'bilboard-mockup', 'sokak-tabela'];
    const steps: [string, number, number, string][] = [
      ['left-[2%] top-[20%] w-[40%]', -150, 12, 'opacity-45'],
      ['left-[28%] top-[10%] w-[44%]', -20, 26, 'opacity-75'],
      ['right-[2%] top-[26%] w-[38%]', 110, 40, ''],
    ];
    return (
      <div className={shell}>
        <div data-tilt="5" className={inner}>
          {steps.map(([pos, z, depth, dim], i) => (
            <div key={ids[i]} data-depth={depth} className={`absolute ${pos}`} style={{ transform: `translateZ(${z}px)` }}>
              <div className={`media aspect-[4/5] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.9)] ${dim}`}>
                <Picture id={ids[i]} alt={alts[ids[i]] ?? ''} sizes="20vw" className="cover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // web
  return (
    <div className={shell}>
      <div data-tilt="4" className={inner}>
        <div data-depth="14" className="absolute inset-x-[8%] top-[14%]" style={{ transform: 'translateZ(-60px)' }}>
          <div className="media aspect-[16/10] opacity-60">
            <Picture id="mekan-isik" alt="" sizes="28vw" className="cover" />
          </div>
        </div>
        <div data-depth="34" className="absolute left-[16%] top-[26%] w-[62%]" style={{ transform: 'translateZ(70px)' }}>
          <div className="border border-white/14 bg-black/90 shadow-[0_40px_100px_-24px_rgba(0,0,0,0.95)]">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#3ECF8E]" />
            </div>
            <div className="media aspect-[16/10]">
              <Picture id="bilboard-mockup" alt={alts['bilboard-mockup'] ?? ''} sizes="24vw" className="cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
