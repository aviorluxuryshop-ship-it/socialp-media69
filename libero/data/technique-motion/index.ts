import type { TechMotion } from '@/lib/motion/timeline';

// Teknik hareket kayıt defteri: teknik kimliği → TechMotion. Biçim ve yazım kuralları için README.md.
// Yeni hareket eklerken yalnızca KENDİ kategorinizin işaretinin altına bir import ve bir kayıt satırı ekleyin
// (işaretler birbirinden uzak olduğundan paralel dallar çakışmadan birleşir; başka kategoriye dokunmayın).

// [pas]
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
