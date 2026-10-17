import type { PlayerDeep } from '../player-types';
import { cv, wiki } from './_src';

/** Derinleştirilmiş bölümler: orta saha ve yaratıcı oyuncular */
export const DEEP_MID: Record<string, PlayerDeep> = {
  'luka-modric': {
    kind: 'oyun-kurucu',
    positioning: [
      'Orta sahanın merkezinden oyunu yönetir; ileri oyun kurucu olarak başlayıp zamanla daha geride, oyunu kuran bölgeye kaymıştır.',
      'Çalışkandır: gerektiğinde geri dönüp topu kazanır ve hemen hücuma hazırlanır; bu çok yönlülük onu farklı orta saha rollerinde kullanılabilir yapar.',
    ],
    passing: [
      'Hızlı ve isabetli paslar verir; dış ayak ve “trivela” benzeri vuruş yüzeyleriyle hem kısa hem uzun pas oynar.',
      'Golden bir önceki pasa, yani “ön asist”e katkı yapar: takım arkadaşlarına şut ya da kilit pas için zaman ve alan yaratır.',
      'Duran toplarda, özellikle kornerlerde ve kanat serbest vuruşlarında etkilidir.',
    ],
    control: [
      'Baskı altında sakin kalır ve rakibin müdahalesinden sıyrılır.',
      'Topu aldığı anda yönünü çevirip baskıyı dönüşle atlatabilir.',
    ],
    decisions: [
      'Alanı yorumlama ve taktik zekâ: ne zaman geri düşüp topu alacağını, ne zaman ileri çıkacağını seçer.',
      'Kısa ve uzun pası aynı vücut duruşundan verebildiği için rakip hangisinin geleceğini zor tahmin eder.',
    ],
    strengths: ['Sakinlik ve baskı altında top kontrolü.', 'Pas çeşitliliği: iç yüz, dış yüz, kısa, uzun.', 'Oyun görüşü ve çalışkanlık.'],
    limits: [
      'Küçük yapılı bir oyuncudur; fiziksel mücadeleyi değil konum, denge ve zekâyı öne çıkarır.',
      'Taklit ederken dikkat: dış ayak ve trivela gibi seçenekler çok tekrar ister; önce temel iç yüz pası ve karşılamayı oturt.',
    ],
    similar: ['xavi-hernandez', 'toni-kroos', 'andrea-pirlo'],
    sources: [wiki('Luka Modrić', 'Luka_Modri%C4%87', 'Oyun tarzı ve pozisyon bölümleri: yaratıcı oyun kurucu, “ön asist”, dış ayak/trivela pas, derin oyun kurucu rolü, çalışkanlık.')],
    videos: ['seiqevv2JuU', 'uA8cLwI_CQI', 'vf0AkYAL6Ig', 'SSw2jVVD8uc'],
    videoLooks: {
      pas: 'Modrić’te paslarında hangi vuruş yüzeyini seçtiğine ve aynı duruştan hem kısa hem uzun pas verip vermediğine bak; videodaki uzun pas tekniğiyle karşılaştır.',
      sut: 'Modrić ayağın dış yüzüyle (trivela) hem pas hem şut oynayabilir. Videodaki vuruş yüzeyini onun paslarında ara.',
      topsuz: 'Videodaki tarama alışkanlığını Modrić’te ara: topu almadan önce başını nereye çeviriyor, almadan önce yönünü seçmiş mi?',
      taktik: 'Modrić pas verdikten sonra yeniden topa ulaşılabilir kalır. Videodaki orta saha ilkeleriyle bu davranışı eşleştir.',
    },
  },

  'toni-kroos': {
    kind: 'oyun-kurucu',
    positioning: [
      'Merkezde derin oyun kurucu olarak durur; kariyerine daha ileri bir orta saha olarak başlayıp zamanla daha geride oynamaya kaymıştır.',
      'Hem top kapma hem oyun kurma özelliklerini taşıdığı için bazen savunma önünde (defansif orta saha) de oynamıştır.',
    ],
    passing: [
      'Pasın menzili ve isabeti ile tanınır: kısa pasla oyunu kontrol eder, uzun pasla atağı başlatır.',
      'Duran top ve kanat ortalarında da gol yaratır.',
    ],
    control: [
      'Baskı altında gelen pası “koşuyu sürdüren ilk dokunuş”la karşılar: topu rakibin yanından geçirip kendine alan açar; hızlı olmadığı hâlde rakibi bu şekilde atlatır.',
      'Topu alırken vücut açısını önceden hazırlar; ilk dokunuş hemen pas ya da yön değişimine dönüşür.',
    ],
    decisions: [
      'Acele etmez; oyunun nereye gideceğine topu almadan karar verir.',
      'Çoğu zaman en iyi karar “bir dokunuş daha”dır: gereksiz süslemeden temiz bir pasla oyunu açar.',
    ],
    strengths: ['Pasın menzili ve isabeti.', 'Sakinlik; baskı altında az dokunuşla oynama.', 'Fiziksel olarak güçlü ve farklı orta saha rollerinde kullanılabilir.'],
    limits: [
      'Hız avantajı yoktur; ilk dokunuş hilesi ve konumla bunu kapatır.',
      'Taklit ederken dikkat: az dokunuşla oynamak çok iyi bir tarama ve vücut açısı ister; önce taramayı alışkanlık yap.',
    ],
    similar: ['luka-modric', 'andrea-pirlo', 'hakan-calhanoglu'],
    sources: [wiki('Toni Kroos', 'Toni_Kroos', 'Oyun tarzı: derin oyun kurucu, pasın menzili ve isabeti, koşuyu sürdüren ilk dokunuş, duran top.')],
    videos: ['seiqevv2JuU', '5GdObYQTDqQ', 'efdxdNxqBQI', 'VbMqw-9nIEQ'],
    videoLooks: {
      pas: 'Kroos’ta uzun pasın yüksekliğine ve hızına, topa hangi yüzeyle değdiğine bak. Videodaki uzun pas tekniğini bu ayrıntılarla karşılaştır.',
      kontrol: 'Kroos topu durdurmadan koşunun yönüne alır. Videodaki ilk temas alıştırmalarında topu ilerisine bırakmayı dene.',
      duran: 'Kroos duran topu rastgele değil planla oynar. Videodaki kornerde topun yüksekliğine ve hedef alana bak.',
      taktik: 'Videodaki pozisyon alma fikrini Kroos’ta ara: pas vermeden önce kaç kez başını çeviriyor?',
    },
  },

  'ngolo-kante': {
    kind: 'denge',
    positioning: [
      'Orta sahada çok geniş bir alanı kapatır; bunu hızdan çok konum duygusu, topsuz hareket ve oyun okumasıyla yapar.',
      'Rolü tek bir etikete sığmaz: derin ya da çift pivot, ileri çıkan iç orta saha gibi farklı dizilimlerde kullanılmıştır.',
    ],
    passing: [
      'Topu kazandıktan sonra basit ve hızlı oynar; ilk tercihi ileri dönük, güvenli bir pastır.',
      'Dönüp öne bakarak pas vermeyi sever; dar açıda ve geriye doğru paslarda isabet ve ağırlık daha zordur, bu yüzden bazı pasları zorlayabilir.',
    ],
    control: [
      'Çevik ayaklarıyla dar alandan çıkar; topu kazandıktan sonra boşluk görünce hemen hızlanır.',
      'Topu kazandıktan sonra gereksiz süslemeden ilerler; ilk dokunuş ileriye doğrudur.',
    ],
    decisions: [
      'Rakibin bakışını ve vücut duruşunu okuyup araya girmeyi önceden planlar.',
      'Üçüncü adam ve kanal koşularıyla, rakip derin oynadığında ceza alanına da girebilir.',
    ],
    strengths: ['Tahmin ve topsuz oyun okuması.', 'Pas yolu kesme, müdahale ve top geri kazanımı.', 'Enerji; topu kazanınca geçişi başlatabilme.'],
    limits: [
      'En iyi, aktif ve agresif kapama anlarında etkilidir; sakin pas yönetimi ona en uygun iş değildir.',
      'Taklit ederken dikkat: çok koşmak değil, doğru zamanda doğru yerde olmak önemlidir; önce okumayı ve konumu çalış.',
    ],
    similar: ['rodri', 'sergio-busquets', 'paolo-maldini'],
    sources: [
      wiki('N’Golo Kanté', 'N%27Golo_Kant%C3%A9', 'Oyun tarzı: topu geri kazanma, konum duygusu, oyun okuma, geçişleri başlatma, farklı orta saha rolleri.'),
      cv(
        'Tactical Rant — Always Turning Forward: The Underrated Offense of N’Golo Kanté (Om Arvind, 5 Nisan 2022)',
        'https://tacticalrant.substack.com/p/underrated-offense-ngolo-kante',
        'Tahmin ve alan farkındalığı, topu kazandıktan sonra taşıma, “tempo bozan” özelliği, dar açıda pas zorluğu.',
      ),
    ],
    videos: ['GlOUrEdGLrU', 'tLHYYrACx3s', 'hgrStIbFls0', 'eqY-BdErllw', 'LtyS7DZ14N4'],
    videoLooks: {
      taktik: 'Kanté’de araya girmeden önce rakibin ve kendisinin vücut açısına bak. Videodaki orta saha anlatımıyla karşılaştır.',
      savunma: 'Kanté mücadeleye girmeden önce pas yolunu kapatır. Videodaki savunma duruşunu ve ayakların konumunu onunla eşleştir.',
    },
  },

  rodri: {
    kind: 'denge',
    positioning: [
      'Çoğunlukla tek pivot olarak topun arkasında kalır; top kaybında savunmayı korur.',
      'Kuruluşta bazen stoperlerin arasına ya da yanına inerek kurulumu rahatlatır; takımın yapısına göre bir ya da iki pivot arasında değişebilir.',
    ],
    passing: [
      'Baskı altında rahatça dağıtır; çok cesur pasları çoğunlukla ilerideki oyunculara bırakır ama hat kıran dikey paslar ve arkaya doğru kavisli aşırtma pas da deneyebilir.',
      'Oyunun temposunu belirler: ne zaman hızlandırıp ne zaman sakinleştireceğini seçer.',
    ],
    control: [
      'Güçlü gövdesini topla rakip arasına koyar; baskı altında topu kaybetmeden çıkar.',
      'Topu karşılarken pas seçeneklerini erken fark ettiği için topu yavaş değil doğru oynar.',
    ],
    decisions: [
      'Yere gitmeden bekler; kayarak müdahaleye nadir girer, doğru anı seçer.',
      'Pres sırasında genellikle ikinci dalgayı oluşturur; bazen diğer orta sahaların önüne çıkarak topu kazanmayı dener. Bu riskli ama iyi okunduğunda etkilidir.',
    ],
    strengths: ['Konum disiplini ve oyun okuma.', 'Güçlü gövde; top koruma ve hava mücadelesi.', 'Hızlı geçişleri başlatma.'],
    limits: [
      'Hız avantajı yoktur; ama konum ve okumayla daha hızlı rakipleri yakalayabilir.',
      'Çok cesur pasları çoğunlukla başkalarına bırakır; kendisi daha güvenli seçenekleri tercih eder.',
      'Taklit ederken dikkat: pivot rolü disiplin ister; her top peşinde koşmak yerine konumunu korumayı çalış.',
    ],
    similar: ['sergio-busquets', 'ngolo-kante', 'toni-kroos'],
    sources: [
      wiki('Rodri', 'Rodri', 'Oyun tarzı: tek pivot, oyun kuruluşuna katkı, baskı altında topu koruma, taktik zekâ.'),
      cv(
        'The Coaches’ Voice — Rodri: Premier League Player Watch (Tony Hodson, 21 Ekim 2021)',
        'https://learning.coachesvoice.com/cv/rodri-pep-guardiola-manchester-city-fernandinho/',
        'Pivot olarak konum, ikinci dalga pres, nadiren yere gitme, dikey ve aşırtma paslar, hava ve ikinci top mücadelesi.',
      ),
    ],
    videos: ['VbMqw-9nIEQ', 'SSw2jVVD8uc', 'FmVQniDnqCg', 'tLHYYrACx3s', 'IH0Tub-jcN0'],
    videoLooks: {
      taktik: 'Rodri’de topu almadan önce gövdesinin top ile rakip arasında olup olmadığına, savunmayla orta saha arasındaki konumuna bak.',
      savunma: 'Rodri yere gitmeden bekler. Videodaki savunma ilkesindeki “önce pas yolunu kapat, sonra mücadele et” sırasını onda ara.',
      topsuz: 'Rodri’de pas açısı vermek için rakibin görüş alanı dışına nasıl çıktığına bak; videodaki tarama çalışmasıyla eşleştir.',
    },
  },

  'kevin-de-bruyne': {
    kind: 'yaratici',
    positioning: [
      'Hücum orta saha ya da merkez orta saha olarak oynar; kanat, ikinci forvet ve daha derin yaratıcı orta saha görevlerinde de kullanılmıştır.',
      'Yarım alana kayıp topu oradan alır; geç gelişlerle ceza alanına da girer.',
    ],
    passing: [
      'Yarım alandan içeri kayıp kaleye paralel, hızlı ve çapraz ortalarla savunmayı ikiye böler; uzak direkteki arkadaşını bulur.',
      'İki ayakla da geniş pas menzili vardır; iç ve dış yüzeyle sert ve isabetli paslar verir.',
    ],
    control: [
      'İlk dokunuşla topu hemen vuruş yönüne alır; bu yüzden pasa ya da şuta zaman kaybetmeden geçer.',
      'Topla hızlıdır ve savunmaya doğru koşarak alan açar; karşı atakta tehlikelidir.',
    ],
    decisions: [
      'Topa dokunduğu anda hücumun yönünü seçer: pas, orta ya da uzaktan şut.',
      'Aynı vücut duruşundan hem ara pas hem uzaktan şut dener; savunma hangisini yapacağını tahmin edemez.',
    ],
    strengths: ['Pas menzili ve ortaların kalitesi.', 'İki ayakla uzaktan şut ve duran toplar.', 'Konum, hareket ve topsuz çalışma.'],
    limits: [
      'Güç, hız ya da hava topuyla öne çıkan bir oyuncu değildir; farkı teknik ve konum yaratır.',
      'Taklit ederken dikkat: sert ortalar için gövde duruşu ve ayak yüzeyi çok tekrar ister; önce isabeti, sonra sertliği geliştir.',
    ],
    similar: ['arda-guler', 'bernardo-silva', 'lionel-messi'],
    sources: [wiki('Kevin De Bruyne', 'Kevin_De_Bruyne', 'Oyun tarzı: ileri oyun kurucu, çapraz ortalar, iki ayakla pas ve şut, geç gelişler, duran top.')],
    videos: ['nvajn6BYJog', 'PagCekTH7XI', 'bUpwuvGYqh8', 'seiqevv2JuU', 'qLmV-m0SxhI'],
    videoLooks: {
      hucum: 'De Bruyne’de ortanın yüksekliğine, hızına ve hedef alana bak: kaleci ile savunma arasına mı, uzak direğe mi? Videodaki orta tekniğiyle karşılaştır.',
      taktik: 'Yarım alan, De Bruyne’nin topu aldığı bölgedir. Videodaki alanı sahada işaretle ve onun orada topu kaç kez aldığını say.',
      pas: 'De Bruyne’de pasın ağırlığına ve vücut duruşuna bak: uzun pas için ayak yüzeyi ve topun yüksekliği.',
    },
  },

  'arda-guler': {
    kind: 'yaratici',
    positioning: [
      'Sol ayaklı bir hücum orta saha oyuncusudur; sağ kanatta da oynar ve oradan içeri girerek sol ayağını kullanabilir.',
      'Hat aralarında topu alıp yönünü çevirmeyi sever.',
    ],
    passing: [
      'Yaratıcı paslarla hatlar arasında oyunu kurar; sol ayakla isabetli paslar verir.',
      'Oyun görüşü ve yaratıcılığı onu “oyun kurucu” tarafına yaklaştırır.',
    ],
    control: [
      'Dar alanda sakinliğini korur; topu iç koridorda karşılayıp çabuk yönlendirir.',
      'Dribbling ve teknik becerisi, baskı altında topu saklamasına yardım eder.',
    ],
    decisions: [
      'Duran top öncesi top ve ayak yerleşimini hazırlayıp zaman kazanır.',
      'Baskıya karşı acele etmeden ilk iyi seçeneği arar.',
    ],
    strengths: ['Sakinlik ve dar alanda çözüm bulma.', 'Sol ayakla pas ve duran top.', 'Yaratıcılık ve oyun görüşü.'],
    limits: [
      'Genç bir oyuncudur; oyun tarzı hâlâ şekillenmektedir. Bu sayfanın okunabilen kaynağı kısadır, bu yüzden sınırlılıkları hakkında az şey söyleyebiliyoruz.',
      'Taklit ederken dikkat: sol ayak baskınlığı güçlü yanını geliştirirken zayıf ayağı ihmal etmemek gerekir.',
    ],
    similar: ['kevin-de-bruyne', 'bernardo-silva', 'lionel-messi'],
    sources: [wiki('Arda Güler', 'Arda_G%C3%BCler', 'Oyun tarzı (kısa bölüm): sol ayaklı hücum orta saha, sakinlik, dar alanda oynama, dribbling, oyun görüşü, duran top.')],
    videos: ['dl14Ywpu9q0', '6mFfS1PE3Vo', 'bUpwuvGYqh8', '5GdObYQTDqQ', '_JGVGshCqY0'],
    videoLooks: {
      sut: 'Güler’de vuruştan önce topu nasıl hazırladığına ve ayağın top üzerindeki yerleşimine bak; videodaki falsolu vuruş anlatımıyla karşılaştır.',
      duran: 'Güler’in duran top öncesi rutinini izle: kaç adım geri gidiyor, topu nasıl yerleştiriyor? Videodaki serbest vuruş rutiniyle kıyasla.',
      taktik: 'Hat arası ve yarım alan, Güler’in topu aldığı bölgelerdir. Videodaki alanı işaretle ve onun topu orada nasıl karşıladığına bak.',
      kontrol: 'Güler’de ilk dokunuşunun topu hangi yöne bıraktığına bak; videodaki ilk temas çalışmasında aynı yönlendirmeyi dene.',
    },
  },

  'hakan-calhanoglu': {
    kind: 'oyun-kurucu',
    positioning: [
      'Orta sahada oyun kurucu, ileri doğru çıkan iç orta saha ya da on numara olarak kullanılmıştır; farklı dizilimlerde derin oyun kurucu ve ikinci forvet rollerinde de oynamıştır.',
      'Kanatta da görev almıştır; ancak bu görev doğal on numara yerinin takım yapısında bulunmadığı durumlarda ortaya çıkmıştır.',
    ],
    passing: [
      'Hem kısa hem uzun pas, orta ve oyun görüşü güçlü yanlarıdır; uzun paslarla oyunu bir kanattan diğerine taşır.',
      'Duran top vuruşlarında topa efekt verebilir; uzak mesafeden güçlü ve isabetli vuruş yapar.',
    ],
    control: [
      'Dribbling ve tekniği, orta alanda topu alıp baskıdan kurtulmasına yardım eder.',
      'Serbest vuruş öncesi düzenli bir yaklaşma ve vuruş rutini uygular.',
    ],
    decisions: [
      'Duran topu ayrı bir silah olarak çalışır: aynı rutin, aynı vuruş yüzeyi.',
      'Uzaktan şut tehdidi, savunmayı yukarı çekip diğer seçenekleri açabilir.',
    ],
    strengths: ['Duran top ve uzaktan vuruş.', 'Kısa ve uzun pas menzili.', 'Farklı orta saha rollerinde oynayabilme.'],
    limits: [
      'Kanatta oynatıldığında hızı yetersiz bulunmuş; fiziksel özellikleri ve performans tutarlılığı zaman zaman eleştirilmiştir.',
      'Taklit ederken dikkat: duran top becerisi çok tekrar ister; her maçta denemeyi öğrenmek için ayrı bir antrenman rutini kur.',
    ],
    similar: ['andrea-pirlo', 'toni-kroos', 'arda-guler'],
    sources: [wiki('Hakan Çalhanoğlu', 'Hakan_%C3%87alhano%C4%9Flu', 'Oyun tarzı: duran top uzmanlığı, uzaktan vuruş, pas menzili, farklı orta saha rolleri, eleştiriler.')],
    videos: ['qW75D9Nzg1g', 'JQYBM0p-j6I', '6mFfS1PE3Vo', 'efdxdNxqBQI', 'seiqevv2JuU'],
    videoLooks: {
      duran: 'Çalhanoğlu’nda vuruştan önce kaç adım geri gittiğine, ayağının topun neresine değdiğine bak; videodaki ölü yaprak (knuckleball) ve serbest vuruş anlatımlarıyla karşılaştır.',
      pas: 'Çalhanoğlu’nda uzun pasta topu hangi yüzeyle altından vurduğuna bak; videodaki uzun pas tekniğiyle eşleştir.',
    },
  },

  'andrea-pirlo': {
    kind: 'oyun-kurucu',
    positioning: [
      'Orta sahanın derininde, rakip orta sahanın görüş alanı dışında, pas açısı verecek biçimde durur.',
      'Hızla değil, önceden okuma ve tahminle konum alır; bu sayede pas kesebilir.',
    ],
    passing: [
      'İlk dokunuşta oynar ve geniş bir pas çeşitliliği vardır: kısa değişimlerin yanında zor ve riskli pasları da dener.',
      'Yerden ya da havadan, iki ayakla da uzun ve isabetli paslar verir; takım arkadaşları ona bu paslar yüzünden “mimar” lakabını takmıştır.',
    ],
    control: [
      'Dokunuş, denge ve yakın kontrol; rakibi hareketlerle (sahte hareket) atlatıp kendine alan açar.',
      'Baskı altında topu nadiren kaybeder.',
    ],
    decisions: [
      'Tek dokunuşla oynayıp oyunun ritmini seçer; riskli pası düşünerek ve açık olduğunda ister.',
      'Duran toplarda durumuna göre farklı vuruşlar seçer: yakında kavisli, uzaktan sert ve dalgalı.',
    ],
    strengths: ['Pas menzili ve vizyon.', 'Duran top ve uzaktan vuruş.', 'Baskı altında sakinlik.'],
    limits: [
      'Hız, kondisyon, top kapma ve savunma çalışması onun alanı değildir.',
      'Taklit ederken dikkat: bu rol, önünü koruyan çalışkan orta saha arkadaşlarına bağlıdır; savunma yükünü onlarla paylaşmayı planla.',
    ],
    similar: ['toni-kroos', 'luka-modric', 'hakan-calhanoglu'],
    sources: [wiki('Andrea Pirlo', 'Andrea_Pirlo', 'Oyun becerileri bölümü: derin oyun kurucu, ilk dokunuşta oynama, uzun pas, duran top, hız ve kondisyon sınırlılığı.', 'beceriler (skills) bölümü')],
    videos: ['seiqevv2JuU', '6mFfS1PE3Vo', 'vf0AkYAL6Ig', 'SSw2jVVD8uc'],
    videoLooks: {
      pas: 'Pirlo’da uzun pasın ilk dokunuşla mı, kontrolden sonra mı verildiğine bak. Videodaki uzun pas tekniğiyle ayak yüzeyini karşılaştır.',
      duran: 'Pirlo duran topta farklı vuruşlar kullanır. Videodaki serbest vuruş çeşitlerini onun vuruşlarında ara.',
      topsuz: 'Pirlo topu almadan önce etrafına bakarak seçeneğini hazırlar; videodaki tarama alışkanlığını onda izle.',
      taktik: 'Pirlo’nun konumuna bak: rakip orta sahanın görüş alanı dışında mı? Videodaki orta saha anlatımıyla eşleştir.',
    },
  },

  'zinedine-zidane': {
    kind: 'yaratici',
    positioning: [
      'Doğal yeri, forvetlerin hemen arkasındaki klasik on numaradır.',
      'Derin oyun kurucu, ikinci forvet, kanat ve merkez orta saha olarak da oynayabilmiştir; çünkü hücumu derinden de yönlendirebilir.',
    ],
    passing: [
      'Oyun görüşü ve paslarıyla hem gol hazırlar hem gol atar; hücumu orta alandan yönlendirir.',
      'Topu saklayıp alan yaratarak, pas açılana kadar zaman kazanır.',
    ],
    control: [
      'Olağanüstü bir ilk dokunuş ve yakın kontrol; iki ayağını da kullanır.',
      'Dar alanda “marsilya dönüşü” (la roulette) gibi hareketlerle rakibi atlatır; bu hareket onunla özdeşleşmiştir.',
    ],
    decisions: [
      'Alan algısı ve konum bilgisi çok iyidir: topu nereye alacağını önceden bilir.',
      'Takım oyuncusu olarak güvenilirdir; hem bitirir hem hazırlar, savunma çabasıyla da övülmüştür.',
    ],
    strengths: ['İlk dokunuş ve zarafet.', 'Topu saklama ve alan satın alma.', 'Pas görüşü; iki ayakla vuruş.'],
    limits: [
      'En hızlı oyuncu değildir; çeviklik ve hızlanmayı konumuyla destekler.',
      'Mizaç ve sahadaki disiplin konusunda eleştirilmiştir; öğrenilecek ders: öfke kontrolü de bir beceridir.',
      'Bazı maçlarda oyundan koptuğu yönünde eleştiri almıştır.',
    ],
    similar: ['ronaldinho', 'lionel-messi', 'kevin-de-bruyne'],
    sources: [wiki('Zinedine Zidane', 'Zinedine_Zidane', 'Oyuncu olarak değerlendirme: ilk dokunuş, yakın kontrol, klasik on numara, çok yönlülük, mizaç eleştirisi.', 'Reception and legacy: As a player bölümü')],
    videos: ['NDCEDQ5K2vQ', '5GdObYQTDqQ', '_uuqsGCiM9I', 'bUpwuvGYqh8'],
    videoLooks: {
      kontrol: 'Zidane’da ilk dokunuşta topu hangi yöne bıraktığına ve ikinci dokunuşa nasıl hazırladığına bak. Videodaki ilk temas alıştırmasında aynısını dene.',
      surme: 'Videodaki dönüşlü çalım hareketlerini (marsilya dönüşü gibi) Zidane’ın oyunuyla ilişkilendir: rakibi nereye çekip nereye dönüyor?',
      taktik: 'Hat arası alanı Zidane’ın çalıştığı bölgedir. Videodaki yarım alan anlatımıyla birlikte onun konumuna bak.',
    },
  },

  'bernardo-silva': {
    kind: 'yaratici',
    positioning: [
      'Çok sayıda rolde oynar: iki kanatta kanat (sağı tercih eder), merkez orta saha, derin oyun kurucu, ileri orta saha, ikinci forvet ve sahte dokuz.',
      'Rolü değişse de hücum kuruluşuna katılmayı ve takım arkadaşlarıyla çalışmayı tercih eder.',
    ],
    passing: [
      'Kısa ve orta mesafede zeki paslar verir; hücum kuruluşuna katılarak takım arkadaşlarının koşusunu besler.',
      'Oyun görüşü ve yaratıcılığıyla bir taraftan topu taşıyıp bir taraftan pas seçeneği arar.',
    ],
    control: [
      'Küçük yapılı ve çevik; topu yakın tutarak rakibe doğru taşıyabilir, aynı zamanda topu korumayı bilir.',
      'Hızlanma ve çeviklikle dar alandan çıkar.',
    ],
    decisions: [
      'Tek başına sürüş yerine takım hücumuna katılmayı tercih eder: topu taşıyabilir, ama kararı çoğu zaman takım arkadaşıyla oynamaktır.',
      'Top kaybında hemen baskı yapar; topu geri kazandıktan sonra atağı başlatır.',
    ],
    strengths: ['Çok yönlülük ve çalışkanlık.', 'Top taşıma, top koruma ve dar alanda çözüm.', 'Baskı ve topu geri kazanma çabası.'],
    limits: [
      'Tek bir klasik rolü olmadığı için takım yapısına uyum ister; rolü yerleşmemiş genç oyuncular için taklit etmek zor olabilir.',
      'Taklit ederken dikkat: çalışkanlık ve çok yönlülük, önce temel teknik ve taramanın üzerine kurulur.',
    ],
    similar: ['andres-iniesta', 'kevin-de-bruyne', 'arda-guler'],
    sources: [wiki('Bernardo Silva', 'Bernardo_Silva', 'Oyun tarzı: çok yönlü hücum orta saha/kanat, top taşıma, hücum kuruluşuna katılma, baskı ve çalışkanlık.')],
    videos: ['gVY-saeJnkk', 'wgqqT5L-vZw', 'N_w6d6y4i58', 'bUpwuvGYqh8', 'vf0AkYAL6Ig'],
    videoLooks: {
      surme: 'Bernardo Silva’da topu yakın tutup rakibe doğru taşıdığı ve topu koruduğu anlara bak; videodaki top saklama anlatımıyla karşılaştır.',
      topsuz: 'Bernardo Silva topsuzken de çok çalışır. Videodaki üçüncü adam fikrini ve taramayı onun hareketlerinde ara.',
      pas: 'Üçgen çalışması, takım arkadaşlarıyla oynama tercihinin temelidir. Bernardo Silva’nın pas sonrası hareketine bak.',
      taktik: 'Yarım alan ve hat arası, Bernardo Silva’nın sık kullandığı bölgelerdir; videodaki alan anlatımıyla birlikte izle.',
    },
  },
};
