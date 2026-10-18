import type { TechMotion } from '@/lib/motion/timeline';

// Teknik hareket kayıt defteri: teknik kimliği → TechMotion. Biçim ve yazım kuralları için README.md.
// Yeni hareket eklerken yalnızca KENDİ kategorinizin işaretinin altına bir import ve bir kayıt satırı ekleyin
// (işaretler birbirinden uzak olduğundan paralel dallar çakışmadan birleşir; başka kategoriye dokunmayın).

// [pas]
import { YERDEN_IC_YUZ_PAS } from './yerden-ic-yuz-pas';
import { KAVISLI_PAS } from './kavisli-pas';
import { TRIVELA_PASI } from './trivela-pasi';
import { UZUN_PAS } from './uzun-pas';

// [sut]
import { SERT_SUT } from './sert-sut';

// [kontrol]
import { ILK_TEMAS } from './ilk-temas';

// [surme]

// [kafa]
import { ALIN_KAFA } from './alin-kafa';

// [bitiricilik]

// [hucum]

// [savunma]

// [kalecilik]

// [duran]

// [topsuz]

export const MOTIONS: Record<string, TechMotion> = {
  // [pas]
  'yerden-ic-yuz-pas': YERDEN_IC_YUZ_PAS,
  'kavisli-pas': KAVISLI_PAS,
  'trivela-pasi': TRIVELA_PASI,
  'uzun-pas': UZUN_PAS,

  // [sut]
  'sert-sut': SERT_SUT,

  // [kontrol]
  'ilk-temas': ILK_TEMAS,

  // [surme]

  // [kafa]
  'alin-kafa': ALIN_KAFA,

  // [bitiricilik]

  // [hucum]

  // [savunma]

  // [kalecilik]

  // [duran]

  // [topsuz]
};
