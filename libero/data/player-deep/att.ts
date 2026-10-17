import type { PlayerDeep } from '../player-types';
import { wiki } from './_src';

/** Derinleştirilmiş bölümler: kanat ve forvetler */
export const DEEP_ATT: Record<string, PlayerDeep> = {
  'mohamed-salah': {
    kind: 'ucu',
    positioning: [
      'Çoğunlukla sağ kanatta başlar; buradan içeri keserek güçlü sol ayağına gelip şut ya da kısa kombinasyon dener.',
      'Merkeze daha yakın rollerde de (ana forvet, ikinci forvet, hücum orta saha) oynayabilir; teknik direktörün isteğiyle kaleye daha yakın oynamak bitiriciliğini artırmıştır.',
    ],
    passing: [
      'Ayağın dış yüzüyle trivela pası dener; hazırlayıcı yönü sonraki yıllarda daha çok fark edilmiştir.',
      'Takım arkadaşlarıyla hızlı ikili değişimler yapar, ardından savunmanın arkasına koşar.',
    ],
    control: [
      'İlk dokunuşu ve top kontrolü güçlüdür; hızını ve yeteneğini rakibi geçmek için birlikte kullanır.',
      'Kısa mesafede çevik yön değişimiyle topu şut pozisyonuna getirir.',
    ],
    decisions: [
      'İçeri kesince karar anı gelir: şut mu, kısa pas mı, savunmanın arkasına koşu mu? Kalecinin konumuna bakarak seçer.',
      'Koşusunu arkadaşının başını kaldırdığı anda başlatır; zamanlama hızından önemlidir.',
    ],
    strengths: ['Hız, çeviklik ve savunma arkasına koşu.', 'Kesin bitiricilik; iç yüz ve plase vuruş.', 'Dribbling, ilk dokunuş ve top kontrolü.'],
    limits: [
      'Hazırlayıcılık yönü uzun süre bitiriciliğinin gölgesinde kalmış, sonraki yıllarda daha fazla fark edilmiştir.',
      'Taklit ederken dikkat: içeri kesme kalıbı rakipler tarafından da bilinir; kenardan geçmeyi ve ortayı da çalış ki tek yönlü olma.',
    ],
    similar: ['vinicius-junior', 'thierry-henry', 'erling-haaland'],
    sources: [wiki('Mohamed Salah', 'Mohamed_Salah', 'Analiz bölümü: sağ kanatta içeri kesme, hız, bitiricilik, trivela pası, daha merkezi roller.', 'analiz bölümü')],
    videos: ['5OWWGerdpss', 'nvajn6BYJog', 'VBGJAtj1QtE', 'urDipH2GQN0', 'AEkvuvjV_J8'],
    videoLooks: {
      bitiricilik: 'Salah kalecinin konumuna bakıp köşe seçer. Videodaki kaleciyle karşı karşıya bitirme yöntemlerini onun kaleciyle karşılaşmalarında ara.',
      hucum: 'Salah kanattan ortayı ve içeri kesip paslaşmayı birlikte kullanır. Videodaki orta türlerini onun seçimlerinde ara.',
      sut: 'Videodaki dış yüz (trivela) vuruşunu Salah’ın pas ve şutlarında ara: hangi durumda dış yüzü seçiyor?',
      topsuz: 'Salah’ın koşusunu başlattığı an pası veren oyuncunun ne yaptığına bak; videodaki savunma arkasına koşu anlatımıyla eşleştir.',
    },
  },

  'vinicius-junior': {
    kind: 'ucu',
    positioning: [
      'Çoğunlukla sol kanatta durur; ön cephenin her yerinde de oynayabilir.',
      'Genişlikte kalarak rakip beki geniş alanda sabitler; boşalan iç alana takım arkadaşları girer.',
    ],
    passing: [
      'Son pasa bakışı vardır; asist yapabilen, oyunu kuran bir kanattır.',
      'Çalımdan sonra pas, şut ya da orta seçeneklerinden birini hazır tutar.',
    ],
    control: [
      'Yakın kontrol, denge ve çeviklik; yüksek hızda bile topu kontrol eder.',
      'Ani hızlanma ve yön değişimiyle rakibi birebirde geçer.',
    ],
    decisions: [
      'Birebirde önce rakibe doğru hızla gider, sonra yön değiştirir.',
      'Zamanla sakinlik ve oyunu sadeleştirmeyle bitiriciliğinin arttığı anlatılır; savunma çalışması ve konumu da övülmüştür.',
    ],
    strengths: ['Patlayıcı hızlanma ve hız.', 'Birebir dribbling ve çalım çeşitliliği.', 'Genişlikte oynayarak takıma alan açma.'],
    limits: [
      'Gelişim sürecinde bitiriciliği ve “fazla çalım, az takım oyunu” eleştirisi gündeme gelmişti; oyunu sadeleştirmek önemli bir ders.',
      'Taklit ederken dikkat: çalım, ancak bitiş ya da pas seçeneğiyle birleşince değer taşır.',
    ],
    similar: ['mohamed-salah', 'ronaldinho', 'thierry-henry'],
    sources: [wiki('Vinícius Júnior', 'Vin%C3%ADcius_J%C3%BAnior', 'Oyun tarzı: sol kanat, hız, birebir dribbling, son pas, gelişim süreci eleştirileri.')],
    videos: ['Q4ttRfja70M', '_uuqsGCiM9I', '5OWWGerdpss', 'urDipH2GQN0', 'PagCekTH7XI'],
    videoLooks: {
      surme: 'Vinícius’ta rakibe yaklaşırken topla mesafesine ve çalımdan sonraki ilk tercihine bak; videodaki çalım hareketlerinin bu tercihle nasıl birleştiğini izle.',
      bitiricilik: 'Çalımdan sonra bitiriş önemlidir. Videodaki kaleciyle karşı karşıya yöntemlerini Vinícius’un bitirişlerinde ara.',
      topsuz: 'Vinícius’un topsuzken genişlikte durup rakip beki sabitlemesine bak; videodaki hareketle eşleştir.',
      hucum: 'Orta, çalımdan sonraki üç seçenekten biridir. Videodaki orta türlerini onun seçimlerinde ara.',
    },
  },

  'erling-haaland': {
    kind: 'ucu',
    positioning: [
      'Orta forvet olarak topu almak için sık sık derine iner ve oyunu kurmaya yardım eder; ardından dönüp kaleye koşar.',
      'Ceza alanında küçük, keskin hareketlerle boşluğu seçer; koşusunun çizgisini ve hızını son anda değiştirerek savunmacıyı yanıltır.',
    ],
    passing: [
      'Topu kanada dağıtıp ardından yeniden koşuya çıkar.',
      'Sol iç koridora kaydığında yaratıcılığı öne çıkar; gecikmeli koşuları fark edip pas verebilir.',
    ],
    control: [
      'Sırtı kaleye dönükken gövdesini kullanarak topu korur; güçlü yapısıyla topu baskı altında tutar ve savunmasına nefes aldırır.',
      'Topu tek dokunuşla bitirmeye hazırlar; ilk dokunuş çoğu zaman şut yönündedir.',
    ],
    decisions: [
      'Birincil amacı her zaman şut atmaktır; ama gecikmeli koşuyu bulan pası da seçebilir.',
      'Sakinlik, sabır ve zamanlama: koşusunu, pası verenin bakışına ve savunmacının duruşuna göre başlatır.',
    ],
    strengths: ['Savunma arkasına koşu ve hızlanma.', 'İki ayak ve kafayla bitirme.', 'Gövdeyle top koruma ve oyuna katılma.'],
    limits: [
      'Tipik bir forvete göre topla daha az buluşur; etkisi çoğunlukla topsuz hareket ve zamanlamadan gelir.',
      'Taklit ederken dikkat: güçlü fizik herkeste yoktur; ilk adımda hareketin zamanlamasını ve tek dokunuşla bitirmeyi çalış.',
    ],
    similar: ['thierry-henry', 'mohamed-salah', 'vinicius-junior'],
    sources: [wiki('Erling Haaland', 'Erling_Haaland', 'Oyun tarzı: tam santrfor, derine inip oyun kurma, ceza alanında hareket, gövdeyle top koruma, topsuz oyun.')],
    videos: ['urDipH2GQN0', '99PrXp5XojA', 'biFVvYNs5NM', 'AEkvuvjV_J8', 'Fyp4M70M6Hw'],
    videoLooks: {
      topsuz: 'Haaland’da koşusunu hangi anda başlattığına ve savunmacının bakışına göre yön değiştirip değiştirmediğine bak; videodaki boş alana koşu anlatımıyla eşleştir.',
      bitiricilik: 'Haaland’da bitirişte ilk dokunuşun yönüne bak. Videodaki kaleciyle karşı karşıya yöntemleriyle karşılaştır.',
      kafa: 'Haaland havada da bitirebilir. Videodaki kafa çalışmasındaki zıplama zamanını ve alın yüzeyini onun kafa vuruşlarında ara.',
    },
  },

  'thierry-henry': {
    kind: 'ucu',
    positioning: [
      'Orta forvet olarak oynadı; sık sık sol koridora kayıp kanat gibi oynadı ve oradan kaleye koştu.',
      'Ofsayt çizgisinde dolaşıp ofsayta düşer gibi yapıp topun verildiği anda geri çıkarak savunmayı atlatırdı.',
    ],
    passing: [
      'Bencil olmayan, yaratıcı bir oyuncuydu: hazırlayıcı olarak da çok katkı verdi.',
      'Kanada kaydığında hem içeri sürüşü hem arkadaşına pası seçebilirdi.',
    ],
    control: [
      'Hız, beceri ve sakinlikle savunmacıyı geçip arkasına çıkabilirdi.',
      'Soldan içeri girerek uzak köşeye yerleştirdiği şut en bilinen kalıbıdır.',
    ],
    decisions: [
      'Bire birde sakin kalıp bitirmek en güçlü yanıydı.',
      'Rolünü oyuna göre değiştirirdi: orta forvet, kanat ya da derine koşu; tek bir sabit göreve bağlı kalmazdı.',
    ],
    strengths: ['Bire birde sakinlik ve bitiricilik.', 'Hız ve dribblingla savunmayı geçme.', 'Hem kanatta hem santraforda oynayabilme.'],
    limits: [
      'Hava toplarında belirgin bir tehdit değildi.',
      'Hızının zirvesindeki dönemi için tanımlanmış bir oyun tarzı; taklit ederken dikkat: hızı yoksa konum ve zamanlama ön plana çıkar.',
    ],
    similar: ['erling-haaland', 'mohamed-salah', 'ronaldinho'],
    sources: [wiki('Thierry Henry', 'Thierry_Henry', 'Oyun tarzı: orta forvetten sol koridora kayma, bire birde sakin bitirme, ofsayt çizgisinde hareket, hazırlayıcılık.')],
    videos: ['5OWWGerdpss', 'AEkvuvjV_J8', 'biFVvYNs5NM', '99PrXp5XojA', '_JGVGshCqY0'],
    videoLooks: {
      bitiricilik: 'Henry’de bire birde kaleciye karşı sakinliğine ve topu hangi köşeye yerleştirdiğine bak; videodaki yöntemleri onun bitirişlerinde ara.',
      topsuz: 'Henry ofsayt çizgisinde hareketle savunmayı atlatırdı. Videodaki sahte koşu ve boş alana koşu anlatımlarını onun hareketlerinde ara.',
      sut: 'Henry’nin imza şutu iç yüzle uzak köşeye bükmekti. Videodaki iç yüz plase vuruşuyla ayağın temas yüzeyini karşılaştır.',
    },
  },

  ronaldinho: {
    kind: 'yaratici',
    positioning: [
      'Çoğunlukla klasik on numara (hücum orta saha) olarak oynadı; kanatta da kullanıldı. Sağ ayaklı olmasına rağmen sol kanatta ters ayaklı kanat gibi içeri keserek güçlü ayağıyla vurdu.',
      'İkinci forvet olarak da oynayabilirdi; hücumun birkaç yerinde görev alabilmesi, hem gol atıp hem gol hazırlamasından gelir.',
    ],
    passing: [
      'Pas, oyun görüşü ve oyun kurma becerisiyle tanınır; gösterişli hareketlerin (topuk pası, bakmadan pas) yanında takım arkadaşını bulan yaratıcı paslar da verir.',
      'Yakın mesafede topu rakiple arasına katıp hızlı ve tahmin edilmesi zor bir pasla çözer.',
    ],
    control: [
      'Olağanüstü ilk dokunuş, çeviklik, denge ve yakın kontrol; ince yapılı olmasına rağmen topla fiziksel olarak güçlüdür.',
      'Çalım çeşitliliği geniştir: adım üstü, tünel (nutmeg) ve elastico gibi hareketlerle rakibi atlatır.',
    ],
    decisions: [
      'Çalımı rakibi geçip pas ya da şut için alan kazanmak amacıyla kullanır; gösteriş, amaç değil araçtır.',
      'Bitirici olarak iki ayakla da isabetlidir; duran toplarda bükme ve duvar altı sert vuruşlar seçer.',
    ],
    strengths: ['Teknik beceri, ilk dokunuş ve yaratıcılık.', 'Çalım repertuarı ve birebir.', 'Duran top vuruşları; iki ayakla bitirme.'],
    limits: [
      'Okuduğumuz kaynak sınırlılıklarını ayrıntılandırmıyor; burada yalnızca taklit ederken dikkat notu veriyoruz.',
      'Taklit ederken dikkat: pas ya da şut için alan kazandırmayan gösterişli hareketler topu kaybettirir; önce basit yönlendirmeleri oturt.',
    ],
    similar: ['zinedine-zidane', 'lionel-messi', 'andres-iniesta'],
    sources: [wiki('Ronaldinho', 'Ronaldinho', 'Oyun tarzı: klasik on numara/kanat, çalım çeşitliliği (elastico, adım üstü, tünel), duran toplar, ilk dokunuş.')],
    videos: ['Q4ttRfja70M', '_uuqsGCiM9I', '6mFfS1PE3Vo', 'Xim8-lUZnsA', 'JQYBM0p-j6I'],
    videoLooks: {
      surme: 'Ronaldinho’da çalımdan hemen sonra ne yaptığına bak: pas mı, şut mu, yeni bir sürüş mü? Videodaki hareketleri bu tercihle birlikte izle.',
      duran: 'Ronaldinho duran topta farklı vuruşlar kullanır (bükme, duvar altı, ölü yaprak). Videodaki serbest vuruş çeşitlerini onun vuruşlarında ara.',
    },
  },
};
