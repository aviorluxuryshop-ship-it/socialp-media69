// Vuruş öncesi vücut pozisyonu — yalnızca topa vuran / kafayla vuran teknikler için.
// Her kayıt ilgili tekniğin kendi adımlarına göre yazılmıştır; ortak metin kopyalanmaz
// (data/validate.ts benzer metinleri derleme sırasında reddeder).
// Anlatımlar sağ ayaklı oyuncu içindir; sol ayaklıda yönler ayna görüntüsüdür.
// Kaynak: genel antrenörlük uygulaması (belirli bir yayına atıf yapılmaz).

export interface BodyPosition {
  /** Topa yaklaşma: adım sayısı, açı, tempo */
  approach: string;
  /** Destek (basma) ayağı: yeri, ayak ucunun yönü, diz */
  support: string;
  /** Gövde: eğim, omuz yönü, bakış */
  torso: string;
  /** Kalça: dönüş ve ağırlık aktarımı */
  hips: string;
  /** Denge: kollar, ağırlık merkezi, vuruş sonrası */
  balance: string;
}

export const BODY_KEYS = ['approach', 'support', 'torso', 'hips', 'balance'] as const;
export type BodyKey = (typeof BODY_KEYS)[number];

export const BODY_LABEL: Record<BodyKey, string> = {
  approach: 'Topa yaklaşma',
  support: 'Destek ayağı',
  torso: 'Gövde',
  hips: 'Kalça',
  balance: 'Denge',
};

/** Kafa vuruşlarında destek ayağı yerine basma / sıçrama ayağı anlatılır */
export const BODY_LABEL_HEAD: Record<BodyKey, string> = {
  ...BODY_LABEL,
  support: 'Basma / sıçrama ayağı',
  hips: 'Kalça ve gövde gerilimi',
};

