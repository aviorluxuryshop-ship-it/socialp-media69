import { TECH_BY_ID } from './index';
import { validatePlayers } from './player-check';
import { PLAYERS, PLAYER_BY_ID } from './players';
import { VIDEOS } from './videos';
import { DEEP_ATT } from './player-deep/att';
import { DEEP_BARCA } from './player-deep/barca';
import { DEEP_DEF } from './player-deep/def';
import { DEEP_MID } from './player-deep/mid';

/**
 * Derleme sırasında oyuncu verisini denetler (sayfalar bu dosyayı içe aktarır).
 * Hata varsa derleme durur: eksik bölüm, kaynaksız oyuncu, doğrulanmamış video, yasak dil…
 */
const errs = validatePlayers(PLAYERS, {
  techIds: new Set(Object.keys(TECH_BY_ID)),
  videoTopics: Object.fromEntries(VIDEOS.map((v) => [v.id, v.topic])),
});
const orphans = Object.keys({ ...DEEP_BARCA, ...DEEP_MID, ...DEEP_ATT, ...DEEP_DEF }).filter((id) => !PLAYER_BY_ID[id]);
if (orphans.length) errs.push(`derin bölümü olup oyuncusu olmayan kimlikler: ${orphans.join(', ')}`);
if (errs.length) throw new Error('players: oyuncu verisi geçersiz:\n - ' + errs.join('\n - '));

export const PLAYERS_CHECKED = true;
