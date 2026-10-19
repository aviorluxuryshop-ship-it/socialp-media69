import { DEEP_ATT } from './player-deep/att';
import { DEEP_BARCA } from './player-deep/barca';
import { DEEP_DEF } from './player-deep/def';
import { DEEP_MID } from './player-deep/mid';
import { NEW_PLAYERS } from './player-new';
import type { PlayerAnalysis, PlayerBase, PlayerDeep } from './player-types';

export type { PlayerAnalysis, PlayerBase, PlayerDeep, PlayerExtraBlock, PlayerKind, PlayerSource } from './player-types';
export { PLAYER_KIND_NAME, PLAYER_KIND_ORDER, PLAYER_SECTIONS } from './player-types';

/**
 * Oyuncu analizleri — EĞİTİM AMAÇLI YORUMDUR.
 * Burada sayı, istatistik, ödül, transfer ya da özel hayat bilgisi verilmez; yalnızca
 * geniş çevrelerce kabul gören oyun özellikleri, gerçekten okunmuş kaynaklardan yeniden
 * anlatılır ve bunların kendi oyununa nasıl taşınacağı gösterilir.
 *
 * Yapı: bu dosya ilk sürümden gelen temel alanları (stil, topla/topsuz/savunma, dersler, izleme noktaları)
 * taşır; derin bölümler (pozisyon alma, pas tercihleri, kontrol, karar verme, güçlü yanlar/sınırlılıklar,
 * benzer oyuncular, kaynaklar, videolar) `data/player-deep/` içindedir ve kimliğe göre birleştirilir.
 * Tutarlılık denetimi `data/player-check.ts` içindedir; derlemede `data/player-guard.ts` çalıştırır.
 */