export const BODY_POSITION: Record<string, BodyPosition> = {
  // ───────────── PAS ─────────────
  'yerden-ic-yuz-pas': {
    approach: 'Topa düz ya da çok hafif açıyla, kısa ve kontrollü adımlarla yaklaşın; son adımda hızı kesip topun yanında sakin durun.',
    support: 'Topun yanında, yaklaşık bir karış uzakta; ayak ucu hedefe dönük, diz hafif bükülü.',
    torso: 'Topun üstünde, hafif öne eğik; omuzlar hedefe dönük, bakış vuruş anında topta.',
    hips: 'Kalça hedefe açık; vuran bacak kalçadan dışa dönerek iç yüzü topla hedef çizgisine hizalar.',
    balance: 'Ağırlık basma ayağında, kollar yanlara hafif açık; vuruştan sonra vücut hedefe doğru akar ve denge bozulmaz.',
  },
  'yumusak-pas': {
    approach: 'Yavaş ve kısa adımlarla yaklaşın; son adım küçük olsun, çünkü amaç güç değil topun ağırlığını ayarlamaktır.',
    support: 'Topa normal pasa göre biraz daha yakın basın; diz esnek, ayak ucu arkadaşın yönüne bakar.',
    torso: 'Rahat ve hafif öne eğik; omuzlar gevşek, bakış topla arkadaş arasında gidip gelir.',
    hips: 'Kalçayı az döndürün; bacak sarkaç gibi küçük bir salınımla çalışır ve topu iter.',
    balance: 'Gövde sabit kalır, ağırlık basma ayağındadır; top yola çıkınca hemen yeni konuma hareket edin.',
  },
  'sert-pas': {
    approach: '2–3 adımlık kısa bir koşuyla gelin; son adım biraz uzun olsun ve hız topa yaklaşırken artsın.',
    support: 'Topun yanında ve hedef çizgisine dönük; pas yere yakın ve hızlı gideceği için diz bükülü, ayak sağlam basılı olmalı.',
    torso: 'Topun üzerinde ve öne eğik; gövde vuruş sırasında sabit kalır, kollar dengeyi sağlar.',
    hips: 'Kalça geriye kurulup vuruşla öne atılır; sert pasın gücü ayaktan çok kalça ve bacak sallanmasından gelir.',
    balance: 'Ağırlık vuruşta basma ayağından vuran ayağa akar; takip hareketinden sonra vuran ayak üstüne inip dengeyi korur.',
  },
  'tek-dokunus-pas': {
    approach: 'Top gelmeden önce omuz üstünden bakıp yeni açıya dönün; topa küçük adımlarla, hareket hâlinde hazırlanın.',
    support: 'Ayak ucu pas yönüne yarı dönük, dizler bükülü; ayak yere çakılı değil, hareketli ve sıçramaya hazır.',
    torso: 'Yarı açık duruş: omuzlar hem gelen topu hem pas hedefini görecek açıda.',
    hips: 'Kalça pas yönüne hafif açık; temas anında sabit kalır, bacak topu hedefe sektirir.',
    balance: 'Hafif öne eğik, ağırlık ayağın ön kısmında; paslayıp yeni konuma geçmek için ağırlığı hemen taşıyın.',
  },
  'ara-pas': {
    approach: 'Koridoru gördükten sonra topa sakin ve hafif açıyla yaklaşın; son adımda başı kısaca kaldırıp hem koridoru hem arkadaşı teyit edin.',
    support: 'Topun yanında, ayak ucu koridorun yönüne tam dönük; dışarı bakarsa pas yolu bozulur.',
    torso: 'Topun üstünde, hafif öne eğik; omuzlar koridora dönük, vuruş anında bakış topta.',
    hips: 'Kalça koridora doğru açık; bacak dışa dönerek iç yüzü hedef çizgisine hizalar.',
    balance: 'Pas yere yakın ve sert olduğundan takip hareketi koridora uzanır; ardından gövde hızla destek koşusuna geçer.',
  },
  'derinlik-pasi': {
    approach: 'Koşucunun hareketini görene dek topun yanında hazır bekleyin; koşu başlayınca 1–2 ritmik adımla yaklaşın.',
    support: 'Topun yanında; ayak ucu koşucunun önündeki boşluğa, savunma ile kaleci arasına dönük.',
    torso: 'Baş yarı kalkık: bir bakış topta, bir bakış koşucuda; gövde hafif öne eğik.',
    hips: 'Kalça koşunun açısına göre açılır; yer pasında bacak kalçadan dışa döner.',
    balance: 'Ağırlık basma ayağında ve dengeli; pasın ağırlığını koşucunun hızına göre ayarlayın, vuruştan sonra yeniden hareket edin.',
  },
  'asirtma-pas': {
    approach: 'Topun biraz gerisinden, kısa ve gizli bir yaklaşmayla gelin; son adımda ayağı topun altına sokacak boşluğu bırakın.',
    support: 'Topun hemen yanında ve ayağınız biraz geride; ayak ucu hedefe dönük, diz bükülü.',
    torso: 'Dik ve hafif geriye yaslı; yükseltme gövdeyle değil, ayak ucunun kısa hareketiyle yapılır.',
    hips: 'Kalça kısa ve kontrollü öne gelir; bacak diz altından yukarı sallanır, kalça geniş dönmez.',
    balance: 'Gövde geriye yaslansa da ağırlık basma ayağında kalır; takip kısa ve yukarıdır, ardından koşucunun ilk dokunuşunu izleyin.',
  },
  'topukla-pas': {
    approach: 'Topa yavaş tempoda, yüzünüz ilerleme yönüne dönükken yaklaşın; arkadaşınızın arkanızda ve yakında olduğunu önceden kontrol edin.',
    support: 'Topun yanında ve hafif önünde; ayak ucu ileri bakar, diz bükülü.',
    torso: 'Dik ya da hafif öne eğik, bakış topta; omuzlar ilerleme yönünde kaldığı için pas niyeti rakibe geç belli olur.',
    hips: 'Kalça ileri bakar; vuran bacak dizden bükülüp topuk topun ortasına hizalanır.',
    balance: 'Tek ayak üzerinde kalındığı için ağırlık tamamen basma ayağındadır; vuruş küçük tutulur ve hemen ilerlemeye devam edilir.',
  },
  'kaldirarak-pas': {
    approach: 'Topun biraz gerisinden ve hafif yandan gelin; son adımı kısa tutup ayak ucunu topun altına yerleştirmek için süre bırakın.',
    support: 'Topun yanında ve hafif geride; ayak ucu hedefe bakar, ağırlığı topa değil basma ayağına verin.',
    torso: 'Dik ya da hafif geriye yaslı; gövdeyi öne atmayın, top kilitli bilekle ayağın alttan yukarı hareketiyle yükselir.',
    hips: 'Kalça sakin kalır ve yalnızca kısa bir ileri-yukarı itiş verir; yükseklik mesafeye göre ayarlanır.',
    balance: 'Takip hareketi kısa ve yukarı doğrudur; gövde dengede kalır, top arkadaşın göğüs hizasına inecek şekilde ayarlanır.',
  },
  'birakma-pasi': {
    approach: 'Topa doğru küçük adımlarla hareket edin; omuz üstünden bakıp desteği ve rakibin yerini görün, topu rakipten uzak tarafta, vücudunuzla koruyarak karşılayın.',
    support: 'Destek ayağı topa bakar, biraz geniş ve sağlam basılı; diz bükülü, rakibe karşı sağlam bir taban oluşturur.',
    torso: 'Hafif öne eğik, rakibe yan dönük bir kalkan gibi; rakibe yaslanmayın, kollar dengeyi kurmak içindir.',
    hips: 'Kalça alçakta, ağırlık merkezi düşük; temas anında kalça sabit, pas yönüne açılan bacak topu yönlendirir.',
    balance: 'Ağırlık iki ayak arasında ve ayağın ön kısmında; rakip omuzla itse de kaymayın, bıraktıktan sonra hemen yeni bir alana geçin.',
  },
  'uzun-pas': {
    approach: 'Topa 3–4 adımlık, hafif çaprazdan (yaklaşık 30–45°) gelin; son adım uzun olsun.',
    support: 'Topun yanında ve topun hafif gerisine; ayak ucu hedefe dönük. Topun biraz gerisine basmak topun yükselmesine yardım eder.',
    torso: 'Vuruş anında hafif geriye yaslanın; omuz kalçanın üzerinden hedefe açılır ve takip hareketiyle öne gelir.',
    hips: 'Kalça geriye kurulup vuruşta güçlü biçimde öne ve hedefe açılır; uzun mesafenin gücü büyük ölçüde kalça-gövde dönüşünden gelir.',
    balance: 'Kollar geniş açık ve zıt kol-bacak birlikte çalışır; vuruştan sonra vuran ayakla öne adım atarak dengeyi sürdürün.',
  },
  'dis-ayak-pasi': {
    approach: 'Topla ilerlerken ya da topun yanından geçerken, vücut yönünü değiştirmeden verin; adım ritmi bozulmasın.',
    support: 'Topun yanında, ayak ucu ilerleme yönüne dönük; diz bükülü.',
    torso: 'Dik ve rakibe dönük kalan gövde; omuzlar pas yönünü göstermez, bakışı gizleyin.',
    hips: 'Kalça ilerleme yönünde kalır; bacak kalçadan içe döner, ayak ucu aşağı-içe çevrilir.',
    balance: 'Ağırlık basma ayağında; ayak bileği sert tutulur ve pastan sonra koşu ritmi kesilmeden devam eder.',
  },
  'kavisli-pas': {
    approach: 'Topa hafif yandan, çapraz bir yaklaşmayla gelin; ayağın topun dış yarısını dıştan içe süpürebileceği boşluğu bırakın.',
    support: 'Topun yanında ve biraz geride; ayak ucu hedefin biraz dışına (rakibin dışına) bakar, diz bükülü.',
    torso: 'Topun yanında, hafif geriye yaslı; omuzlar topun başlayacağı çizgiye (rakibin dışına) dönük başlar ve vuruşla hedefe açılır.',
    hips: 'Kalça önce dışa açılır, vuruşla birlikte çapraza dönerek ayağı topun etrafında süpürür; dönüş (falso) buradan gelir.',
    balance: 'Ağırlık basma ayağında; takip hareketi vücudun çaprazında biter, kollar açık kalır ve gövde sonra hedef yönüne döner.',
  },
  'trivela-pasi': {
    approach: 'Topa hafif yandan, küçük adımlarla ve yavaş gelin; ayak ucunu aşağı-içe çevirmek için zaman bırakın.',
    support: 'Topun biraz yanında ve hafif geride basın ki ayak üstünün dış bölümü topa yandan temas etsin; diz bükülü.',
    torso: 'Dik ve rahat; bakış önce arkadaşta, vuruş anında topta olur; omuzlar topun başlayacağı yöne dönüktür.',
    hips: 'Kalça yerinde sabit kalır; hareket kalçadan çok diz ve ayak bileğinden gelir, vuran bacak kalçadan hafif içe döner.',
    balance: 'Ağırlık basma ayağında; temas kısa ve kontrollüdür, vuruştan sonra ayak yere inip oyuna devam edilir.',
  },

  // ───────────── ŞUT ─────────────
  'sert-sut': {
    approach: 'Topa 30–45° çaprazdan, 3–5 adımlık hızlanan bir koşuyla yaklaşın; son adım diğerlerinden biraz uzun olsun.',
    support: 'Topun yanına, bir karış uzağa ve ayak ucu kaleye dönük basın; diz hafif bükülü, ağırlık ayağın tamamında.',
    torso: 'Topun üzerinde ve öne eğik; baş sabit, bakış vuruş anında topta, omuzlar hedefe dönük.',
    hips: 'Kalça geriye açılıp vuruşla güçlü biçimde öne atılır; gücün büyük kısmı kalça-gövde dönüşünden ve bacağın sallanma zincirinden gelir.',
    balance: 'Zıt kol açık ve ileri uzanır; vuruştan sonra vuran ayağın üstüne iner ve öne bir adım atarsınız.',
  },
  'ic-yuz-plase-sut': {
    approach: 'Yavaş ve kontrollü gelin; topa düz ya da çok hafif açıyla yaklaşın, son adımları sakin tutun.',
    support: 'Topun yanında ve yakın (bir karış); ayak ucu seçtiğiniz köşeye bakar.',
    torso: 'Topun üzerinde, hafif öne eğik ve sabit; omuzlar köşe yönüne dönük.',
    hips: 'Kalça köşeye açık; bacak dışa dönerek iç yüzü topla köşe çizgisine hizalar, güçten çok doğruluk için dönüş sınırlı kalır.',
    balance: 'Ağırlık basma ayağında ve dengelidir; takip hareketi kısa ve yere yakın, hedefe doğrudur.',
  },
  'falsolu-sut': {
    approach: 'Topa 3–4 adımlık, hafif yandan ve açıyla yaklaşın; ayağın topun dış-alt yarısını dıştan içe sarabileceği boşluğu bırakın.',
    support: 'Topun yanında ve biraz geride; ayak ucu hedefin dışına bakar, diz bükülü ve ayak sağlam basılı.',
    torso: 'Hafif geriye yaslı; omuzlar topun başlayacağı çizgiye (hedefin dışına) dönük başlar, vuruşla hedefe açılır.',
    hips: 'Kalça önce dışa açılır, vuruşta çapraz öne dönerek bacağı topun etrafında sarmalar.',
    balance: 'Kollar açık ve ağırlık basma ayağında; takip hareketi vücudun çaprazında bittikten sonra kalçayı hedefe çevirip dengeyi toplayın.',
  },
  'ust-dis-vurus': {
    approach: 'Topa hafif geriden ve yandan, kısa ve ritmik 2–3 adımla gelin; son adım küçük olsun, ayak ucunu içe-aşağı çevirmek için zaman kalsın.',
    support: 'Topun yanında ve hafif gerisinde; çok yakın basmayın, çünkü ayağın dönmesi için yer gerekir.',
    torso: 'Gövdeyi dik ve sabit tutun; omuz çizgisi topun başlayacağı yönü (kavisin ters tarafını) gösterir, bakış vuruş anında topta.',
    hips: 'Kalçanın hareketi sınırlıdır; vuruş diz ve ayak bileğinden gelir, vuran bacak kalçadan hafif içe döner.',
    balance: 'Ağırlık basma ayağında; vuruştan sonra takip kısadır, ayak yere inip denge toplanır.',
  },
  'dis-kenar-sutu': {
    approach: 'Kısa ve hızlı gelin; topa koşarken ya da yan adımlarla, vücudu döndürmeden yaklaşın.',
    support: 'Topun yanında, ayak ucu ileri bakar; diz bükülü, vuran ayağın bileği içe çevrilir.',
    torso: 'Topun üzerinde ve hafif öne eğik; omuzlar kaleye tam dönmediği için şut niyeti geç anlaşılır.',
    hips: 'Kalça yönünü değiştirmez; bacak kalçadan içe dönüp kısa ve sert bir sallama yapar.',
    balance: 'Ağırlık basma ayağında; takip çok kısa tutulur, vuruştan sonra gözünüz topta ve kalecidedir.',
  },
  vole: {
    approach: 'Topun iniş çizgisine erken girin; geri geri değil, yan adımlarla vücudunuzu topun arkasına yerleştirin.',
    support: 'Topun iniş noktasının yanında, diz bükülü; zıplamaya hazır ama ayak yerde kalır.',
    torso: 'Topun arkasında ve hafif öne eğik; baş sabit, bakış topta, kollar dengede.',
    hips: 'Kalça vuruş yönüne açık; vuran bacak kalçadan geriye alınıp kısa bir sallamayla öne gelir.',
    balance: 'Ağırlık basma ayağındadır; vuruş ve takip kısa tutulur, iniş iki ayağa sağlam yapılır.',
  },
  'yarim-vole': {
    approach: 'Topun sekeceği noktayı önceden kestirin ve küçük ritmik adımlarla gelin; son adımı sekmeden hemen önceye denk getirin.',
    support: 'Sekme noktasının hemen yanında; basma ayağı topun yere değdiği yere yakın, diz bükülü.',
    torso: 'Topun üstünde ve öne eğik; top yere bastırılacağı için gövde ileri, omuzlar kale yönünde.',
    hips: 'Kalça önde kalır; bacak kısa sallanır, vuruş anında kalça sabittir.',
    balance: 'Ağırlık hafif öne ve basma ayağında; takip kısa ve yere yakın.',
  },
  'asirtma-sut': {
    approach: 'Kaleciyi görüp yavaşlayın ve topa küçük adımlarla yaklaşın; topu ayağınızın önünde kontrol altında tutun.',
    support: 'Topun biraz gerisinde; ayak ucu hedefe dönük, diz bükülü.',
    torso: 'Dik ve hafif geriye yaslı; bakış önce kalecide, sonra topta.',
    hips: 'Kalça sakin kalır; bacak kısa ve yumuşak bir yukarı sallanma yapar.',
    balance: 'Ağırlık basma ayağında; takip kısa ve yukarı, kaleci hamlesine karşı sakin kalın.',
  },
  'fuze-sut': {
    approach: 'Kısa ve kontrollü 2–3 adımla gelin; kısa yaklaşma temas kontrolünü kolaylaştırır.',
    support: 'Topun yanında, ayak ucu hedefe dönük; diz hafif bükülü ve sağlam.',
    torso: 'Dik ve sabit; omuzlar hedefe dönük, gövde burulmaz.',
    hips: 'Kalça hedefe dönük ve sabit; vücut çaprazdan kıvrılmaz, çünkü dönüş topa falso verir.',
    balance: 'Ağırlık basma ayağında; temas anından hemen sonra bacak durur ve takip hareketi yapılmaz.',
  },
  'uzaktan-sut': {
    approach: '4–5 adımlık hızlanan bir koşuyla, hafif çaprazdan gelin; savunmacı baskısı varsa kararı erken verin.',
    support: 'Topun yanında ve bir karış uzakta; ayak ucu kaleye dönük, diz bükülü; mesafe uzun olduğu için ayağı tam ve sağlam basın.',
    torso: 'Topun üzerinde ve öne eğik; uzak mesafede de gövdeyi geriye atmayın, top yukarı çıkar.',
    hips: 'Kalça geriye açılıp güçlü bir dönüşle öne atılır; gücün büyük kısmı kalça-gövde dönüşünden ve bacağın sallanma zincirinden gelir.',
    balance: 'Zıt kol açık; vuruştan sonra vuran ayak üstüne inilir ve dönen topa göre ceza sahasına hareket edilir.',
  },

  // ───────────── BİTİRİCİLİK ─────────────
  'kaleciyle-karsi-karsiya': {
    approach: 'Başınız yarı kalkık, hızınız ayarlı gelin; kaleciye son anda bakıp plase ya da lob kararını verin, topu önünüzde kontrol altında tutun.',
    support: 'Topun yanında ve yakın; ayak ucu seçtiğiniz köşeye bakar.',
    torso: 'Dik ve sakin, topun üstünde hafif öne; son dokunuşta bakış topta.',
    hips: 'Kalça seçilen köşeye açık; plasede iç yüzü hizalar, lobda daha az dönüş yapar.',
    balance: 'Koşudan vuruşa geçerken yavaşlayıp dengeyi kurun; acele etmek topu kaleciye yönlendirir.',
  },
  'tek-vurus-bitirme': {
    approach: 'Pasın yönünü ve hızını okuyup adımlarınızı ayarlayın; topa küçük ve hızlı adımlarla, gerekirse yan adımla yaklaşın.',
    support: 'Topun gelişine göre hemen yanına basın; ayak ucu kaleye dönük, diz esnek, adım küçük.',
    torso: 'Kaleye açık ve topun üstünde; omuzlar kaleye dönük.',
    hips: 'Kalça kaleye açık; topun hızı zaten yeterli olduğundan dönüş sınırlıdır, yönlendirme önceliklidir.',
    balance: 'Hareket hâlinde ve dengelidir; hazırlık ve takip kısa tutulur.',
  },
  'donerek-bitirme': {
    approach: 'Topu alıp dönerken küçük adımlar atın; ilk dokunuşun yönü sonraki adımlarınızı belirler.',
    support: 'Dönüş küçük adımlarla yapılır; diz ayak ucuyla aynı yönü göstersin, ayak yere sabitlenip burkulmasın.',
    torso: 'Dönüş boyunca gövde topun arkasında kalır; omuzlar önce kaleye açılır.',
    hips: 'Kalça dönüşü önden yönetir; vuruş ayağı topun önüne gelmeden kalça kaleye bakmalıdır.',
    balance: 'Dönüşte ağırlık merkezi alçaktır; ayağı yere sabitleyip gövdeyi çevirmeyin, küçük adımlarla dönün.',
  },
  'seken-topla-bitirme': {
    approach: 'Şuttan sonra kaleye doğru hızlı, küçük adımlarla gidin; topun sekeceği çizgiyi tahmin edip erken hareketlenin.',
    support: 'Topun sekme çizgisinin yanına, gerekirse iki küçük adımla ayarlayarak basın; diz bükülü.',
    torso: 'Öne eğik ve topun üzerinde; omuzlar kaleye dönük.',
    hips: 'Kalça kısa ve sert biçimde öne gelir; geniş bir dönüşe zaman yoktur.',
    balance: 'Küçük adımlar, ağırlık ayağın ön kısmında; dönen topa tepki vermeye hazır olun.',
  },
  'kapali-aci-bitirme': {
    approach: 'Kalecinin duruşunu görüp topa kısa adımlarla yaklaşın; dar açıda adım sayısını azaltmak vuruşu hızlandırır.',
    support: 'Topun yanında; ayak ucu seçtiğiniz boşluğa (kısa ya da uzak direk) bakar, diz bükülü.',
    torso: 'Topun üstünde, gövde seçtiğiniz boşluğa dönük; omuzlar açıya göre döner, bakış vuruş anında topta.',
    hips: 'Kalça dar açıya göre hafif içe açılır; vuruş ayak ucu ya da iç yüzle kısa yapılır.',
    balance: 'Ağırlık basma ayağında; çok dar açıda geri çekme seçeneğini aklınızda tutarak dengeli kalın.',
  },
  'geri-cekmeden-bitirme': {
    approach: 'Geri çekmenin hızını okuyup topa doğru koşarken yavaşlayın; adımlarınızı penaltı noktası bölgesinde topla buluşacak şekilde ayarlayın.',
    support: 'Topla aynı hizada, yanına basın; ayak ucu kaleye bakar ve diz bükülüdür. Topun çok önüne basmak vuruşu yukarı taşır.',
    torso: 'Topun üstünde ve öne eğik; yere yakın şut için gövde yükselmez.',
    hips: 'Kalça kaleye açık; vuruş ilk temasla ve kısa yapılır.',
    balance: 'Koşudan vuruşa geçerken dengeyi toplayın; şuttan sonra dönen topa hareket edin.',
  },
  'baski-altinda-bitirme': {
    approach: 'Savunmacıyı hissederek hızlı ve küçük adımlarla gelin; topu vücudunuzla koruyup vuruş için yer bulun.',
    support: 'Savunmacıdan uzak tarafta, ayak ucu kaleye dönük; geniş ve sağlam basın.',
    torso: 'Alçak ve savunmacıya karşı kalkan gibi; omuz bir an savunmacıyı kapatır, vuruşta kaleye açılır.',
    hips: 'Kalça alçak ve sabit; vuruş kısa ve basittir.',
    balance: 'İtilirseniz kaymamak için ağırlık merkezi düşük kalır; vuruştan sonra çabuk toparlanın.',
  },
  'ortadan-bitiris': {
    approach: 'Ortanın yüksekliğine göre adımları ayarlayın: yerden gelen için topa doğru, havadan gelen için iniş çizgisine erken girin.',
    support: 'Topun yanında ya da iniş noktasında; diz bükülü ve sağlam basılı.',
    torso: 'Topun üstünde, yere yakın vuruş için hafif öne eğik; omuzlar kaleye dönük.',
    hips: 'Kalça sabit ve vuruş kısa; sert vurmak yerine temiz temas hedeflenir.',
    balance: 'Dengeli kalın; bitirdikten sonra dönen top ve kaleci hamlesi için hareket edin.',
  },

  // ───────────── DURAN TOPLAR ─────────────
  'serbest-vurus-duvar-ustu': {
    approach: 'Topa 3–4 adım geriden ve hafif yandan, her seferinde aynı rutinle yaklaşın; adım sayısını ve açıyı sabit tutun.',
    support: 'Topun hafif gerisinde ve yanında; ayak ucu topun başlayacağı yöne (duvarın dışına) bakar, ağırlık sağlam basılı ayakta toplanır.',
    torso: 'Hafif geriye yaslı; omuzlar topun başlayacağı çizgiye dönük, vuruşla hedefe açılır; top durağan olduğu için bakış topta.',
    hips: 'Kalça dışa açılır, vuruşta çapraz öne dönerek bacağı topun etrafına sarar.',
    balance: 'Takip hareketi yukarı ve çapraz gider; kollar açık kalır, vuruştan sonra dönen topa göre hazır olun.',
  },
  'serbest-vurus-duvar-yani': {
    approach: 'Alçak ve yan vuruş için daha yavaş ve düz gelin; 2–3 adım yeterlidir.',
    support: 'Topun yanında, ayak ucu duvarın kenarındaki boşluğa bakar; diz bükülü.',
    torso: 'Topun üstünde ve öne eğik; top yerde kalsın diye gövde topun üzerinde tutulur.',
    hips: 'Kalça az dönüşle çalışır; bacak kısa ve kontrollü sallanır, topa hafif dönüş verilir.',
    balance: 'Ağırlık basma ayağında; takip alçak ve hedefe doğru, kaleci engeline takılmayacak şekilde.',
  },
  'penalti-atisi': {
    approach: 'Her zaman aynı rutinle (adım sayısı, açı, nefes) yaklaşın; köşeyi seçtikten sonra yön değiştirmeyin.',
    support: 'Topun yanında, bir karış uzakta; ayak ucu seçtiğiniz köşeye bakar.',
    torso: 'Topun üstünde ve sakin; omuzlar köşeye dönük, bakış vuruş anında topta.',
    hips: 'Kalça seçilen köşeye açık; plasede iç yüz hizalanır, sert şutta kalça dönüşü artar.',
    balance: 'Ağırlık basma ayağında; nefes verip net vurun, takip hedefe doğru olsun.',
  },
  'korner-ice': {
    approach: 'Topa 3–4 adım geriden ve hafif yandan, sabit bir rutinle gelin; hedef bölgeyi (kısa direk, penaltı noktası, uzak direk) önceden seçin.',
    support: 'Topun yanında ve biraz geride; ayak ucu ceza sahasına bakar, diz bükülü.',
    torso: 'Hafif geriye yaslı; omuzlar hedef bölgeye açık, bakış topta.',
    hips: 'Kalça geriye kurulup çapraz öne açılır; ayak topun yan-alt yarısını sürter ve kavis verir.',
    balance: 'Takip hareketi yukarı ve içe doğru; kollar dengede, vuruştan sonra topun ceza sahasına girişine bakın.',
  },
  'korner-disa': {
    approach: 'İçe kavisli kornerin tersine, topa açıyı değiştirerek yaklaşın; ayağın topun yan kısmına dışa kavis verecek şekilde gelmesine yer bırakın.',
    support: 'Topun yanında ve hafif geride; ayak ucu topun başlayacağı çizgiye, yani kale önüne doğru bakar; kavis topu kaleden uzaklaştırır.',
    torso: 'Omuzlar topun başlayacağı çizgiye dönük; gövde hafif geriye yaslı, bakış topta.',
    hips: 'Kalça kısa ve kontrollü dönerek ayağı topun yan-dışından sürtmeye yönlendirir.',
    balance: 'Ağırlık basma ayağında; takip hareketi dışa doğru uzanır, hücumcuların koşusunu görecek şekilde başı kaldırın.',
  },

  // ───────────── HÜCUM (ORTA / İÇE KESİŞ) ─────────────
  'orta-alcak': {
    approach: 'Kanattan koşarken yavaşlamadan, başınızı kısa süre kaldırıp ceza sahasını görün; son adım küçük olsun.',
    support: 'Topun yanında, ayak ucu ortanın yönüne dönük; diz bükülü.',
    torso: 'Topun üstünde ve hafif öne eğik; omuzlar ceza sahasına açık.',
    hips: 'Kalça ortanın yönüne açık; iç yüzle sert ve yere yakın vuruş için bacak kalçadan dışa döner.',
    balance: 'Koşu hızını taşıyarak vurun; ağırlık basma ayağındadır, takip hedefe doğru uzanır ve sınır çizgisini aşmamaya dikkat edilir.',
  },
  'orta-yuksek': {
    approach: 'Topa hafif yandan ve açıyla yaklaşın; iniş noktasını (uzak direk ya da penaltı noktası) önceden belirleyin.',
    support: 'Topun yanında ve biraz geride; ayak ucu uzak direğe doğru bakar.',
    torso: 'Hafif geriye yaslı; omuzlar topun iniş bölgesine açık, bakış topta.',
    hips: 'Kalça geriye kurulup çapraz öne atılır; topun alt-yan yarısına sürtülerek kavis verilir.',
    balance: 'Takip hareketi yukarı ve çapraz; kollar açık kalır, vuruştan sonra ceza sahasına bakın.',
  },
  'geri-cekme': {
    approach: 'Kale çizgisine yakın, hız kesmeden ve başı kaldırarak gelin; topu ayağınıza yakın tutun.',
    support: 'Topun yanında ve hafif önünde; ayak ucu kale çizgisine paralel, diz bükülü.',
    torso: 'Hafif öne eğik; omuzlar kale çizgisine ya da şuta devam edecekmiş gibi dönük, bu da savunmacıyı yanıltır.',
    hips: 'Kalça içe dönük; bacak iç yüzle topu yere yakın ve orta hızda geri çeker.',
    balance: 'Hız yüksek olduğundan ağırlık merkezi alçak kalır; geri çektikten sonra vücut sınır çizgisinden uzak ve dengeli kalır, hızınız sizi çizgi dışına taşımasın.',
  },
  'iceri-kesip-sut': {
    approach: 'Kanatta savunmacıya yaklaşırken kısa adımlar atın; gövde çalımıyla dışa gidip topu içe kesmeye hazırlanın.',
    support: 'Destek ayağı topun yanında, ayak ucu kaleye dönmeye başlar; diz ayak ucuyla aynı yönü göstersin, ayağı yere sabitleyip burkmayın.',
    torso: 'Kesişte omuz içe kapanır; şuttan hemen önce omuzlar kaleye açılır.',
    hips: 'Kalça içe döner ve şuta geçerken hızla kaleye açılır.',
    balance: 'Yön değiştirirken ağırlık alçak ve ayağın ön kısmındadır; şuttan önce yeni dengeyi kurmak için bir adım atılır.',
  },

  // ───────────── KAFA VURUŞLARI ─────────────
  'alin-kafa': {
    approach: 'Topun yönüne dönün ve küçük adımlarla topun iniş çizgisine girin; gözleriniz açık, ağzınız kapalı olsun.',
    support: 'Ayaklar omuz genişliğinde, biri hafif önde; dizler hafif bükülü.',
    torso: 'Gövde hafifçe geriye gerilir, vuruşla öne atılır (yay gibi); boyun sert, çene hafif içe.',
    hips: 'Kalça geriye gelip vuruşla öne itilir; güç yalnızca boyundan değil, kalça ve gövdeden gelir.',
    balance: 'Ayaklar yere basılıdır; temastan sonra dengeyi koruyun, gözleriniz açık kalsın. Küçük yaşlarda hafif, düşük hızlı toplarla ve antrenör gözetiminde çalışın.',
  },
  'savunma-kafasi': {
    approach: 'Topun çizgisine kaleye göre doğru tarafta, yani top ile kale arasında girin; son adımda sıçramaya hazırlanın.',
    support: 'Sıçrama ayağı sağlam ve topun geleceği yönde; tek ayaktan ya da iki ayaktan çıkabilirsiniz.',
    torso: 'Gövde geriye gerili, göğüs önde; boyun sert, çene içe.',
    hips: 'Kalça öne itilir, gövde bir yay gibi gerilir; vuruşla birlikte öne atılır.',
    balance: 'Topa ve rakibe bakın; kafa ya da dirsek çarpışma riski varsa sıçramayın. Kollar rakibe vurmadan dengeyi sağlar; inişte iki ayakla yere basın.',
  },
  'ziplayarak-kafa': {
    approach: 'Topun inişini okuyup 2–3 adımlık kısa bir koşuyla gelin; sıçrama zamanını topun gelişine göre ayarlayın.',
    support: 'Sıçrama ayağı yere dik ve sağlam basılır; tek ya da iki ayaktan çıkılır, kollar yukarı yönelir.',
    torso: 'Sıçramada gövde dik; en yüksek noktada hafifçe geriye gerilip vuruşla öne atılır.',
    hips: 'Kalça yukarı itilir, vuruş anında öne atılır; sıçramayı bacak ve kalça itişi birlikte sağlar.',
    balance: 'Kollar dengeyi sağlar ve rakibe vurmaz; iniş iki ayakla ve yumuşak yapılır. Küçük yaşlarda hafif toplarla ve antrenör gözetiminde çalışın.',
  },
  'kafa-uzatma': {
    approach: 'Topun gelişine bakarak sıçrama zamanını ayarlayın; hızlı ama kontrollü adımlarla topun hizasına gelin.',
    support: 'Basma ayağı topun hizasında ve sağlam; çıkış tek ya da iki ayaktan olabilir.',
    torso: 'Başınız topa dönük, gözler açık, boyun sert; temas anında baş ve gövde birlikte hafifçe yana döner.',
    hips: 'Kalça yan tarafa hafif açılır, gövdeyle birlikte topu sıyırma yönüne eşlik eder.',
    balance: 'Temas kısa ve yan olduğundan denge kolay bozulur; kollar rakibe vurmadan dengede kalır, inişe hazır olun.',
  },
  'kafa-ile-bitirme': {
    approach: 'Ortanın yönünü okuyup savunmacıdan önce doğru bölgeye hareket edin; son adımda sıçramayı zamanlayın.',
    support: 'Sıçrama ayağı sağlam basılır; savunmacıdan önce topa ulaşın, itmeyin.',
    torso: 'Gövde topa doğru ileri atılır; topun üst yarısına vurmak için baş topun üstüne gelir.',
    hips: 'Kalça geriden öne itilir; gövde ve baş bir bütün olarak topa gider.',
    balance: 'Kollar rakibe vurmadan dengeyi sağlar; vuruştan sonra iniş için hazır olun ve gözleriniz açık kalsın.',
  },
  'ucarak-kafa': {
    approach: 'Topun alçak gelişini erken okuyup topa doğru hareket edin; yalnızca antrenmanda, yumuşak zeminde, rakipsiz ve antrenör gözetiminde çalışılır; küçük yaşlarda öğretilmez, maçta denenmez.',
    support: 'Son adımdan sonra ayaklar yerden kesilir; vücut havada olduğu için hazırlık ve zamanlama her şeydir.',
    torso: 'Kollar öne uzanır, gövde yere paralel; boyun sert, bakış topta.',
    hips: 'Kalça gövdeyle aynı hizada kalır; vücut tek parça olarak öne atılır.',
    balance: 'İnişte önce kollar ve göğüs yere yumuşakça iner; yüzünüzü yere vurmayın. Bu teknik yalnızca nitelikli gözetimle ve yumuşak zeminde çalışılır.',
  },
  'kafa-ile-indirme': {
    approach: 'Topun iniş noktasına erken konumlanın; gözleriniz topta, vücut topun altında.',
    support: 'Ayaklar omuz genişliğinde, dizler yumuşatma için bükülmeye hazır; sıçramaya gerek yoktur.',
    torso: 'Gövde başın hareketini takip eder; temas anında baş ve gövde birlikte hafifçe aşağı çekilir.',
    hips: 'Kalça ve dizler topun gücünü yumuşatmak için hafifçe çöker.',
    balance: 'Topu ayağınızın önüne indirdikten sonra hemen sonraki harekete geçmek için ağırlık ayağın ön kısmındadır.',
  },
};
