'use client';

import Link from 'next/link';
import type { Video } from '@/data/video-build';
import { VIDEO_TOPIC_NAME } from '@/data/video-topics';
import { buildVideoPanel, type PanelPlayer } from '@/lib/player-video';
import { videoBadges } from '@/lib/video-honesty';
import { VideoCard } from './VideoCard';

export type RailPlayer = PanelPlayer & { id: string };

/** Video penceresindeki yan panel: bu videoda oyuncuda neye bakılacağı + dürüstlük bilgileri */
export function PlayerVideoPanel({ player, video }: { player: RailPlayer; video: Video }) {
  const m = buildVideoPanel(player, video);
  const badges = videoBadges(video);
  return (
    <div className="pvp">
      <p className="eyebrow">{player.name} · Bu videoda bak</p>
      <p className="pvp__intro">{m.intro}</p>
      <ul className="ticks">
        {m.look.map((t) => <li key={t}>{t}</li>)}
      </ul>
      {m.sharedTechs.length > 0 && (
        <div className="pvp__techs">
          <p className="mono muted">Bu videodaki teknik {player.name} sayfasında da var</p>
          <ul className="chips">
            {m.sharedTechs.map((t) => <li key={t.id}><Link className="chip" href={`/teknikler/${t.id}/`}>{t.name}</Link></li>)}
          </ul>
        </div>
      )}
      <div className="pvp__sum">
        <p className="eyebrow">Videonun Türkçe özeti · {VIDEO_TOPIC_NAME[video.topic]}</p>
        <p>{video.summary}</p>
        <ul className="vbadges" aria-label="Video bilgileri">
          {badges.filter((b) => b.id !== 'embed').map((b) => <li key={b.id} className={`vbadge vbadge--${b.tone}`} title={b.hint}><span>{b.label}</span></li>)}
        </ul>
      </div>
      <p className="note note--info pvp__note">
        <span>
          Bu panelde zaman kodu göstermiyoruz: videonun bölüm bilgilerini okumadık. İlgilendiğin anları pencerenin <strong>Kişisel notların</strong> bölümüne kendin ekleyebilirsin; süreler senin olur.
        </span>
      </p>
    </div>
  );
}

/** Oyuncu sayfasındaki "Videolar" rayı: yeni kapaklı kartlar; açılınca yan panelde oyuncunun analizi */
export function PlayerVideoRail({ player, videos }: { player: RailPlayer; videos: Video[] }) {
  return (
    <ul className="vrail" aria-label={`${player.name} için ilgili videolar`}>
      {videos.map((v) => (
        <li key={v.id}>
          <VideoCard video={v} sidePanel={<PlayerVideoPanel player={player} video={v} />} />
        </li>
      ))}
    </ul>
  );
}