const OLD_PLAYERS: PlayerBase[] = [
  {
    id: 'lionel-messi',
    name: 'Lionel Messi',
    pos: 'on-numara',
    role: 'Sağ kanat · sahte dokuz · oyun kurucu',
    tagline: 'Alçak ağırlık merkezi, küçük dokunuşlar, hat arasında sürekli hareket.',
    style:
      'Topla en çok vakit geçiren ve baskı altında bile yakın kontrolü bozulmayan bir oyuncu. Hızını “ani yön ve tempo değişimiyle” üretir; rakibe kendisini değil topu kaybettirir. Sahada genellikle rakip orta saha ile savunma arasındaki aralıkta kalır ve topu orada, yarım dönüşle alır.',
    onBall: [
      'Topu ayağına yakın, küçük ve sık dokunuşlarla sürer; her dokunuş bir sonraki seçeneği korur.',
      'Baskıya yakalanmadan hemen önce yön değiştirir; ilk adım çoğu zaman rakibin ağırlığını yanlış ayağa bindirir.',
      'Pas ile sürmeyi aynı hareketin parçası olarak kullanır; çalım yaptıktan sonra pas ya da şut için zaman kazanır.',
      'Topu alırken bazen durur: rakibi kendine çeker, sonra omuz sahtesi ve duruştan ani hızlanmayla yanından geçer.',
    ],
    offBall: [
      'Topsuzken de yürüyerek ve etrafı tarayarak rakibin zayıf noktasını arar; sonra ani bir hareketle boşluğa girer.',
      'Top yokken çoğu zaman rakip orta saha ile savunma arasına yerleşir; oyun hızlandığında o aralıktan topu alır.',
      'Rakipler hızlı koşarken o çoğu zaman yürür: yürüyerek ve bakınarak, rakibin görüş alanı dışında kalan boşluğu seçer.',
      'Geçiş anlarında başkalarının koşularının açtığı alanı kullanır; arkadaşları ileri koşarken o boşalan alana girer.',
    ],
    defending: [
      'Oyunu tam baskıyla savunmak yerine takım dengesini bozmayan konumda kalmayı ve top kaybı sonrasında anlık tepkiyi önemser.',
      'Yıllar içinde savunma çalışmasını ve koşu miktarını azaltıp enerjisini hücumdaki kısa, etkili hamlelere ayırmıştır; bu seçim takımın pres yapısını da etkiler.',
    ],
    lessons: [
      'İlk dokunuşunu bir sonraki hareketinin yönüne at — durdurmak için değil, yönlendirmek için.',
      'Topu almadan önce etrafına bak: nerede boşluk var, rakip hangi ayağında?',
      'Küçük, sık dokunuşlarla sür; hızı koşu hızından değil, yön değişiminden üret.',
    ],
    watch: [
      'Topu almadan 2–3 sn önce başı hangi yönlere dönüyor?',
      'Çalım sonrası hemen hangi seçeneği (pas/şut) kullanıyor?',
      'Rakip yaklaşırken topa kaç kez dokunuyor ve dokunuşlar nereye gidiyor?',
    ],
    techs: ['yonlu-kontrol', 'hizli-top-surme', 'ic-yuz-kesme', 'iceri-kesip-sut', 'hat-arasi-alma', 'derinlik-pasi'],
    q: 'Messi dribbling analiz',
  },
  {
    id: 'xavi-hernandez',
    name: 'Xavi Hernández',
    pos: 'merkez-orta-saha',
    role: 'Merkez orta saha · tempo belirleyici',
    tagline: 'Taramak, açıyı hazırlamak, tek ya da iki dokunuşla oynamak.',
    style:
      'Maçı hızlandırıp yavaşlatan oyuncu. Topu almadan önce etrafına defalarca bakar; bu yüzden ilk dokunuşta ne yapacağını bilir. Pasları çoğunlukla bir ya da iki dokunuşla oynar ve takım arkadaşını rakipten uzak ayağına buluşturur.',
    onBall: [
      'Topu yarım dönük (omuzlar sahaya açık) karşılar; böylece hem geriye hem ileriye oyun açar.',
      'Pasını “baskı almadan önce” verir; rakip yaklaşmadan topu bırakır ve tekrar boşluğa gider.',
      'Pas hızı ve ağırlığı arkadaşının hareketine göre ayarlanır; ayağa mı, boşluğa mı olduğu bilinçli bir seçimdir.',
    ],
    offBall: [
      'Pas verdikten sonra durmaz; yeni bir pas açısı oluşturmak için hemen konum değiştirir (“pas ver ve git”).',
      'Rakip orta sahanın görüş alanı dışına çıkarak topu güvenli almayı sürdürür.',
    ],
    defending: ['Topu kaybettiğinde çevresindeki oyuncularla ilk saniyelerde baskı yapar; bireysel değil, takım içinde savunur.'],
    lessons: [
      'Topu almadan önce en az iki kez omuz üstünden bak (tarama).',
      'Pas verdikten sonra yürüme: bir sonraki pas açısına hemen koş.',
      'Tek dokunuşla oynamak için topu vücudunun “açık” tarafında karşıla.',
    ],
    watch: [
      'Top ayağına gelmeden önce kaç kez başını çeviriyor?',
      'Pas verdikten sonra bir saniye içinde nereye gidiyor?',
      'İlk dokunuşu hangi yöne ve hangi ayakla?',
    ],
    techs: ['cevre-tarama', 'pas-sonrasi-hareket', 'tek-dokunus-pas', 'yonlu-kontrol', 'pas-acisi-olusturma', 'ucgen-kombinasyon'],
    q: 'Xavi passing scanning analysis',
  },
  {
    id: 'andres-iniesta',
    name: 'Andrés Iniesta',
    pos: 'merkez-orta-saha',
    role: 'Merkez orta saha · sol iç',
    tagline: 'Sıkışık alanda topla yön değiştirip rakibi tek hamlede devre dışı bırakmak.',
    style:
      'Rakibi “bir yere çekip” arkasındaki arkadaşını serbest bırakan oyuncu. Topu iki ayağıyla da yakın kontrol eder; ayakla yön değiştirirken vücudun diğer kısmıyla rakibi yanıltır. Hızı değil, zamanlamasıyla fark yaratır.',
    onBall: [
      'Top ayağında ilerlerken rakip yaklaştığında topu bir ayaktan diğerine geçirerek (“kroket” benzeri) tek hamlede rakibi geçer.',
      'Baskı alanında sakin kalır; çoğu zaman çözümü pas yerine bir “küçük sürme” ile bulur.',
    ],
    offBall: ['Topsuzken iç koridorlarda, rakibin iki oyuncusu arasındaki aralığa yerleşir.'],
    defending: ['Rakibe sert girmek yerine konum ve vücut açısıyla pas yolunu kapatmayı tercih eder.'],
    lessons: [
      'İki ayağınla da topu yakın tut; zayıf ayağınla her gün ayrı çalış.',
      'Rakibi geçmek için hızlanmak şart değil: topun yönünü bir adımda değiştir.',
      'Rakibi çek, arkadaşını boşa çıkar: önce sen sürerek rakibi kendine bağla.',
    ],
    watch: [
      'Rakip yaklaşırken topu hangi ayakla, hangi yüzeyle yönlendiriyor?',
      'Hamlesinden sonra pas mı veriyor, sürmeye mi devam ediyor?',
    ],
    techs: ['yakin-kontrol-surme', 'tempo-degisimi', 'govde-sahtesi', 'dis-ayak-kontrol', 'baski-altinda-kontrol', 'top-koruma'],
    q: 'Iniesta dribbling close control analysis',
  },
  {
    id: 'luka-modric',
    name: 'Luka Modrić',
    pos: 'merkez-orta-saha',
    role: 'Merkez orta saha · oyun kurucu',
    tagline: 'Dış ayakla pas, baskı altında dönüş, uzun ve kısa oyunun dengesi.',
    style:
      'Topu aldığı anda yönünü çevirebilen, baskıyı dönüşle atlatan bir oyun kurucu. Pasta ayağın dış yüzünü ve çeşitli uzaklıkları rahatça kullanır; bu yüzden rakip hangi pasın geleceğini zor tahmin eder.',
    onBall: [
      'Topu ayağın dış yüzüyle yönlendirerek rakibin gölgesinde kalmayı ve pası açıdan çıkarmayı bilir.',
      'Baskı alırken omuz ve kalçayla yön değiştirir (dönüş) ve topu tek hamlede bir sonraki hatta oturtur.',
      'Kısa ve uzun pası aynı vücut duruşundan verebilir; bu, rakibi yanlış tarafa yatırır.',
    ],
    offBall: ['Takım topa sahipken çevresinde sürekli “üçgen” oluşturur; pas verdikten sonra tekrar topa ulaşılabilir bir yerde kalır.'],
    defending: ['Pres tetikleyicilerini iyi okur; hata yapan rakibe geç kalmadan baskı yapar.'],
    lessons: [
      'Pas çeşidini artır: iç yüz, dış yüz, kavisli, yerden uzun. Rakip tahmin etmesin.',
      'Baskı altında dönmeyi çalış: topu al, omzunu aç, tek hamlede yönü değiştir.',
      'Topu verdikten sonra üçgeni tekrar kur.',
    ],
    watch: ['Dış ayakla verdiği paslar hangi durumlarda ortaya çıkıyor?', 'Topu alırken vücudu hangi yöne dönük?'],
    techs: ['dis-ayak-pasi', 'alip-donme', 'baski-altinda-kontrol', 'kavisli-pas', 'uzun-pas', 'ucgen-kombinasyon'],
    q: 'Modric passing analysis',
  },
  {
    id: 'toni-kroos',
    name: 'Toni Kroos',
    pos: 'merkez-orta-saha',
    role: 'Merkez orta saha · derinden oyun kurucu',
    tagline: 'Sakinlik, az dokunuş, uzun ve isabetli yön değiştirme paslarıyla oyunu açmak.',
    style:
      'Acele etmeyen, baskı altında da topu kaybetmeden oynayan bir oyuncu. Oyunun “nereye” gideceğine topu almadan önce karar verir; bu yüzden az dokunuşla oyunu bir kanattan diğerine taşıyabilir.',
    onBall: [
      'Topu alırken vücut açısını önceden hazırlar; ilk dokunuş hemen pas ya da yön değişimi olur.',
      'Uzun diyagonal paslarında topun hızını ve yüksekliğini hedefteki oyuncunun koşusuna göre ayarlar.',
    ],
    offBall: ['Topla buluşmak için sürekli takım arkadaşlarının görüş alanında kalır; çoğu zaman hat arkasından kendini sunar.'],
    defending: ['Pozisyon ve zamanlama ile savunur; koşu hızından çok doğru yerde durmaya güvenir.'],
    lessons: [
      'Pas vermeden önce hedef alanı belirle, sonra topu al.',
      'Uzun pasta topun yüksekliğini ve hızını arkadaşının koşusuna göre seç.',
      'Sakin kal: çoğu zaman en iyi karar “bir dokunuş daha”dır.',
    ],
    watch: ['Pas vermeden önce başı kaç kez dönüyor?', 'Uzun paslarda ayak hangi yüzeyle topa değiyor?'],
    techs: ['uzun-pas', 'asirtma-pas', 'yonlu-kontrol', 'tek-dokunus-pas', 'genis-oyun', 'cevre-tarama'],
    q: 'Kroos long passing analysis',
  },
  {
    id: 'ngolo-kante',
    name: "N'Golo Kanté",
    pos: 'on-libero',
    role: 'Orta saha · top kapma ve geçiş',
    tagline: 'Okumak, araya girmek, topu kazanır kazanmaz ileri taşımak.',
    style:
      'Top kapmayı “kaba kuvvet” yerine tahmin ve zamanlamayla yapan bir orta saha. Pas yollarını önceden kapatır, araya girer, topu kazandıktan sonra hemen ileri taşır ya da ilk uygun oyuncuya verir. Çok alan kapatır; ama bunu doğru zamanda doğru yerde olarak başarır.',
    onBall: ['Topu kazandıktan sonra gereksiz süslemeden ilerler; ilk tercihi basit ve güvenli bir seçeneğe oynamaktır.'],
    offBall: ['Takım savunmadan hücuma geçerken, topla buluşmaya hazır bir şekilde arka destek konumunda kalır.'],
    defending: [
      'Pas yolunu kapatmak için rakibin bakışını ve vücut duruşunu okur; araya girmeyi sürüncemeli girişler yerine kısa ve ani hareketlerle yapar.',
      'Zemindeyken bile hızla kalkıp tekrar baskıya katılır; mücadeleyi tek denemeyle bitirmez.',
    ],
    lessons: [
      'Rakibin kime pas vereceğini baktığı yönden oku; araya girmeyi önceden planla.',
      'Topu kazanınca ilk dokunuşunu ileriye yap.',
      'Alan kapatmak için koşmak yetmez; doğru zamanda başlamak gerekir.',
    ],
    watch: ['Araya girmeden önce rakibin ve kendisinin vücut açısı nasıl?', 'Topu aldıktan sonraki ilk dokunuşu nereye?'],
    techs: ['araya-girme', 'top-kapma-blok', 'baski-kademe', 'kontrol-sonrasi-karar', 'ilk-temas', 'savunma-durusu'],
    q: 'Kante ball recovery interceptions analysis',
  },
  {
    id: 'rodri',
    name: 'Rodri',
    pos: 'on-libero',
    role: 'Ön libero · tek pivot',
    tagline: 'Vücut yönü, pozisyon ve topu koruyarak oyunun merkezi olmak.',
    style:
      'Takımın orta sahasında “dengeyi” taşıyan, topu aldığı anda hem arkasını hem önünü görebilen bir oyuncu. Güçlü gövdesiyle topu rakipten korur; pas seçeneklerini çok erken fark ettiği için topu yavaş değil doğru oynar.',
    onBall: [
      'Topu karşılarken gövdesini rakiple top arasına koyar; baskı altında bile tek dokunuşla temiz çıkar.',
      'Kısa paslarla oyunu sakinleştirir; fırsat doğduğunda hat kıran bir pas dener.',
    ],
    offBall: ['Defans ile orta saha arasında pas açısı verir; rakip presini görünce bir yana kayarak topa ulaşır.'],
    defending: ['Alan ve rakip arasında dengeyi korur; birebire erken girmek yerine pas yollarını kapatır.'],
    lessons: [
      'Gövdeni topla rakip arasına koyarak karşıla.',
      'Orta sahada pas açısı vermek için sürekli rakibin görüş alanı dışına çık.',
      'Savunmada önce pas yolunu kapat, sonra mücadele et.',
    ],
    watch: ['Topu alırken gövdesi rakiple top arasında mı?', 'Baskı geldiğinde seçtiği ilk pas yönü nedir?'],
    techs: ['top-koruma', 'baski-altinda-kontrol', 'hat-arasi-alma', 'cevre-tarama', 'baski-kademe', 'derinlik-pasi'],
    q: 'Rodri pivot positioning analysis',
  },
  {
    id: 'kevin-de-bruyne',
    name: 'Kevin De Bruyne',
    pos: 'on-numara',
    role: 'On numara · hücum orta saha',
    tagline: 'Sert, alçak ortalar; ağırlığı doğru ayarlanmış ara paslar.',
    style:
      'Topa dokunduğu anda hücumun yönünü belirleyen oyuncu. Hem iç hem dış yüzeyle çok sert ve tam isabetli paslar verebilir; ortalarını çoğunlukla yere yakın ve kaleciyle savunma arasına atar.',
    onBall: [
      'İlk dokunuşla topu hemen vuruş yönüne alır; bu yüzden pasa ya da şuta zaman kaybetmeden geçer.',
      'Uzaktan şutu ve ara pası aynı vücut duruşundan yapabilir; savunma hangisini yapacağını tahmin edemez.',
    ],
    offBall: ['Yarım alanlarda (kanatla merkez arası) topu karşılar; oradan hem ortaya hem içe oynayabilir.'],
    defending: ['Pres tetiklendiğinde takım arkadaşlarıyla birlikte çalışır; bireysel savunmadan çok pas yolunu kapatır.'],
    lessons: [
      'Ortayı havadan değil, kaleci ile savunma arasına sert ve yere yakın dene.',
      'İlk dokunuşunu vuruş yönüne at; zaman kazan.',
      'Yarım alanda topu al, sonra seçeneklerine bak.',
    ],
    watch: ['Ortalarında topun yüksekliği ve hızı nedir?', 'Topu almadan önce nereye bakıyor?'],
    techs: ['orta-alcak', 'derinlik-pasi', 'sert-pas', 'uzaktan-sut', 'yonlu-kontrol', 'hat-arasi-alma'],
    q: 'De Bruyne crossing through balls analysis',
  },
  {
    id: 'arda-guler',
    name: 'Arda Güler',
    pos: 'on-numara',
    role: 'On numara · sağ kanat',
    tagline: 'Sol ayakla yaratıcı paslar, hat arasında topu karşılama, serbest vuruş.',
    style:
      'Sol ayağı baskın bir hücum orta saha oyuncusu. Hat aralarında topu alıp yönünü çevirmeyi, yaratıcı paslar vermeyi ve duran toplarda hassas vuruş yapmayı sever. Genç bir oyuncu olduğu için gelişimini izlemek, “yetenek nasıl şekillenir” sorusuna da iyi bir örnek sunar.',
    onBall: [
      'Topu iç koridorda karşılayıp rakip iki oyuncunun arasından açıyı yakalar.',
      'Sol ayakla pas ve şutlarda isabetli yüzey kullanır; vuruş öncesi topu hazırlayıp zaman kazanır.',
    ],
    offBall: ['Takım topa sahipken hat arası boşluklara kayar ve topu hızlı bir dokunuşla yeniden oyuna sokar.'],
    defending: ['Bu rolde savunma görevleri takım yapısına göre değişir; pres tetikleyicilerinde takımla birlikte hareket etmesi beklenir.'],
    lessons: [
      'Güçlü ayağınla yaratıcılığı, zayıf ayağınla basitliği geliştir.',
      'Hat arasında topu almadan önce etrafı tara.',
      'Duran top vuruşunu ayrı ve düzenli çalış.',
    ],
    watch: ['Hat arasında topu aldıktan sonraki ilk dokunuşu nereye?', 'Duran top öncesi top ve ayak yerleşimi nasıl?'],
    techs: ['hat-arasi-alma', 'falsolu-sut', 'serbest-vurus-duvar-ustu', 'yonlu-kontrol', 'ara-pas', 'iceri-kesip-sut'],
    q: 'Arda Güler analiz pas şut',
  },
  {
    id: 'hakan-calhanoglu',
    name: 'Hakan Çalhanoğlu',
    pos: 'merkez-orta-saha',
    role: 'Merkez orta saha · derinden oyun kurucu · duran top',
    tagline: 'Duran top vuruşları, uzun paslar ve güçlü şut.',
    style:
      'Orta alanda oyun kurarken uzun ve isabetli paslarla oyunu açan, duran toplarda ise topa farklı yollarla efekt verebilen bir oyuncu. Serbest vuruşlarda koşu mesafesi, vuruş yüzeyi ve ayak yerleşimi tutarlıdır.',
    onBall: [
      'Topu orta sahada alır ve uzun bir pasla oyunu bir kanattan diğerine taşır.',
      'Serbest vuruşta düzenli bir yaklaşma ve vuruş rutini uygular.',
    ],
    offBall: ['Pas açısı için savunma önünde, rakibin görüş alanı dışında konum alır.'],
    defending: ['Pres ve geçiş anlarında konumunu koruyarak ilk pası kesmeye çalışır.'],
    lessons: [
      'Serbest vuruş için her denemede aynı yaklaşma ve vuruş rutinini uygula.',
      'Uzun pasın isabeti, topu doğru yüzeyle “altından” vurmaktan gelir.',
      'Duran topu ayrı bir antrenman olarak çalış; maçta tekrar etmeyi öğren.',
    ],
    watch: ['Vuruştan önce kaç adım geri gidiyor, ayağını topun neresine koyuyor?', 'Topa hangi yüzeyle değiyor?'],
    techs: ['falsolu-sut', 'serbest-vurus-duvar-ustu', 'uzun-pas', 'uzaktan-sut', 'kavisli-pas', 'serbest-vurus-duvar-yani'],
    q: 'Çalhanoğlu serbest vuruş tekniği',
  },
  {
    id: 'mohamed-salah',
    name: 'Mohamed Salah',
    pos: 'kanat',
    role: 'Sağ kanat · içe kat eden forvet',
    tagline: 'İçeri kesip sol ayakla bitirmek, boşluğa koşu ve tempolu geçişler.',
    style:
      'Sağ kanattan başlayıp içeri doğru koşan, sol ayağıyla topu uzak köşeye yönlendiren bir oyuncu. Rakip savunmanın arkasındaki boşluğa tam zamanında koşar; ani hızlanmalarla savunma çizgisini geriye iter.',
    onBall: [
      'Topla içeri kesip kaleci ile ceza alanı arasında şutu hazırlar.',
      'Kısa mesafede çok hızlı yön değiştirir; topu bir veya iki dokunuşta şut pozisyonuna getirir.',
    ],
    offBall: ['Takım arkadaşı pas açtığı anda savunma arkasına koşar; ofsayt çizgisinde bekleyip zamanlamayı yakalar.'],
    defending: ['Takım presinde ilk baskıyı yapar; bu, topu rakip yarı sahada geri kazanmaya yardım eder.'],
    lessons: [
      'Kanattan içeri kesip uzak köşeye şut dene: topu rakibin dışında tutan ayakla.',
      'Savunmanın arkasına koşmayı, topu alan arkadaşının başını kaldırdığı an başlat.',
      'Bitirmeden önce kalecinin konumuna bak.',
    ],
    watch: ['İçeri keserken topu hangi yüzeyle ve hangi mesafede tutuyor?', 'Koşusunu başlattığı an pası veren oyuncu ne yapıyor?'],
    techs: ['iceri-kesip-sut', 'savunma-arkasina-kosu', 'ofsayt-cizgisi-zamanlama', 'ic-yuz-plase-sut', 'kosu-zamanlamasi', 'birebir-hucum'],
    q: 'Salah movement finishing analysis',
  },
  {
    id: 'vinicius-junior',
    name: 'Vinícius Júnior',
    pos: 'kanat',
    role: 'Sol kanat · birebir çalım',
    tagline: 'Hızla birebir, ani yön değişimi, rakibi kanatta tutmak.',
    style:
      'Birebir durumlarda rakibe doğrudan hücum eden, tempo ve çalım karışımıyla savunmacıyı geri iten bir kanat oyuncusu. Kenarda kalarak rakip bekleri geniş alanda tutar; böylece takım arkadaşları için iç koridorlarda boşluk açılır.',
    onBall: [
      'Topla rakibe doğru hızla gider; yaklaşınca ani yön değişimi ya da bir hareketle (adım üstü) rakibi yanlış ayağa bindirir.',
      'Çalımdan sonra ortaya, şuta ya da iç koşuya ayrılabilir.',
    ],
    offBall: ['Genişlikte kalarak rakip beki geniş alanda sabitler; boşalan alana takım arkadaşları girer.'],
    defending: ['Top kaybında geri dönüşü ve ilk baskıyı hızlı yapmaya çalışır.'],
    lessons: [
      'Birebire rakibe doğru, hızla git; sonra yön değiştir.',
      'Genişlikte kalmak takımın merkezde alan yaratmasına yardım eder.',
      'Her çalımdan sonra bir bitiş seçeneğin (şut, pas, orta) olsun.',
    ],
    watch: ['Rakibe yaklaşırken topla mesafesi nasıl?', 'Çalımdan sonra ilk tercihi nedir?'],
    techs: ['birebir-hucum', 'adim-ustu', 'hizli-top-surme', 'tempo-degisimi', 'iceri-binme', 'orta-alcak'],
    q: 'Vinicius Junior dribbling 1v1 analysis',
  },
  {
    id: 'erling-haaland',
    name: 'Erling Haaland',
    pos: 'santrfor',
    role: 'Santrfor · derinlik koşucusu',
    tagline: 'Savunmanın arkasına koşu, yakın direk zamanlaması, tek dokunuşla bitirme.',
    style:
      'Gol alanında bir pozisyon bulmak için topsuzken çok çalışan bir santrfor. Savunma çizgisinin arkasına zamanında koşar, orta ve pas anında doğru yerde bulunur ve çoğu zaman topu tek dokunuşla ağlara gönderir.',
    onBall: ['Topu karşılarken gövdesiyle savunmacıyı kendinden uzak tutar; ilk dokunuş şut ya da çevirme pozisyonuna doğrudur.'],
    offBall: [
      'Savunma çizgisinin arkasına, arkadaşı başını kaldırdığı anda koşar.',
      'Ortada yakın ya da uzak direğe hareketi savunmacıyı kandırarak son anda yön değiştirir.',
    ],
    defending: ['Santrforun asıl savunma görevi; rakip stoperlerin topu rahat çıkarmasını engelleyen baskı koşularıdır.'],
    lessons: [
      'Her koşunun öncesinde savunmacının bakışını al; baktığı yerin tersine koş.',
      'Yakın direk koşusunu son anda hızlandırarak zamanla.',
      'Tek dokunuşla bitirmeyi, topu hiç durdurmadan duvara çalışarak geliştir.',
    ],
    watch: ['Koşusunu hangi anda başlatıyor?', 'Gol anında ilk dokunuşunun yüzeyi ve yönü nedir?'],
    techs: ['savunma-arkasina-kosu', 'tek-vurus-bitirme', 'kale-onu-kosulari', 'sahte-kosu', 'kosu-zamanlamasi', 'top-koruma'],
    q: 'Haaland runs behind defense analysis',
  },
  {
    id: 'thierry-henry',
    name: 'Thierry Henry',
    pos: 'santrfor',
    role: 'Santrfor · sol kanata kayan forvet',
    tagline: 'Sol koridora kayıp topu yarım dönüşle almak ve uzak köşeye bükmek.',
    style:
      'Orta forvet olarak başlayıp çoğu zaman sol koridora kayan, orada topu yarım dönüşle alan ve içeri doğru sürerek uzak köşeye bükerek bitiren bir oyuncu. Hızını, açıyı ve ilk dokunuşunu birleştirir.',
    onBall: [
      'Topu yan koridorda alır, topu bir dokunuşla içeri iterek şut açısı yaratır.',
      'Bitirmede iç yüz ile topu uzak köşeye doğru kavisli gönderir.',
    ],
    offBall: ['Savunma çizgisi ile kanat arasında hareket ederek stoperi merkezden uzaklaştırır.'],
    defending: ['Bu oyun tarzında savunmaya katkı genellikle ilk baskı ve geri dönüşle sınırlıdır.'],
    lessons: [
      'Topu yan koridorda yarım dönük al: omuz kaleye açık.',
      'Şutu iç yüzle uzak köşeye “sar”.',
      'Hareketini stoperin yanından ve onun arkasına başla.',
    ],
    watch: ['Topu almadan önce vücudu hangi yöne dönük?', 'Şutta ayağı topun neresine değiyor?'],
    techs: ['ic-yuz-plase-sut', 'hat-arasi-alma', 'pozisyon-degistirme', 'yonlu-kontrol', 'kapali-aci-bitirme', 'savunma-arkasina-kosu'],
    q: 'Thierry Henry finishing analysis',
  },
  {
    id: 'virgil-van-dijk',
    name: 'Virgil van Dijk',
    pos: 'stoper',
    role: 'Stoper · hava ve birebir',
    tagline: 'Sakin savunma, geç ve temiz müdahale, uzun paslarla oyun kurma.',
    style:
      'Birebirde acele etmeyen, rakibi dışarıya yönlendirip müdahaleyi doğru anda yapan bir stoper. Hava toplarında güçlü; topla oyun kurarken uzun ve isabetli paslarla takımı ileriye taşır.',
    onBall: ['Uzun diyagonal paslarla savunmadan hücuma geçişi hızlandırır; baskı altında topu rahatça korur.'],
    offBall: ['Savunma hattını yönetir; arkadaşlarını yerleştirir, ofsayt çizgisinin yüksekliğini belirler.'],
    defending: [
      'Birebirde rakibi iyi ayağından uzaklaştırır; geri çekilerek zaman kazanır ve müdahaleyi dengesini koruyarak yapar.',
      'Hava toplarında doğru zıplama zamanını seçer; rakibin vücut hareketini önceden okur.',
    ],
    lessons: [
      'Birebirde acele etme; rakibi dışa yönlendir.',
      'Savunma hattında konuşarak takımı yönet.',
      'Hava topuna zıplamayı rakibin hareketine göre zamanla.',
    ],
    watch: ['Birebirde bacak ve gövde duruşu nasıl?', 'Müdahaleye girmeden önce ne kadar bekliyor?'],
    techs: ['birebir-savunma', 'savunma-hatti', 'savunma-kafasi', 'uzun-pas', 'savunma-durusu', 'yan-yan-geri-kayma'],
    q: 'Van Dijk defending 1v1 analysis',
  },
  {
    id: 'philipp-lahm',
    name: 'Philipp Lahm',
    pos: 'bek',
    role: 'Bek · içeri kayan bek',
    tagline: 'Pozisyon zekâsı: iki kanatta da oynayabilen, gerektiğinde orta sahaya kayan bek.',
    style:
      'Bek olarak hem savunma hem hücum görevlerini dengeli oynayan, takım topa sahipken içeri kayıp orta saha desteği veren bir oyuncu. Fiziksel üstünlükten çok zamanlama ve konumla fark yaratır.',
    onBall: ['Basit ve doğru paslar verir; hücumda hızlı bindirme yerine orta sahada oyuna dahil olmayı tercih eder.'],
    offBall: ['Takım topa sahipken iç koridora kayarak orta sahada sayısal üstünlük yaratır.'],
    defending: ['Pozisyonu sayesinde birebirlere erken girmeden alanı kapatır; top kapma anında doğru açıyı seçer.'],
    lessons: [
      'Bekin işi yalnızca kenarda koşmak değil; takımın ihtiyacına göre içeri kaymayı öğren.',
      'Savunmada konumunla alan kapat; mücadeleyi son çare olarak düşün.',
      'Basit pası doğru zamanda ver.',
    ],
    watch: ['Takım topa sahipken nerede duruyor?', 'Rakip kanat geldiğinde ayakları ve gövdesi nasıl?'],
    techs: ['savunma-durusu', 'iceri-binme', 'bindirme', 'baski-kademe', 'yan-yan-geri-kayma', 'pozisyon-degistirme'],
    q: 'Philipp Lahm positioning full back analysis',
  },
  {
    id: 'manuel-neuer',
    name: 'Manuel Neuer',
    pos: 'kaleci',
    role: 'Kaleci · libero kaleci',
    tagline: 'Ceza alanının dışında oynayan, ayağıyla oyun kuran modern kaleci.',
    style:
      'Savunma hattının arkasındaki boşluğu koruyan ve topu ayağıyla oyuna sokan bir kaleci. Hat arkasına atılan toplara çıkar, ayağıyla pas yapar ve takımın savunma hattını daha yukarıda oynatabilmesine olanak verir.',
    onBall: ['Topu ayağıyla alıp kısa ya da uzun pasla oyunu başlatır; baskı altında sakin kalır.'],
    offBall: ['Takım hücumdayken kalesinden çıkıp savunma hattının arkasında konumlanır ve uzun topları kesmeye hazır bekler.'],
    defending: [
      'Birebirlerde alanı hızlıca kapatır ve topa erken çıkar.',
      'Kaleden uzaklaşırken geri dönüş hızı ve rakip pozisyonuna göre karar verir.',
    ],
    lessons: [
      'Takım hücumdayken konumunu kalede değil, hat arkasında ayarla.',
      'Ayakla pası günlük çalış; iki ayakla ve farklı mesafelerde.',
      'Birebirde alan kapat: ne çok erken ne çok geç çık.',
    ],
    watch: ['Rakip hücumdayken kalecinin konumu nerede?', 'Ayağıyla oyun kurarken kaç dokunuş yapıyor?'],
    techs: ['ayakla-oyun-kurma', 'birebirde-cikis', 'aci-kapama', 'kaleci-durusu', 'orta-kesme', 'elle-atis'],
    q: 'Neuer sweeper keeper analysis',
  },
  {
    id: 'trent-alexander-arnold',
    name: 'Trent Alexander-Arnold',
    pos: 'bek',
    role: 'Sağ bek · orta sahaya kayan bek',
    tagline: 'Hücumda içeri kayan, uzun ve isabetli paslar veren, ortacı bek.',
    style:
      'Sağ bek olarak başlayıp topla ilerlerken içeri kayıp orta sahada oyun kurmaya katılan bir oyuncu. Uzun diyagonal paslar ve kavisli ortalar bu tarzın imzası; savunma tarafındaki birebir görevleri ise sık sık tartışma konusu olmuştur.',
    onBall: ['Orta alanda topla buluşup bir kanattan diğerine uzun pasla oyunu açar.', 'Ortalarını hızlı ve kavisli gönderir.'],
    offBall: ['Takım hücumdayken beki yalnızca kenar olarak değil, orta saha oyuncusu gibi kullanır.'],
    defending: ['Bek içeri kaydığında kenar alan boş kalabilir; bu rol, takım arkadaşlarının kademesi ve geri dönüşüyle birlikte çalışır.'],
    lessons: [
      'Bek hücumdayken içeri kayarsa takım arkasında kimin kalacağını önceden planla.',
      'Uzun diyagonal pası iki dokunuşla çalış.',
      'Savunma dengesi: hücuma çıkarken arkandaki alanı kimin koruduğunu bil.',
    ],
    watch: ['Takım hücumdayken kaç metre içeride duruyor?', 'Top kaybı olduğunda arkasındaki alanı kim koruyor?'],
    techs: ['uzun-pas', 'kavisli-pas', 'orta-yuksek', 'iceri-binme', 'baski-kademe', 'genis-oyun'],
    q: 'Alexander-Arnold inverted full back analysis',
  },
];

const DEEP: Record<string, PlayerDeep> = { ...DEEP_BARCA, ...DEEP_MID, ...DEEP_ATT, ...DEEP_DEF };

export const PLAYERS: PlayerAnalysis[] = [...OLD_PLAYERS, ...NEW_PLAYERS].map((b) => {
  const d = DEEP[b.id];
  if (!d) throw new Error(`players: "${b.id}" için derin bölümler (data/player-deep) yok`);
  return { ...b, ...d };
});

export const PLAYER_BY_ID: Record<string, PlayerAnalysis> = Object.fromEntries(PLAYERS.map((p) => [p.id, p]));
