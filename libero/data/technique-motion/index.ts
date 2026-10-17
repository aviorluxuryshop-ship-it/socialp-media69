import type { TechMotion } from '@/lib/motion/timeline';

// Teknik hareket kayıt defteri: teknik kimliği → TechMotion. Biçim ve yazım kuralları için README.md.
// Yeni hareket eklerken yalnızca KENDİ kategorinizin işaretinin altına bir import ve bir kayıt satırı ekleyin
// (işaretler birbirinden uzak olduğundan paralel dallar çakışmadan birleşir; başka kategoriye dokunmayın).

// [pas]

// [sut]

// [kontrol]
import { ILK_TEMAS } from './ilk-temas';

// [surme]

// [kafa]

// [bitiricilik]

// [hucum]

// [savunma]

// [kalecilik]

// [duran]

// [topsuz]

export const MOTIONS: Record<string, TechMotion> = {
  // [pas]

  // [sut]

  // [kontrol]
  'ilk-temas': ILK_TEMAS,

  // [surme]

  // [kafa]

  // [bitiricilik]

  // [hucum]

  // [savunma]

  // [kalecilik]

  // [duran]

  // [topsuz]
};
