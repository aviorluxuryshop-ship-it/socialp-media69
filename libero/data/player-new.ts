import type { PlayerBase } from './player-types';

/**
 * Sonradan eklenen oyuncular (temel alanlar). Derin bölümler data/player-deep/ içindedir.
 * Her şey okunan kaynaklara dayanır; sayı, ödül, transfer ve özel hayat bilgisi yoktur.
 */
export const NEW_PLAYERS: PlayerBase[] = [
  {
    id: 'andrea-pirlo',
    name: 'Andrea Pirlo',
    pos: 'on-libero',
    role: 'Derinden oyun kurucu (regista)',
    tagline: 'Sakinlik, ilk dokunuşta oynama, uzun ve isabetli paslar, duran toplarda ustalık.',
    style:
      'Hız ve fizik yerine sakinlik ve oyun görüşüyle oyunu yöneten, orta sahanın derininde oynayan bir oyun kurucu. Topu çoğu zaman ilk dokunuşta oynar, uzun pasları iki ayakla da isabetle verir ve takım arkadaşlarını kurduğu pasla koşuya çıkarır. Takım arkadaşları ona bu yüzden “mimar” lakabını takmıştır.',
    onBall: [
      'Topu ilk dokunuşta oynayarak baskı altında bile nadiren kaybeder.',
      'Kısa ve güvenli paslarla oyunu sürdürür; fırsat doğduğunda riskli ve zor bir uzun pasa yönelir.',
    ],
    offBall: [
      'Savunma önünde, rakip orta sahanın görüş alanı dışında, pas açısı veren bir konumda durur.',
      'Hızla değil, okuma ve tahminle pas yollarını kapar.',
    ],
    defending: ['Hız, kondisyon ve top kapma onun güçlü yanları değildir; bu eksikleri okuma ve konumla kapatmaya çalışır.'],
    lessons: [
      'Top ayağına gelmeden önce karar ver: ilk dokunuşta oynayabileceğin bir seçenek var mı?',
      'Pas menzilini genişlet: yerden ve havadan, iki ayakla uzun pas çalış.',
      'Duran toplarda tek bir vuruşla yetinme; yakında bükme, uzaktan sert vuruş gibi farklı seçenekleri ayrı çalış.',
    ],
    watch: ['Topu almadan önce konumu rakip orta sahanın görüş alanı dışında mı?', 'Uzun pasta ayak topun neresine, hangi yüzeyle değiyor?'],
    techs: ['uzun-pas', 'derinlik-pasi', 'serbest-vurus-duvar-ustu', 'cevre-tarama', 'tek-dokunus-pas', 'genis-oyun'],
    q: 'Pirlo regista analiz',
  },
  {
    id: 'zinedine-zidane',
    name: 'Zinedine Zidane',
    pos: 'on-numara',
    role: 'On numara · klasik oyun kurucu',
    tagline: 'İlk dokunuş, zarafet ve topu saklayarak alan yaratmak.',
    style:
      'Topu istediği gibi yöneten bir klasik on numara. İlk dokunuşu ve yakın kontrolüyle rakipten alan kazanır; sürme ve pasla oyunu hem yakından hem uzaktan kurabilir. Onu ayıran şey hız değil, topu saklama, alanı okuma ve takım için doğru seçimi yapma becerisidir.',
    onBall: [
      'Topu karşılarken ilk dokunuşla rakibi geçip kendine alan açar.',
      'Topu vücuduyla saklayıp rakibe değdirmeden alan kazanır.',
    ],
    offBall: [
      'Hücum ve orta saha arasında, forvetin hemen arkasında konumlanır; çevresindeki alanı sürekli okur.',
      'Gerektiğinde ikinci forvet, kanat ya da derin oyun kurucu olarak da oynar.',
    ],
    defending: ['Teknik direktörleri onun savunma çabasını da övmüştür; topu kaybedince geri dönüp takıma yardım eder.'],
    lessons: [
      'İlk dokunuşunla rakibi geç: topu durdurmak yerine boşluğa al.',
      'Topu vücudunla sakla; hızlı olmasan da alan kazanırsın.',
      'Pas ve şutu iki ayakla çalış.',
    ],
    watch: ['İlk dokunuşunda topu hangi yöne alıyor?', 'Rakip yaklaşırken topu nasıl saklıyor ve dönüşünü hangi anda yapıyor?'],
    techs: ['yonlu-kontrol', 'ilk-temas', 'marseille-donusu', 'top-koruma', 'baski-altinda-kontrol', 'hat-arasi-alma'],
    q: 'Zidane first touch analiz',
  },
  {
    id: 'sergio-busquets',
    name: 'Sergio Busquets',
    pos: 'on-libero',
    role: 'Ön libero · tek pivot',
    tagline: 'Görünmeyen iş: konum, tarama ve basit pasla takımı dengede tutmak.',
    style:
      'Fiziksel üstünlükle değil, oyun okumasıyla öne çıkan bir ön libero. Topu almadan önce hangi seçeneklerin açık olduğunu bilir, pas yollarını konumuyla kapatır ve topu çoğu zaman en basit ve güvenli seçeneğe oynar. Rolü, maçta hemen fark edilmeyen ama takımın dengesini taşıyan işlerden oluşur.',
    onBall: [
      'Topu kısa paslarla dolaştırarak takımın temposunu ve akışını yönetir.',
      'Topu baskı altında karşılarken gövdesiyle korur ve kaybetmeden bir sonraki oyuncuya bırakır.',
    ],
    offBall: [
      'Orta sahada çevresindeki oyunculara sürekli bir pas açısı sunar; topun etrafında “kolay seçenek” olur.',
      'Takım topa sahipken savunma ile orta saha arasındaki boşlukta durur ve geçişlerde dengeyi korur.',
    ],
    defending: ['Hızla değil okuyarak savunur: gevşek topları ve pas yollarını konum ve zamanlamayla kapar.'],
    lessons: [
      'Topu almadan önce etrafına bak ve ilk pas seçeneğini önceden belirle.',
      'Pası çoğu zaman en basit ve güvenli seçeneğe ver; riski ancak açıkken al.',
      'Savunmada hızına değil konumuna güven: önce pas yolunu kapat.',
    ],
    watch: ['Top ayağına gelmeden önce kaç kez başını çeviriyor?', 'Takım topu kaybettiğinde nerede duruyor?'],
    techs: ['cevre-tarama', 'baski-altinda-kontrol', 'araya-girme', 'tek-dokunus-pas', 'yonlu-kontrol', 'savunma-durusu'],
    q: 'Busquets pivot analiz',
  },
  {
    id: 'ronaldinho',
    name: 'Ronaldinho',
    pos: 'on-numara',
    role: 'On numara · yaratıcı oyun kurucu ve kanat',
    tagline: 'Zarafet, çalım çeşitliliği ve duran toplarda bükülü vuruşlar.',
    style:
      'Topla oynamayı bir sanata çeviren, klasik on numara ya da kanat olarak oynayan yaratıcı bir oyuncu. Teknik becerisini, ilk dokunuşunu ve çalımlarını (adım üstü, tünel, elastico) rakibi geçmek ve takım arkadaşını bulmak için kullanır. Hem gol atar hem hazırlar; duran toplarda da çok yönlüdür.',
    onBall: [
      'Birebirde adım üstü, elastico ve tünel gibi çalımlarla rakibi atlatır.',
      'Gösterişli paslar (topuk, bakmadan pas) kullanır; ama bunları takım arkadaşını bulmak için seçer.',
    ],
    offBall: ['Çoğunlukla hücum orta sahada ya da sol kanatta konumlanır; içeri kesip güçlü ayağıyla vurabileceği yeri seçer.'],
    defending: ['Okuduğumuz kaynakta savunma çalışması öne çıkarılmıyor; bu konuda yorum yapmıyoruz.'],
    lessons: [
      'Çalımı amaç değil araç olarak çalış: her hareketten sonra pas ya da şut seçeneğin olsun.',
      'Elastico gibi hareketleri önce yavaş, sonra hızlı çalış.',
      'Duran topta bükülü vuruşu ve duvar altı vuruşu ayrı çalış.',
    ],
    watch: ['Çalımdan önce bakışı nereye?', 'Serbest vuruşta topun hangi yüzeyine vuruyor?'],
    techs: ['elastico', 'govde-sahtesi', 'nutmeg', 'serbest-vurus-duvar-yani', 'falsolu-sut', 'dis-ayak-pasi'],
    q: 'Ronaldinho dribbling analiz',
  },
  {
    id: 'paolo-maldini',
    name: 'Paolo Maldini',
    pos: 'bek',
    role: 'Sol bek · sonraları stoper',
    tagline: 'Dalaşmadan savunmak: konum, tahmin ve zamanlama.',
    style:
      'Müdahaleye acele etmeyen, konum ve tahminle rakibi sınırlayan bir savunmacı. Kariyerinin büyük bölümünde bek, son yıllarında stoper olarak oynadı; hızı azaldıkça tecrübesine, hava topuna ve müdahale zamanlamasına dayandı.',
    onBall: [
      'Pasları temizdir; bu yüzden gerektiğinde libero gibi oyun kurabilir.',
      'Hücuma çıkıp gol ve asist de üretebilen bir bekti.',
    ],
    offBall: ['Rakibin tehlikeli hareketini önceden fark eder ve konumunu buna göre ayarlar.'],
    defending: [
      'Gereksiz müdahaleden kaçınır; konumlanma ve birebir markajla rakibin hücum oyununu kısıtlar.',
      'Kayarak müdahale, hava topu ve hız temel silahlarıdır.',
    ],
    lessons: [
      'Her topa girmek zorunda değilsin: önce konumunla rakibin seçeneklerini daralt.',
      'Rakibin hamlesini önceden oku; zamanında konum al.',
      'Savunmacıysan pas kalitesini de çalış.',
    ],
    watch: ['Müdahale ettiği ve etmediği anlarda rakibe mesafesi ne?', 'Tehlike belirmeden önce konumu nasıl değişiyor?'],
    techs: ['savunma-durusu', 'birebir-savunma', 'kayarak-mudahale', 'araya-girme', 'savunma-hatti', 'savunma-kafasi'],
    q: 'Maldini defending analiz',
  },
  {
    id: 'bernardo-silva',
    name: 'Bernardo Silva',
    pos: 'kanat',
    role: 'Kanat · hücum orta saha · çok yönlü',
    tagline: 'Topu taşıyan, baskı yapan, her rolde çalışkan bir yaratıcı.',
    style:
      'Hem topla hem topsuz çok çalışan, rolünü takımın ihtiyacına göre değiştiren yaratıcı bir oyuncu. Topu taşıyıp savunmaya doğru sürebilir, ama asıl tercihi hücum kuruluşuna katılmak ve takım arkadaşlarıyla oynamaktır. Baskı ve top geri kazanımında da öne çıkar.',
    onBall: [
      'Topu yakın tutarak rakibe doğru taşır, gerekirse korur ve bir arkadaşını bulur.',
      'Tek başına sürüş yerine hücum kuruluşuna katılmayı tercih eder.',
    ],
    offBall: ['Farklı roller arasında konum değiştirir: kanat, merkez orta saha, derin oyun kurucu; boşluğa ve arkadaşlarının koşusuna göre yer seçer.'],
    defending: ['Çalışkanlığı ve savunma katkısıyla bilinir: rakibe baskı yapar ve topu geri kazandıktan sonra atağı başlatır.'],
    lessons: [
      'Topu taşımayı ve bırakmayı birlikte çalış: ne zaman sürüp ne zaman paslaşacağını seç.',
      'Rolün değişse de topsuz çalışmayı bırakma: baskı ve geri dönüş takıma değer katar.',
      'Üçüncü adam koşularını izle ve kendi oyununda dene.',
    ],
    watch: ['Hangi durumda topu taşıyor, hangi durumda hemen paslaşıyor?', 'Top kaybı sonrası ilk tepkisi ne?'],
    techs: ['yakin-kontrol-surme', 'top-koruma', 'ucuncu-adam-kosusu', 'cevre-tarama', 'tek-dokunus-pas', 'baski-kademe'],
    q: 'Bernardo Silva analiz',
  },
];
