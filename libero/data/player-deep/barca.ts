import type { PlayerDeep } from '../player-types';
import { cv, wiki } from './_src';

/** Derinleştirilmiş bölümler: Messi (en kapsamlı), Xavi, Iniesta, Busquets */
export const DEEP_BARCA: Record<string, PlayerDeep> = {
  'lionel-messi': {
    kind: 'yaratici',
    deep: true,
    positioning: [
      'Rakip orta saha ile savunma arasındaki aralıkta, yani hat arasında durmayı sever; topu o aralıkta, rakibin görüş alanının kenarında karşılar.',
      'Serbest bir hücum rolü oynar: sağ kanat, sahte dokuz ya da klasik on numara gibi görevlerde bulunmuştur. Ortak noktası, topu sahanın yoğun bölgesine, yani merkeze yakın almasıdır.',
      'Sağ kanattan içeri kesip topu sol ayağına getirmek en bilinen kalıbıdır: kenardan içeri girerek sol ayakla pas ya da şut açısı bulur.',
      'Sahte dokuz görevinde ileri uçta beklemez; orta sahaya düşüp savunmacıyı peşinden çeker, açılan boşluğu takım arkadaşlarının koşularına ve kendi sürüşüne bırakır.',
      'Yaşı ilerledikçe daha geride, oyunu yöneten bölgelerde konumlanmış; daha az koşup enerjisini kısa ve etkili hamlelere saklamayı seçmiştir.',
    ],
    passing: [
      'Pas ve oyun görüşü, oyununun en az konuşulan ama en değerli yanlarından biridir: hat kıran, ağırlığı iyi ayarlanmış ileri paslar verir.',
      'Pası koşana göre zamanlar: forvete, bindiren beke ya da geç gelen orta saha oyuncusuna topu koşusunun önüne bırakır.',
      'Pasını vücut hareketiyle gizler; savunmacı yönü geç fark eder, takım arkadaşı da cesur koşular yapmaya güvenir.',
      'Kısa duvar pasları ve üçüncü adam koşuları, hızı azaldıkça daha önemli hâle gelmiştir; Xavi ve Iniesta ile kurduğu ilişkiler bu tarzın bilinen örnekleridir.',
      'Gerektiğinde savunmanın üstünden, forvet ya da kanat oyuncusu için aşırtma pası da verir.',
    ],
    control: [
      'Topu ayağına yapışık gibi tutar; dokunuşlar küçük ve sıktır, her dokunuş bir sonraki seçeneği korur.',
      'Alçak ağırlık merkezi ve dengesi sayesinde baskı altında ve temas sonrasında bile kontrolünü kaybetmez.',
      'Sürüşe çoğunlukla sol ayağın dış yüzüyle başlar; pas ve bitirmede iç yüzü kullanır.',
      'Hızlıyken bile topu kontrol eder: top, koşu hızını düşürmeyen küçük dokunuşlarla ilerler.',
      'İlk dokunuşu topu durdurmak için değil, bir sonraki hareketin yönüne itmek için kullanır; ikinci dokunuş pasa ya da şuta hazırdır.',
      'Baskın ayağı soldur; sağ ayağını sonradan belirgin biçimde geliştirdiği anlatılır.',
    ],
    decisions: [
      'Çalım amaç değil, zaman ve açı kazanma aracıdır: rakibi geçtikten hemen sonra pas, şut ya da yeni bir sürüşü seçer.',
      'Önce savunmacının ağırlığına bakar, sonra yön değiştirir; rakibi yanlış ayağa bindirdiği an hamleyi yapar.',
      'Şut için çoğu zaman sol ayağına denk gelecek bir açı kurar ve şutunu son ana kadar gizler.',
      'Yaşla birlikte uzun sürüşleri azaltıp pas ve oyunun ritmini yönetmeyi öne çıkarmıştır; karar ölçütü “ben geçeyim”den “takım için en iyi seçenek”e kaymıştır.',
    ],
    strengths: [
      'Alçak ağırlık merkezi, denge ve çeviklikle yön değiştirme; rakibin temasından kurtulma.',
      'Hızlı ayaklarla topu kaybetmeden ilerleme; topla koşarken yavaşlamama.',
      'Pas, sürme ve bitirmeyi aynı hareketin parçası olarak kullanma.',
      'Pasın ağırlığı ve zamanlaması; oyun görüşü.',
      'Rolünü yıllar içinde değiştirebilme: kanat, sahte dokuz, derin oyun kurucu.',
    ],
    limits: [
      'Yaşla birlikte hız ve uzun sürüşlerin sıklığı azalmıştır; fark yaratmayı daha çok pozisyon ve pasla yapar.',
      'Topsuz savunma katkısı ve baskı yoğunluğu düşüktür; takım presi bu yüzden ona göre kurulur.',
      'Bu oyun tarzı takım yapısına bağlıdır: çevresindeki oyuncuların koşuları ve takımın ona alan açması gerekir.',
      'Taklit ederken dikkat: “yürüyerek alan bulma” yöntemi çok iyi bir tarama ve zamanlama ister. Önce koşu temelini, taramayı ve zayıf ayağı geliştir; yürümeyi sonra ekle.',
    ],
    similar: ['andres-iniesta', 'ronaldinho', 'zinedine-zidane', 'kevin-de-bruyne'],
    sources: [
      wiki('Lionel Messi', 'Lionel_Messi', 'Oyun tarzı ve taktik konumlanma bölümleri: alçak ağırlık merkezi, sol ayakla sürme, rol değişimi (sağ kanat, sahte dokuz, derin oyun kurucu).'),
      cv(
        'The Coaches’ Voice — Lionel Messi: Ligue 1 Player Watch (Tony Hodson, 20 Ocak 2022)',
        'https://learning.coachesvoice.com/cv/lionel-messi-psg-barcelona-scout-report/',
        'Topu almadan önce durup rakibi çekme, omuz sahtesi, pasın ağırlığı ve zamanlaması, duvar pası ve üçüncü adam koşuları, sınırlılıklar.',
      ),
    ],
    videos: ['qCnyXi0bHWI', '5GdObYQTDqQ', 'gVY-saeJnkk', 'UnbGJj3VwoM', 'bUpwuvGYqh8', '5LEf1rqAolc'],
    videoLooks: {
      surme: 'Messi’de topla mesafeye, dokunuşların sıklığına ve rakibe yaklaşınca yön değiştirdiği ana bak. Aynı üç noktayı videodaki sürüş örneğinde de ara.',
      kontrol: 'Messi topu durdurmaz, yönlendirir: ilk dokunuştan sonra ikinci dokunuşu nereye gidiyor? Videodaki ilk temas çalışmasında aynı soruyu sor.',
      taktik: 'Hat arası ve yarım alan, Messi’nin topu aldığı bölgelerdir. Videodaki alanı bir sahada işaretle, sonra maç görüntüsünde topu bu alanda kaç kez aldığını say.',
      pas: 'Messi’de pasın ağırlığına ve pasını vücut hareketiyle nasıl gizlediğine bak; videodaki temel pas tekniğini bu ayrıntılarla karşılaştır.',
    },
    extra: [
      {
        title: 'Rolün yıllar içinde değişimi',
        items: [
          'Çocukken en sevdiği yer, iki forvetin arkasında oyun kuran “enganche” (Arjantin futbolundaki klasik on numara) rolüydü; profesyonelliğe sol kanat ya da sol taraflı forvet olarak başladı.',
          'Sağ kanada alınınca içeri kesip topu sol ayağına getirmek öne çıktı: ortadan çok, içeri girip pas ya da şut açısı bulmak.',
          'Sahte dokuz görevinde orta sahaya inerek savunmacıları peşinden çekti ve takım arkadaşlarına alan açtı.',
          'Sonraki yıllarda daha derin, serbest bir oyun kurucu rolüne kaydı: daha az koşup oyunu daha geriden yönetti.',
        ],
      },
      {
        title: 'Neden zor durdurulur? Oyun mantığı',
        items: [
          'Yürüyerek ve etrafı tarayarak boşluğu seçer; hızlı koşanların arasında rakibin görüş alanı dışında kalır.',
          'Duruştan hızlanır: yerinden ani çıkış, savunmacının dengesini bozar.',
          'Omuz sahtesi ve yön değişimiyle rakibin ağırlığını yanlış ayağa bindirir.',
          'Pas, sürme ve şut aynı vücut duruşundan çıkar; savunmacı hangisinin geleceğini önceden bilemez.',
        ],
      },
      {
        title: 'Bir haftalık “Messi gibi izle” görevi',
        items: [
          'Gün 1: Beş dakikalık bir maç görüntüsünde yalnızca “topsuzken nerede duruyor?” sorusunu izle ve durduğu bölgeleri not et.',
          'Gün 2: Topu almadan önce başını kaç kez çevirdiğini say.',
          'Gün 3: Rakibe yaklaşırken ne yaptığını üçe ayır: duruyor, sürüyor ya da pas veriyor.',
          'Gün 4: Antrenmanda dar alanda yalnızca iki dokunuşla oyna: karşıla ve yönlendir.',
          'Gün 5: Kendi maç videonda aynı soruları sor; sonuçlarını Video analizi aracındaki işaretlere yaz.',
          'Gün 6–7: Bir teknik seç (aşağıdaki bağlantılardan) ve yalnızca onu çalış; hafta sonunda yeniden kaydet.',
        ],
      },
    ],
  },

  'xavi-hernandez': {
    kind: 'oyun-kurucu',
    positioning: [
      'Sürekli boşluk arar: topu almadan önce hangi alanın açık olduğunu bilir; “gün boyu boşluk ararım” diyen bir orta sahadır.',
      'Kariyerinde derinden oyun kuran orta sahadan, üç orta sahalı dizilimde daha ileri bir iç orta saha rolüne kaymıştır; rolü değiştirdikçe oyun biçimini de uyarlamıştır.',
    ],
    passing: [
      'Topu alır ve hemen aktarır: oyun “al, ver, al, ver” ritmindedir; topu tutmak yerine doğru anda bırakır.',
      'Pasın hızı ve hedefi, takım arkadaşının hareketine göre seçilir; oyun görüşü ve isabeti bu yüzden öne çıkar.',
      'Üçüncü adam koşularını oyunun merkezine koyan bir takımda oynamıştır: top iki oyuncu arasında dolaşırken üçüncü oyuncu boşluğa koşar.',
    ],
    control: [
      'Baskı altında 360 derecelik bir dönüşle (pelopina) rakipten uzaklaşır ve bir sonraki pası düşünmek için zaman kazanır.',
      'Topu almadan önce etrafına bakarak pas açısını hazırladığı için az dokunuşla oynar.',
    ],
    decisions: [
      'Maçın temposunu belirler: oyunu ne zaman hızlandırıp ne zaman yavaşlatacağını seçer.',
      'Basit olanı doğru zamanda seçer; amacı gösterişli pas değil, takımın topu kaybetmeden ilerlemesidir.',
    ],
    strengths: [
      'Oyun görüşü, pozisyon ve oyunu okuma.',
      'Pasın isabeti ve zamanlaması.',
      'Dar alanda sakin kalma ve az dokunuşla oynama.',
    ],
    limits: [
      'Hız ve fiziksel üstünlükle fark yaratan biri değildir; bunu zihinsel hızı ve konumuyla kapatır.',
      'Top kapma ve gol bitiriciliği ile tanınan bir oyuncu değildir; katkısı kurma ve yaratmadan gelir.',
      'Taklit ederken dikkat: bu tarz, topu tutan bir takımı ve çevrede pas açısı veren oyuncuları gerektirir.',
    ],
    similar: ['andres-iniesta', 'sergio-busquets', 'luka-modric'],
    sources: [
      wiki('Xavi', 'Xavi_(footballer,_born_1980)', 'Oyun tarzı: boşluk arama, derinden oyun kurma, 360 derecelik dönüş (pelopina), isabetli pas.'),
      cv(
        'The Coaches’ Voice — Xavi II (Masterclass, Ali Tweedale, 10 Şubat 2022)',
        'https://learning.coachesvoice.com/cv/xavi-tactics-barcelona-rijkaard-guardiola-third-man/',
        'Derinden oyun kurucudan ileri iç orta saha rolüne geçiş, üçüncü adam ve dördüncü adam koşuları. Sayfanın okunabilen kısmı kısa bir girişle sınırlıdır.',
      ),
    ],
    videos: ['hjq0tlyx4-Y', 'vf0AkYAL6Ig', 'wgqqT5L-vZw', 'N_w6d6y4i58', 'IH0Tub-jcN0'],
    videoLooks: {
      taktik: 'Xavi’de orta sahanın boşluğu nasıl aradığına bak: topu almadan önce başı kaç kez dönüyor, pasından sonra nereye gidiyor? Videodaki orta saha ilkeleriyle karşılaştır.',
      topsuz: 'Videodaki tarama ve üçüncü adam fikrini Xavi’de ara: o top kendisindeyken değil, başkasındayken ne yapıyor, nerede duruyor?',
      pas: 'Xavi’nin pası bir üçgenin parçasıdır. Videodaki üçgen çalışmasında topu verdikten sonra bir sonraki açıya ne kadar çabuk gittiğine bak.',
    },
  },

  'andres-iniesta': {
    kind: 'yaratici',
    positioning: [
      'İç koridorlarda, rakibin iki oyuncusu arasındaki aralığa yerleşir; sol iç orta saha olarak topu dar alanda karşılar.',
      'Çok rollü bir oyuncudur: sahte kanat, merkez orta saha, derin orta saha ve forvetin hemen arkası; ortak yanı topu sıkışık alanda alıp çözmesidir.',
    ],
    passing: [
      'Pas, teknik ve oyun görüşünü birleştirir; rakibi kendine bağlayıp arkasındaki arkadaşını serbest bırakır.',
      'Xavi ile özel bir anlayışı vardır: ikisi birbirinin nerede olduğunu görmeden bilir gibi oynar.',
    ],
    control: [
      'Topu iki ayağıyla da yakın tutar; dar alanda denge ve çeviklikle çıkar.',
      'Kroket hareketi: topu bir ayaktan diğerine hızla iterek rakibin ayağından uzaklaştırır.',
    ],
    decisions: [
      'Zaman ve alan ilişkisini yönetir: rakibi yanıltmak için ne zaman bekleyeceğini, ne zaman hızlanacağını seçer.',
      'Çözümü çoğu zaman pas yerine küçük bir sürüşle bulur; rakibi çekip arkadaşına alan açar.',
    ],
    strengths: [
      'Dar alanda yön değiştirme ve yakın top kontrolü; çok hızlı olmadan rakibi geçme.',
      'Oyunu okuma, yaratıcılık ve çalışkanlık.',
      'Farklı orta saha rollerine uyum.',
    ],
    limits: [
      'Hız avantajı yoktur; fark yaratmayı zamanlama ve yönle yapar.',
      'Gol yollarıyla değil, yaratma ve ilişki kurmayla anılan bir oyuncudur.',
      'Taklit ederken dikkat: bu oyun, topu iki ayakla da rahat taşıyabilmeyi gerektirir; zayıf ayağı ihmal edenler için zordur.',
    ],
    similar: ['xavi-hernandez', 'lionel-messi', 'bernardo-silva'],
    sources: [wiki('Andrés Iniesta', 'Andr%C3%A9s_Iniesta', 'Oyun tarzı: dar alanda denge, yakın kontrol, “kroket” hareketi, çok yönlülük, Xavi ile uyum.')],
    videos: ['gVY-saeJnkk', 'NDCEDQ5K2vQ', '_uuqsGCiM9I', '8b0OdCZLOzI'],
    videoLooks: {
      surme: 'Iniesta’da rakip yaklaşırken topu hangi ayakla ve hangi yüzeyle yönlendirdiğine bak. Videodaki çalım ya da top saklama hareketini aynı gözle izle.',
      kontrol: 'Dar alanda topu iki ayakla tutmanın faydasını Iniesta’da ara: ilk temas çalışmasında zayıf ayağını da dene.',
      hucum: 'Duvar pası, rakibi çekip arkadaşı serbest bırakmanın bir yoludur. Iniesta’da rakibi nasıl kendine bağladığına bak.',
    },
  },

  'sergio-busquets': {
    kind: 'denge',
    positioning: [
      'Savunma ile orta saha arasında, çoğu zaman tek pivot olarak durur; topun çevresinde pas açısı verebileceği konumu sürekli arar.',
      'Teknik direktör Vicente del Bosque’nin sözü rolü iyi anlatır: maçı baştan sona izlersen Busquets’i fark etmezsin, Busquets’i izlersen maçın tamamını görürsün.',
    ],
    passing: [
      'Kısa ve isabetli paslarla takımın temposunu ve akışını belirler; topu nadiren kaybeder.',
      'Pası çoğu zaman en basit ve güvenli seçeneğe verir; gösterişten çok oyunun sürmesini sağlar.',
    ],
    control: [
      'Baskı altında sakin kalır; vücudu ve ilk dokunuşuyla kendine alan açar.',
      'Boyu sayesinde havada da etkilidir; gerektiğinde daha ileri çıkıp ek bir hücum seçeneği olabilir.',
    ],
    decisions: [
      'Önceden okur: pas yollarını ve gevşek topları hızla değil, konum ve zekâyla kapar.',
      'Topu kazanınca basit bir seçenekle takımı dengede tutar; riskli pası ancak açık olduğunda dener.',
    ],
    strengths: [
      'Oyun okuma, konum ve taktik zekâ.',
      'Topu kaybetmeden dolaştırma; sakinlik.',
      'Hem savunma hem oyun kurma görevlerini aynı rolde taşıma.',
    ],
    limits: [
      'Hızlı bir oyuncu değildir; bu yüzden konumunu ve zamanlamasını bozmamak zorundadır.',
      'Rolün işleri görünmezdir; antrenmanda başını kaldırıp bakma alışkanlığı kazanmak, bu rolü taklit etmenin ön koşuludur.',
    ],
    similar: ['rodri', 'xavi-hernandez', 'ngolo-kante'],
    sources: [wiki('Sergio Busquets', 'Sergio_Busquets', 'Oyun tarzı: konum, oyun okuma, kısa pas oyunu, tek pivot rolü, hızın sınırlı olması.')],
    videos: ['FmVQniDnqCg', 'VbMqw-9nIEQ', 'vf0AkYAL6Ig', 'N_w6d6y4i58'],
    videoLooks: {
      taktik: 'Busquets’te topu almadan önceki konumuna bak: savunma ile orta saha arasında nerede duruyor, takım topu kaybedince nerede? Videodaki oyun kurma fikrini bu konumla ilişkilendir.',
      topsuz: 'Videodaki tarama alışkanlığını Busquets’te ara: topu almadan önce kaç kez etrafına bakıyor?',
      pas: 'Üçgenin en basit köşesi çoğu zaman pivottur. Busquets’in hangi pası seçtiğine ve ardından nereye gittiğine bak.',
    },
  },
};
