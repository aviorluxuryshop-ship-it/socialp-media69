// Futbolcu beslenmesi ve toparlanma rehberi: bölümler, uzman inceleme listesi, örnek günlük planlar ve metin verisi.
// KURALLAR (scripts/logic-tests/nutrition.mjs ile denetlenir):
//  • Her bölüm en az bir mevcut kaynak kimliğine (data/sources.ts) dayanır.
//  • Sayfadaki her "Uzman incelemesi" rozeti REVIEW_ITEMS listesinde bulunur; listedeki her madde en az bir yerde kullanılır.
//  • 17 yaş ve altı için kalori, gram ya da kilo hedefi yoktur; öğünlerde takviye, kafein, enerji içeceği ya da spor içeceği yoktur.
import type { AgeBand, DayType, SlotKey } from '@/lib/nutrition';

export interface GuideSection {
  id: string;
  no: string;
  /** yapışkan menüde kısa ad */
  nav: string;
  title: string;
  em?: string;
  lead: string;
  sources: string[];
  /** özet/kaynak bölümleri gibi kendisi kaynak göstermeyen bölümler */
  meta?: boolean;
}

export const SECTIONS: GuideSection[] = [
  { id: 'temel-ilkeler', no: '01', nav: 'Temel ilkeler', title: 'Önce sofra,', em: 'sonra her şey', lead: 'Performansın temeli dengeli, çeşitli ve düzenli beslenmedir. Enerji, karbonhidrat, protein, yağ ve mikro besinler; hepsi aynı tabakta buluşur.', sources: ['tuber', 'who-diet', 'sda-adolescent', 'uefa-nutrition', 'acsm-nutrition', 'reds-2014'] },
  { id: 'oncesi', no: '02', nav: 'Öncesi', title: 'Antrenman ve maç', em: 'öncesi', lead: 'Amaç yeni bir şey denemek değil; mideyi yormadan, tanıdık yiyeceklerle enerjiyi hazırlamak.', sources: ['tuber', 'sda-adolescent', 'acsm-fluid-2007', 'uefa-nutrition'] },
  { id: 'sirasinda', no: '03', nav: 'Sırasında', title: 'Antrenman', em: 'sırasında', lead: 'Çoğu antrenmanda su yeterlidir. Sıcakta ve uzun süren etkinliklerde ek önlemler gerekir; çocuklar için özel dikkat kuralları vardır.', sources: ['tuber', 'acsm-fluid-2007', 'aap-drinks-2011', 'aap-heat-2011'] },
  { id: 'sonrasi', no: '04', nav: 'Sonrası', title: 'Sonrası:', em: 'toparlanma', lead: 'Antrenmandan sonra karbonhidrat, protein ve sıvı birlikte iyi bir fikirdir. Ancak sihirli bir saat ya da özel bir ürün yoktur.', sources: ['sda-adolescent', 'tuber', 'acsm-nutrition'] },
  { id: 'sivi', no: '05', nav: 'Sıvı', title: 'Sıvı tüketimi ve', em: 'idrar rengi', lead: 'Susamayı beklemeyin, ama aşırıya da kaçmayın. İdrar rengi, evde yapılabilecek en kolay sıvı kontrolüdür.', sources: ['tuber', 'acsm-fluid-2007', 'nata-fluid-2017', 'aap-drinks-2011', 'aap-heat-2011', 'sda-adolescent'] },
  { id: 'uyku', no: '06', nav: 'Uyku', title: 'Uyku:', em: 'görünmez antrenman', lead: 'Uyku, çocuk ve ergenlerde sağlığın temel bir parçasıdır (AASM). Uyku ihtiyacı yaşa göre değişir.', sources: ['aasm-sleep-2016', 'sleep-athlete-2021', 'aap-media-2016', 'aap-drinks-2011'] },
  { id: 'dinlenme', no: '07', nav: 'Dinlenme', title: 'Dinlenme ve', em: 'toparlanma', lead: 'Gelişme yükle değil, yük ile dinlenmenin dengesiyle olur. Yoğun fikstürde bu denge daha da önemlidir.', sources: ['overtraining-2013', 'aap-heat-2011', 'reds-2023'] },
  { id: 'uyari', no: '08', nav: 'Uyarı işaretleri', title: 'Bunları görürsen', em: 'bir yetişkine söyle', lead: 'Yetersiz yeme ve yetersiz enerji sessizce ilerleyebilir. Bu sayfa tanı koymaz; ama işaretleri tanımak erken yardım almanın yoludur.', sources: ['reds-2023', 'reds-2014', 'tuber'] },
  { id: 'mac-gunu', no: '09', nav: 'Maç günü', title: 'Maç günü', em: 'planı', lead: 'Maç saatini gir; yeme, içme ve dinlenme çizelgeni oluştursun. Çizelge örnektir; sana göre ayarlanır.', sources: ['uefa-nutrition', 'tuber', 'acsm-fluid-2007', 'sda-adolescent'] },
  { id: 'turnuva', no: '10', nav: 'Turnuva', title: 'Turnuva ve', em: 'birden çok maç', lead: 'Aynı gün birden çok maç, toparlanma için kısa bir zaman demektir. Önceden plan yapmak, günün sonuna kadar enerjiyi korumaya yardım eder.', sources: ['aap-heat-2011', 'acsm-fluid-2007', 'uefa-nutrition', 'tuber'] },
  { id: 'takviye', no: '11', nav: 'Takviyeler', title: 'Takviyeler:', em: 'çocuklar için değil', lead: 'Gençler için önce sofra. Takviye, hekim ya da diyetisyen değerlendirmesi olmadan kullanılmaz.', sources: ['ioc-supplements', 'aap-drinks-2011', 'sda-adolescent', 'tuber'] },
  { id: 'ramazan', no: '12', nav: 'Ramazan', title: 'Ramazan ve', em: 'sporcu', lead: 'Oruç tutmak kişisel bir karardır. Sporcu olarak oruç tutmayı düşünüyorsan, özellikle çocuk ve ergenlerde, önce hekime danış.', sources: ['ramadan-2012', 'uefa-nutrition'] },
  { id: 'alerji', no: '13', nav: 'Alerji', title: 'Alerji, intolerans ve', em: 'alternatifler', lead: 'Alerjin ya da yiyemediğin besinler varsa filtrele; sevmediğin ya da bulamadığın bir yiyeceğin yerine ne yiyebileceğini gör.', sources: ['tuber', 'who-diet'] },
  { id: 'menuler', no: '14', nav: 'Örnek menüler', title: 'Örnek öğünler ve', em: 'günlük planlar', lead: 'Yaş grubuna ve gün tipine göre Türk mutfağından örnekler. Kalori ya da gram verilmez; tabak modeli ve porsiyon kılavuzu kullanılır.', sources: ['tuber', 'sda-adolescent', 'who-diet'] },
  { id: 'planlayici', no: '15', nav: 'Haftalık plan', title: 'Haftalık öğün planlayıcı ve', em: 'alışveriş listesi', lead: 'Haftanı kur, alışveriş listeni çıkar, yazdır. Plan yalnızca bu tarayıcıda saklanır.', sources: ['tuber', 'who-diet'] },
  { id: 'uzman', no: '16', nav: 'Uzman incelemesi', title: 'Uzman incelemesi gerektiren', em: 'içerik', lead: 'Bu sayfanın içeriğinin hiçbir bölümü henüz bir spor diyetisyeni, çocuk sağlığı uzmanı ya da spor hekimi tarafından incelenmemiştir. Aşağıdaki maddeler en çok dikkat isteyenlerdir ve yayına almadan önce incelenmelidir.', sources: [], meta: true },
  { id: 'kaynaklar', no: '17', nav: 'Kaynaklar', title: 'Dayandığımız', em: 'kaynaklar', lead: 'Bağlantılar bu rehber hazırlanırken denetlendi. Her kaynak için hangi düzeyde okunduğu belirtilmiştir.', sources: [], meta: true },
];
export const SECTION_BY_ID: Record<string, GuideSection> = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

// ── Uzman incelemesi gerektiren içerik ───────────────────

export interface ReviewItem {
  id: string;
  area: string;
  what: string;
  why: string;
  reviewer: string;
  /** kaynak doğrulanamadı: genel uygulama ya da yorum */
  unverified?: boolean;
}
export const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'porsiyon', area: 'Temel ilkeler, Örnek menüler', what: 'Yaş grubuna göre porsiyon yaklaşımı (tabak payları, süt grubu için “yaklaşık 4 porsiyon”, çocuğun doyma sinyaline güvenme).', why: 'Büyüme dönemindeki sporcular için porsiyon ve enerji ihtiyacı kişiye göre çok değişir; sayfa kalori ya da gram vermez. “Yaklaşık 4 porsiyon süt grubu” TÜBER’in genç sporcular için verdiği kalsiyum örneğine, “tabağa yiyebileceği kadar yemek konması” ise TÜBER’in okul öncesi çocuklara yönelik önerisine dayanır; 6–11 yaşa uygulanması ve doyma sinyaline güvenme ilkesi yorumdur.', reviewer: 'Spor diyetisyeni ve çocuk sağlığı uzmanı' },
  { id: 'tabak-oranlari', area: 'Temel ilkeler', what: 'Dinlenme, antrenman ve maç günü tabak çizimlerindeki göreli oranlar.', why: 'Beş besin grubu TÜBER’e dayanır; yüke göre oranları değiştiren görsel Libero’nun örnek çizimidir ve kaynakta birebir yoktur.', reviewer: 'Spor diyetisyeni', unverified: true },
  { id: 'zamanlama', area: 'Öncesi, Sonrası, Maç günü', what: 'Öğün zamanlaması örnekleri (maçtan 3–4 saat önce ana öğün, 30–60 dakika önce hafif atıştırmalık, devre arası, maç sonrası ilk 20 dakika).', why: 'TÜBER, ana öğünün antrenman ve müsabakadan 3–4 saat önce yenmesini ve öncesinde düşük yağ ve lif, yüksek karbonhidrat, orta protein ile alışık olunan yiyecekleri önerir; sayfadaki 1 saat önce atıştırmalık, devre arası ve maç sonrası ilk 20 dakika gibi diğer saatler genel pratik örnekleridir ve kaynakta birebir yoktur. Çocuk ve ergenlerde mide hassasiyeti kişiye göre değişir.', reviewer: 'Spor diyetisyeni', unverified: true },
  { id: 'sivi-sayilari', area: 'Sıvı, Maç günü', what: 'TÜBER’in sporcular için verdiği sıvı değerlerinin 18 yaş ve üstüne gösterilen aktarımı (egzersizden yaklaşık 4 saat önce yaklaşık 500 mL; sırasında 15–20 dakikada bir 150–350 mL; kaybedilen her yarım kg için 450–675 mL) ve “yudum yudum içme” önerileri.', why: 'Değerler TÜBER’in sporcu bölümünden alınmıştır ve metinde yaş ayrımı yapılmamıştır; çocuk ve ergenler için ayrıca doğrulanmadığından onlara sayısal hedef verilmemiştir. Bağlamının doğru aktarıldığı doğrulanmalıdır.', reviewer: 'Spor diyetisyeni ve spor hekimi' },
  { id: 'idrar-karti', area: 'Sıvı', what: 'İdrar rengi kartındaki renk basamakları ve yorumları; koyu ya da kırmızı-kahverengi idrarda hekime yönlendirme.', why: 'TÜBER yalnızca “çok açık sarı” hedefini verir; basamaklandırma ve yorumlar genel pratiğe dayanır. Bazı besin ve ilaçlar renk değiştirebilir.', reviewer: 'Spor hekimi', unverified: true },
  { id: 'su-takibi', area: 'Sıvı', what: 'Su takipçisindeki bardak sayacı hedefi (başlangıç değeri 8) ve hatırlatıcı aralıkları (30–120 dakika).', why: 'Hedef kişisel gereksinim değildir, yalnızca sayaç için başlangıç değeridir; yaşa, sıcağa ve antrenman yüküne göre değişir. Aşırı içmenin de riski olduğu (NATA) için sayaç hedefe ulaşmak amacıyla zorla içmeyi teşvik etmemelidir; hatırlatıcı aralıkları genel örnektir.', reviewer: 'Spor diyetisyeni', unverified: true },
  { id: 'uyku-genel', area: 'Uyku', what: 'Uyku alışkanlıkları önerileri: sabit yatış saati, geç saatte kafeinden kaçınma, gündüz kısa uykusunun (şekerleme) gece uykusunun yerini tutmaması.', why: 'Uyku süreleri ve ekranın uykuyla ilişkisi kaynaklıdır; alışkanlık önerileri ve şekerleme yorumu genel pratiktir, kaynakla birebir doğrulanamadı.', reviewer: 'Çocuk sağlığı uzmanı', unverified: true },
  { id: 'toparlanma-genel', area: 'Dinlenme ve toparlanma', what: 'Dinlenme günü ve aktif toparlanma önerileri (hafif yürüyüş, esneme, oyun), yoğun fikstürde dinlenme planı.', why: 'Genel antrenman pratiğidir; yaş grubuna göre ayrıntı kaynaklarla doğrulanamadı.', reviewer: 'Spor hekimi ve antrenman bilimcisi', unverified: true },
  { id: 'toparlanma-yorum', area: 'Sonrası', what: 'Antrenman sonrası ilk saatler için “katı bir pencere aramaya gerek yok, günlük toplam ve düzen daha önemli” yorumu.', why: 'Kaynaklar antrenman hemen sonrasını öne çıkarır; “katı pencere gerekmez” kısmı yazarın yorumudur.', reviewer: 'Spor diyetisyeni', unverified: true },
  { id: 'belirtiler', area: 'Dinlenme, Uyarı işaretleri', what: 'Aşırı antrenman, yetersiz enerji (RED-S) ve yeme bozukluğu uyarı işaretleri listeleri.', why: 'Okunan kaynak özetleri yalnızca kavramı ve etkilenen alanları anlatır (metabolizma, adet düzeni, kemik, bağışıklık, kalp-damar; yorgunluk, performans düşüşü, ruh hali değişimi). Listelerdeki diğer işaretler (ör. baş dönmesi, sürekli üşüme, yeme bozukluğu davranışları) bu sayfada sade dille derlenmiştir, kaynaklarda tek tek doğrulanmadı ve tanı koymaz. Eksik ya da yanlış vurgu riski vardır.', reviewer: 'Spor hekimi ve çocuk/ergen psikiyatrisi', unverified: true },
  { id: 'isi-uyari', area: 'Antrenman sırasında', what: 'Sıcakta kendini kötü hissedince (baş dönmesi, bulantı, aşırı halsizlik, kafa karışıklığı) oyunu bırakıp gölgeye geçme ve bir yetişkine söyleme uyarısı.', why: 'AAP ısı sorunlarının çoğunlukla önlenebilir olduğunu söyler; belirtiler ve ilk adım için ise bu sayfada genel bir güvenlik mesajı verilir, kaynaktan alıntı değildir. Ciddi belirtilerde acil yardım gerekir.', reviewer: 'Spor hekimi ve çocuk sağlığı uzmanı', unverified: true },
  { id: 'turnuva', area: 'Turnuva, Maç günü', what: 'Aynı gün birden çok maçta maçlar arası yeme-içme önerileri ve çanta listesi.', why: 'Sıvı ve yetersiz toparlanma riski AAP’ye dayanır; yiyecek önerileri ve aralıkların süresine göre ayrım genel pratiktir.', reviewer: 'Spor diyetisyeni', unverified: true },
  { id: 'takviye', area: 'Takviyeler', what: 'Ürün bazında takviye tablosu (protein tozu, kreatin, kafein, enerji içeceği, yağ yakıcı, vitamin/mineral) ve yaş gruplarına göre yaklaşım.', why: 'Çocuk ve ergen sütunu kanıta dayalı bir çocuk önerisi değil, temkinli bir çizgidir: AAP yalnızca enerji içeceklerindeki kafein ve uyarıcıların yerinin olmadığını söyler, SDA ihtiyaçların takviye yerine temel besinlerle karşılanmasını önerir; IOC metni yetişkin yüksek performanslı sporcular içindir, çocuklar için ayrı öneri vermez. Kreatin ve protein tozu için çocuklara özgü bir kaynak okunmadı. Ürün bazında ayrıntı doğrulanmalıdır.', reviewer: 'Çocuk sağlığı uzmanı ve spor diyetisyeni', unverified: true },
  { id: 'ramazan', area: 'Ramazan ve sporcu', what: 'Bölümün tamamı: yetişkin sporcular için kaynak özeti, çocuk ve ergenler için “hekime danışın” çerçevesi, sahur-iftar ve uyku önerileri, uyarı işaretleri.', why: 'Tek kaynak üst düzey yetişkin sporculara aittir; çocuk ve ergenler için kanıt verilmemiştir. Dinî konularda görüş bildirilmez.', reviewer: 'Spor hekimi ve çocuk sağlığı uzmanı' },
  { id: 'alerjen', area: 'Alerji, Örnek menüler', what: 'Besin–alerjen etiketleri, vejetaryen/vegan işaretleri ve alternatif önerileri.', why: 'Etiketler sade tarif içeriklerine göredir; hazır ürünlerde ve ev tariflerinde içerik değişebilir. Ciddi alerjide hekim planı geçerlidir.', reviewer: 'Alerji uzmanı ve diyetisyen' },
  { id: 'menuler', area: 'Örnek menüler, Haftalık plan', what: 'Yaş grubu ve gün tipine göre örnek öğünler ve günlük planlar (12 plan), haftalık plan örnek düzeni.', why: 'Menüler genel örneklerdir; kalori ve gram içermez. Yaşa uygunluk, çeşitlilik ve kültürel uygunluk uzmanca gözden geçirilmelidir.', reviewer: 'Spor diyetisyeni' },
];
export const REVIEW_BY_ID: Record<string, ReviewItem> = Object.fromEntries(REVIEW_ITEMS.map((r) => [r.id, r]));

// ── Yaşa göre kısa notlar ────────────────────────────────

export interface AgeNote {
  text: string;
  review?: string;
}
export type AgeNotes = Record<AgeBand, AgeNote>;

export const AGE_NOTES: Record<string, AgeNotes> = {
  temel: {
    u11: { text: 'Tabağını renkli yap, öğün atlama, sofrada acele etme. Ne kadar yiyeceğine karnının doyduğunu hissederek sen karar verirsin; yemek yemeye zorlanmaz, kilo ya da vücut hakkında yorum yapılmaz.', review: 'porsiyon' },
    u14: { text: 'Büyüme atılımı bu yaşlarda hızlanır (TÜBER: en hızlı büyüme kızlarda yaklaşık 10–12, erkeklerde yaklaşık 11–14 yaşlarında başlar). Okul, ara öğün ve antrenman bir arada olduğundan öğün atlamamak özellikle önemlidir; süt grubu, demirli besinler ve D vitamini için güneş ışınlarının dik gelmediği saatlerde açık havada vakit geçirmek önerilir (TÜBER).', review: 'porsiyon' },
    u17: { text: 'Antrenman yükü artar ve okul baskısı bir araya gelir. Enerjiyi yetersiz bırakmamak, vücut görünümüne takılmamak ve uykuyu korumak bu yaşın üç ana noktasıdır. Kilo ya da vücut görünümüyle ilgili her kaygı için hekim ve diyetisyen.', review: 'porsiyon' },
    a18: { text: 'Yetişkin sporcu için tabak modeli yük durumuna göre ayarlanır; kişiye özel plan, takviye kararı ve vücut bileşimi hedefleri için kayıtlı bir spor diyetisyeni gerekir (ACSM/AND/DC).', review: 'porsiyon' },
  },
  oncesi: {
    u11: { text: 'Aç karnına antrenmana çıkma, ama doluyken de koşma: tanıdık bir öğünden en az birkaç saat sonra ya da küçük bir atıştırmalıkla başla. Yeni yiyecek deneme günü maç günü değildir.', review: 'zamanlama' },
    u14: { text: 'Okuldan antrenmana doğrudan geçiyorsan çantana hafif bir atıştırmalık koy: muz, ekmek-peynir, yoğurt. Ağır öğünü antrenmandan en az birkaç saat önce bitir.', review: 'zamanlama' },
    u17: { text: 'Yoğun akademik gün ve akşam antrenmanı varsa öğle yemeğini karbonhidratlı ve doyurucu yap; antrenmana yakın vakitte hafif atıştırmalık yeterlidir.', review: 'zamanlama' },
    a18: { text: 'Mide hassasiyetin ve antrenman saatin kendi düzenini belirler; deneme ve gözlem antrenmanlarda yapılır, maç günü yeni bir şey denenmez.', review: 'zamanlama' },
  },
  sirasinda: {
    u11: { text: 'Su yeterlidir. Enerji içeceğindeki kafein ve uyarıcıların çocuk beslenmesinde yeri yoktur; sık ya da fazla şekerli spor içeceği fazla kilo riskini artırabilir (AAP). Mola verildikçe birkaç yudum içmeyi alışkanlık yap.' },
    u14: { text: 'Su yeterlidir. Sıcakta ek mola ve gölge iste; ısı sorunları değiştirilebilir etkenlerle (sıvı, mola, kıyafet) büyük ölçüde önlenebilir (AAP). Enerji içeceği ve kafein yoktur.' },
    u17: { text: 'Su yeterlidir. Uzun, yoğun ya da sıcak etkinliklerde ne yapılacağını antrenör, hekim ya da diyetisyenle önceden konuş; deneyim kazanmak için antrenmanda denenir. Enerji içeceği ve kafein yoktur.' },
    a18: { text: '1 saati aşan etkinliklerde karbonhidrat ve elektrolit içeren içecek faydalı olabilir (TÜBER); önce antrenmanda dene. Enerji içeceğinden ve fazla kafeinden kaçın.', review: 'sivi-sayilari' },
  },
  sonrasi: {
    u11: { text: 'Antrenmandan sonra su iç, sonra eve gidince normal öğününü ye. Özel ürün gerekmez; yoğurt-meyve ya da ayran-simit gibi sofra yiyecekleri yeter.' },
    u14: { text: 'Antrenman sonrası ilk saatte küçük bir karbonhidrat + protein atıştırmalığı (süt-muz, ayran-simit) ve sıvı; ardından akşam yemeği. Tozlar ve içecekler gerekmez.' },
    u17: { text: 'Ardışık antrenman ya da maç yoksa özel bir acele yok; düzenli öğünler ve uyku yeterlidir. Ardışık yük varsa toparlanma atıştırmalığı fark yaratır.' },
    a18: { text: 'Toparlanma atıştırmalığı yük ve süreye göre ayarlanır; protein tozu ve takviye kararları bir diyetisyenle verilir (IOC).' },
  },
  sivi: {
    u11: { text: 'Gün boyu su, her öğünde bir bardak. Susamayı beklemeden iç ama aşırı da içme. Sayısal hedef yok; idrar rengin açık sarıysa genelde yolundasın.', review: 'sivi-sayilari' },
    u14: { text: 'Okulda su şişeni yanında tut; antrenmandan önce ve sonra bir bardak su. Sayısal hedef yok; idrar rengini ve susama hissini birlikte izle.', review: 'sivi-sayilari' },
    u17: { text: 'Ter miktarı kişiden kişiye çok farklıdır (ACSM). Sıcak ve uzun antrenmanlarda daha çok terler, daha çok sıvıya ihtiyaç duyarsın. Kendi kendine tartılıp hesap yapmak yerine idrar rengini ve antrenör, hekim ya da diyetisyen önerisini izle.', review: 'sivi-sayilari' },
    a18: { text: 'Aşağıdaki TÜBER örnek değerleri yetişkin sporcular içindir; kişiye göre değişir.', review: 'sivi-sayilari' },
  },
  uyku: {
    u11: { text: '6–12 yaş için 24 saatte 9–12 saat önerilir (AASM). Düzenli yatış ve kalkış saati, ekranları yatmadan önce kapatmak yardımcı olur.', review: 'uyku-genel' },
    u14: { text: '12 yaşta 9–12, 13–14 yaşta 8–10 saat aralığı geçerlidir (AASM). Gece antrenmanı ya da maçı sonrası uykuya geçişi sakin geçir.', review: 'uyku-genel' },
    u17: { text: '13–18 yaş için 24 saatte 8–10 saat önerilir (AASM). Sınav ve antrenman döneminde ilk feda edilen şey uyku olmasın.' },
    a18: { text: 'Elit sporcularda 7 saatten kısa uyku sık görülür; genel nüfus çalışmaları 7 saatten kısa uykuyu solunum yolu enfeksiyonuna yatkınlıkla ilişkilendirir. Herkese tek bir saat önermek yerine bireysel yaklaşım önerilir (Walsh ve ark.).' },
  },
  takviye: {
    u11: { text: 'Takviye, protein tozu, kafein ve enerji içeceği kullanılmaz. Sofra yeterlidir.', review: 'takviye' },
    u14: { text: 'Takviye, protein tozu, kreatin, kafein, enerji içeceği ve yağ yakıcı kullanılmaz; arkadaş, mağaza ya da sosyal medya tavsiyesi de bir gerekçe değildir.', review: 'takviye' },
    u17: { text: 'Takviye, protein tozu, kreatin, kafein, enerji içeceği ve yağ yakıcı kullanılmaz. Eksiklikten şüphelenirsen hekime git; kendi başına vitamin ya da mineral başlama.', review: 'takviye' },
    a18: { text: 'Kullanım kararı bir hekim ya da diyetisyen değerlendirmesinden sonra verilir; ürünler içeriği bildirilmemiş yasaklı madde taşıyabilir (IOC).' },
  },
};

// ── Uyku tablosu (AASM) ──────────────────────────────────

export const SLEEP_ROWS: { age: string; hours: string; src: string; bands: AgeBand[]; note: string }[] = [
  { age: '6–12 yaş', hours: '24 saatte 9–12 saat', src: 'aasm-sleep-2016', bands: ['u11', 'u14'], note: 'Düzenli olarak önerilenden az uyumak dikkat, davranış ve öğrenme sorunlarıyla ilişkilidir.' },
  { age: '13–18 yaş', hours: '24 saatte 8–10 saat', src: 'aasm-sleep-2016', bands: ['u14', 'u17'], note: 'Aynı uyarı bu yaş için de geçerlidir.' },
  { age: '18 yaş ve üstü sporcu', hours: 'Bireye göre', src: 'sleep-athlete-2021', bands: ['a18'], note: 'Elit sporcularda alışkanlık hâlinde 7 saatten kısa uyku sık görülür; genel nüfus çalışmalarında 7 saatten kısa uyku solunum yolu enfeksiyonuna yatkınlıkla ilişkilidir. Tek bir saat yerine bireysel yaklaşım önerilir.' },
];

// ── İdrar rengi ──────────────────────────────────────────

export const URINE_STEPS: { n: number; name: string; tone: 'ok' | 'ok2' | 'mid' | 'warn' | 'high' | 'stop'; advice: string }[] = [
  { n: 1, name: 'Çok açık, neredeyse berrak', tone: 'ok', advice: 'Sıvı dengen büyük olasılıkla iyi. Çok açıksa ve sürekli içiyorsan fazla su içiyor olabilirsin; aşırı içmenin de riskleri vardır (NATA). Susadıkça ve yemekle birlikte iç.' },
  { n: 2, name: 'Çok açık sarı', tone: 'ok2', advice: 'Hedef aralık budur (TÜBER: çok açık sarı). Şimdiki alışkanlığını koru.' },
  { n: 3, name: 'Sarı', tone: 'mid', advice: 'Bir sonraki öğünle birlikte ve gün içine yayarak biraz daha sıvı al. Antrenmana kısa süre varsa yudum yudum iç.' },
  { n: 4, name: 'Koyu sarı', tone: 'warn', advice: 'Sıvı alımını artır, özellikle antrenman ve maç öncesinde. Kana kana değil, düzenli yudumlarla.' },
  { n: 5, name: 'Amber / koyu turuncu', tone: 'high', advice: 'Belirgin sıvı eksikliği olabilir. Sıvıyı yudum yudum artır, dinlen. Düzelmiyorsa ya da kendini kötü hissediyorsan bir yetişkine ve hekime söyle.' },
  { n: 6, name: 'Kahverengi, kırmızımsı ya da pembe', tone: 'stop', advice: 'Bu renkler sıvı eksikliğiyle tek başına açıklanamaz. Pancar gibi bazı besinler de renk verebilir, ama bunu kendi başına kestirmeye çalışma: antrenmanı bırak, bir yetişkine söyle ve hekime başvur.' },
];

// ── Takviye tablosu ──────────────────────────────────────

export const SUPPLEMENT_ROWS: { name: string; minor: string; adult: string; src: string[] }[] = [
  { name: 'Protein tozu ve amino asit ürünleri', minor: 'Önerilmez. Protein gereksinimi çoğu zaman günlük yemeklerle karşılanır.', adult: 'Önce beslenme değerlendirmesi; protein gereksinimi çoğu zaman yemekle de karşılanır (TÜBER).', src: ['tuber', 'ioc-supplements'] },
  { name: 'Kreatin', minor: 'Kullanılmaz.', adult: 'Kanıtı olan birkaç üründen biridir; kullanım kararı hekim ya da diyetisyenle verilir.', src: ['ioc-supplements'] },
  { name: 'Kafein (kapsül, toz, jel) ve kafeinli içecekler', minor: 'Kapsül, toz, jel ve enerji içeceği olarak kullanılmaz. Enerji içeceklerindeki kafein ve uyarıcıların çocuk ve ergen beslenmesinde yeri yoktur (AAP).', adult: 'Etkisi kanıtlıdır ama yan etki ve doz riskleri vardır; karar uzmanla verilir.', src: ['aap-drinks-2011', 'ioc-supplements'] },
  { name: 'Enerji içecekleri', minor: 'Kullanılmaz. İçerdiği kafein ve uyarıcılar çocuk ve ergenler için uygun değildir.', adult: 'Tüketimin sınırlandırılması önerilir; sporcuların kafeinli içecekleri fazla tüketmekten kaçınması gerekir (TÜBER).', src: ['aap-drinks-2011', 'tuber'] },
  { name: 'Spor (elektrolit–karbonhidrat) içecekleri', minor: 'Günlük içecek değildir; sık ya da fazla tüketim fazla kilo riskini artırabilir (AAP). Düzenli dayanıklılık ya da yüksek şiddetli sporda ne zaman uygun olduğu AAP raporunun kapsamı dışındadır; ihtiyaç sorusunu antrenör, hekim ya da diyetisyene sor.', adult: '1 saatten uzun etkinliklerde gerekebilir (TÜBER).', src: ['aap-drinks-2011', 'tuber'] },
  { name: 'Yağ yakıcı ve kilo verdirici ürünler', minor: 'Kesinlikle kullanılmaz.', adult: 'Hekim ve diyetisyen olmadan kullanılmaz. Çoğunun etkili olduğuna dair kanıt yoktur (IOC).', src: ['ioc-supplements', 'sda-adolescent'] },
  { name: 'Vitamin ve mineral (demir, D vitamini, kalsiyum…)', minor: 'Eksiklikten şüphelenirsen hekime git; kan tahlili ve doz hekimde. Kendi başına başlama.', adult: 'Kan değerlerine bakılır; doz ve süre hekim ve diyetisyenle belirlenir.', src: ['sda-adolescent', 'tuber', 'ioc-supplements'] },
];

// ── Kırmızı bayraklar ────────────────────────────────────

export const RED_FLAGS_EATING: string[] = [
  'Yemekten sürekli kaçınma, çok az yeme ya da düzenli öğün atlama',
  'Belirli besin gruplarını “yasak” ilan etme, yemek konusunda yoğun kaygı',
  'Kilo ya da vücut şekliyle ilgili sürekli takıntı; aynaya bakmaktan aşırı rahatsızlık',
  'Yemekten sonra kusma ya da zayıflama, müshil veya idrar söktürücü ürün kullanma',
  'Antrenman dışında gizli ya da zorunlu hissettiren aşırı egzersiz',
];
export const RED_FLAGS_ENERGY: string[] = [
  'Kızlarda adet düzeninin bozulması ya da gecikmesi',
  'Tekrarlayan kemik ağrısı ya da stres kırığı',
  'Sık hastalanma, uzun süren yorgunluk ve düşen performans',
  'Baş dönmesi, sık bayılma hissi, sürekli üşüme',
  'İçe kapanma, isteksizlik ya da belirgin ruh hali değişimleri',
];

// ── Ramazan ──────────────────────────────────────────────

export const RAMADAN_POINTS: { t: string; d: string; review?: string }[] = [
  { t: 'Kaynak ne söylüyor?', d: 'Üst düzey yetişkin sporcuların antrenman, yeme-içme ve uyku iyi yönetildiğinde Ramazan’da performansı koruyabildiği bildirilir. Antrenman zamanı ve şiddetinin ayarlanması gerekebilir; akşam saatlerindeki antrenman, sonrasında beslenmeye olanak verir; uyku eksikliğine dikkat edilmelidir (Maughan ve ark.).' },
  { t: 'Çocuk ve ergenler için', d: 'Bu kaynak çocuk ve ergenler için bir öneri sunmaz ve bu sayfa da onlara oruç önermez ya da yasaklamaz. Oruç tutmak isteyen genç sporcu, ailesi ve antrenörüyle birlikte önce hekime danışmalıdır. Dinî konularda görüş bildirilmez.' },
  { t: 'Beslenme ve sıvı', d: 'İftar ve sahurda tabak modelini koru: sebze-meyve, tahıl, protein ve süt grubu. Sıvıyı iftardan sahura kadar yayarak iç; gece uykusunu çok kısaltacak şekilde sahura kalkma.', review: 'ramazan' },
  { t: 'Antrenman', d: 'Yoğunluğu ve süreyi hekim, antrenör ve ailenle konuşarak ayarla. Kaynak, gün batımına yakın ya da sonrasındaki antrenmanın avantajları olabileceğini ve antrenman sonrası beslenmeye olanak verdiğini belirtir; bu kişiye ve spora göre değişir.', review: 'ramazan' },
  { t: 'Hemen dur ve söyle', d: 'Baş dönmesi, bayılma hissi, belirgin zayıflık, çok koyu idrar, çarpıntı ya da kendini kötü hissetme durumunda antrenmanı bırak, bir yetişkine söyle ve gerekirse hekime başvur.', review: 'ramazan' },
];

// ── Örnek günlük planlar ────────────────────────────────

export interface DayPlan {
  slots: Partial<Record<SlotKey, string>>;
  tips: string[];
}
export const DAY_PLANS: Record<AgeBand, Record<DayType, DayPlan>> = {
  u11: {
    antrenman: {
      slots: { kahvalti: 'yulaf-yogurt', ara: 'meyve-peynir', ogle: 'tavuk-pilav', once1: 'yogurt-meyve', sonra: 'ayran-simit', aksam: 'kuru-fasulye-pilav' },
      tips: ['Her öğünde tabakta sebze, meyve, tahıl, protein ve süt grubundan birer yiyecek olsun.', 'Antrenmana gitmeden önce hafif bir şeyler ye, su şişeni yanına al.', 'Yemek yemeye zorlama yok: doyduğunda durabilirsin.'],
    },
    mac: {
      slots: { kahvalti: 'yulaf-muz', ara: 'meyve-peynir', once3: 'makarna-tavuk', once1: 'yogurt-meyve', sonra: 'ayran-simit', aksam: 'tavuk-patates' },
      tips: ['Maç günü tanıdık yiyecekler: yeni bir şey denemek için bugün uygun değil.', 'Maç öncesi karbonhidratlı, yağsız ve hafif; sonrası için ayran-simit gibi bir atıştırmalık çantada olsun.', 'Maç sonrası önce su, sonra yemek.'],
    },
    dinlenme: {
      slots: { kahvalti: 'serpme-kahvalti', ara: 'meyve-peynir', ogle: 'mercimek-pilav', aksam: 'izgara-et-bulgur' },
      tips: ['Dinlenme günü açlık günü değildir: öğünler aynı düzende devam eder.', 'Dışarıda oyun ve yürüyüş serbest; spor içeceği ve takviye yok.'],
    },
  },
  u14: {
    antrenman: {
      slots: { kahvalti: 'omlet', ara: 'ayran-simit', ogle: 'tavuk-lavas', once1: 'muz-fistik', sonra: 'yogurt-meyve', aksam: 'kuru-fasulye-pilav' },
      tips: ['Okul, ara öğün ve antrenman arasında boşluk bırakma; çantana atıştırmalık koy.', 'Süt, yoğurt ya da peynir gibi süt grubundan gün içinde birkaç kez.', 'Sıvı için su; enerji içeceği ve kafein yok.'],
    },
    mac: {
      slots: { kahvalti: 'yulaf-muz', once3: 'tavuk-pilav', once1: 'muz-fistik', sonra: 'sut-muz', aksam: 'makarna-tavuk' },
      tips: ['Ana öğünü maçtan yaklaşık 3 saat önce tamamla; sonra yalnızca hafif atıştırmalık.', 'Maç sonrası ilk saatte karbonhidrat + protein + sıvı.', 'Akşam sakin bir yemek ve erken uyku.'],
    },
    dinlenme: {
      slots: { kahvalti: 'menemen', ara: 'peynirli-tost', ogle: 'nohut-salata', aksam: 'balik-bulgur' },
      tips: ['Dinlenme günü aç kalma günü değildir; tabak modeli aynı.', 'Hafif yürüyüş ya da oyun iyi gelir.'],
    },
  },
  u17: {
    antrenman: {
      slots: { kahvalti: 'omlet', ara: 'sut-kayisi', ogle: 'izgara-et-bulgur', once1: 'hurma-ceviz', sonra: 'lor-meyve', aksam: 'mercimek-pilav' },
      tips: ['Yoğun günlerde tabakta karbonhidrat payı artabilir; yeterince yemek enerjiyi korur.', 'Kilo ya da vücut hedefi için kendi başına yemek kısıtlaması yapma; kaygı varsa hekim ve diyetisyene git.', 'Takviye, protein tozu ve kafein yok.'],
    },
    mac: {
      slots: { kahvalti: 'yulaf-muz', once3: 'makarna-tavuk', once1: 'muz-fistik', sonra: 'tavuk-lavas', aksam: 'tavuk-patates' },
      tips: ['Maç saatine göre ana öğünü yaklaşık 3 saat önce planla (Maç günü bölümündeki çizelgeyi kullan).', 'Maç sonrası toparlanma atıştırmalığı + akşam ana öğünü + uyku.'],
    },
    dinlenme: {
      slots: { kahvalti: 'serpme-kahvalti', ara: 'lor-meyve', ogle: 'humus-lavas', aksam: 'balik-patates' },
      tips: ['Dinlenme günü de öğün atlama günü değildir.', 'Uykuyu telafi etmek için iyi bir gün.'],
    },
  },
  a18: {
    antrenman: {
      slots: { kahvalti: 'yulaf-yogurt', ogle: 'tavuk-pilav', once1: 'yogurt-meyve', sonra: 'omlet', aksam: 'izgara-et-bulgur' },
      tips: ['Yük arttıkça tabakta karbonhidrat payı artar; yük azalınca azalır.', 'Kişiye özel plan ve takviye kararı için kayıtlı bir spor diyetisyenine başvur.'],
    },
    mac: {
      slots: { kahvalti: 'yulaf-muz', once3: 'domates-makarna', once1: 'hurma-ceviz', sonra: 'ayran-simit', aksam: 'balik-bulgur' },
      tips: ['Maç saatine göre çizelgeyi Maç günü bölümünden oluştur.', 'Uzun, yoğun ya da sıcak maçlarda sıvı stratejisini antrenmanda dene.'],
    },
    dinlenme: {
      slots: { kahvalti: 'menemen', ara: 'peynirli-tost', ogle: 'nohut-salata', aksam: 'mercimekli-kofte' },
      tips: ['Dinlenme gününde de düzenli öğünler; tabak modeli sebze ağırlıklı olabilir.'],
    },
  },
};

// ── Porsiyon kılavuzu (sayısal hedef yok; yaş bantlarına göre) ──

export const PORTION_GUIDE: Record<AgeBand, string[]> = {
  u11: [
    'Her öğünde tabakta farklı gruplardan yiyecekler olsun: sebze, meyve, tahıl, protein ve süt grubu (TÜBER).',
    'Tabağa yiyebileceğin kadar yemek konur; “tabağı bitir” baskısı olmaz. Doyduğunu hissedince durabilirsin.',
    'Süt, yoğurt, ayran ya da peynirden gün içinde birkaç kez.',
    'Ara öğünler küçük olsun: meyve, peynir, yoğurt ya da ekmek-peynir.',
  ],
  u14: [
    'Büyüme atılımı döneminde öğün atlama; okul ve antrenman arasında ara öğün önemlidir.',
    'Süt ve süt ürünleri gün içine yayılmış yaklaşık 4 porsiyon: 1 su bardağı süt, 1 su bardağı yoğurt ya da 2 kibrit kutusu peynir birer porsiyondur (TÜBER, genç sporcular).',
    'Demir için kırmızı et, yumurta ve baklagiller; C vitaminli sebze-meyveyle birlikte (TÜBER).',
    'Yük arttıkça tabakta karbonhidrat dilimi büyür; sebze ve protein dilimi yerinde kalır.',
  ],
  u17: [
    'Yoğun günlerde tabakta karbonhidrat dilimi büyür. Yetersiz yemek, yük arttıkça enerji açığı riskini büyütür; uyarı işaretlerini bil.',
    'Süt ve süt ürünleri gün içinde yaklaşık 4 porsiyon (TÜBER, genç sporcular).',
    'Kilo ya da vücut görünümü için kendi başına yemek kısıtlaması yapma; kaygı varsa hekim ve diyetisyene git.',
    'Öğün atlamak yerine hazır bir ara öğünü çantada taşı.',
  ],
  a18: [
    'Yük durumuna göre tabak: yoğun günde karbonhidrat dilimi büyür, dinlenme gününde küçülür.',
    'Kişiye özel enerji ve besin planı, vücut bileşimi hedefleri ve takviye kararları için kayıtlı bir spor diyetisyeni gerekir (ACSM/AND/DC).',
    'Kan değerlerin (demir, D vitamini) ve sağlığın için periyodik kontrol hekim işidir.',
  ],
};

// ── Tabak modeli ─────────────────────────────────────────

export type PlateGroup = 'sebze' | 'meyve' | 'tahil' | 'protein' | 'sut';
export const PLATE_GROUP_LABEL: Record<PlateGroup, string> = {
  sebze: 'Sebze',
  meyve: 'Meyve',
  tahil: 'Ekmek, tahıl, patates',
  protein: 'Et, tavuk, balık, yumurta, baklagil',
  sut: 'Süt, yoğurt, peynir',
};
export const PLATE_GROUP_EXAMPLES: Record<PlateGroup, string> = {
  sebze: 'domates, salatalık, yeşillik, brokoli, havuç',
  meyve: 'elma, muz, mandalina, üzüm',
  tahil: 'pilav, bulgur, makarna, ekmek, yulaf, patates',
  protein: 'tavuk, balık, yumurta, mercimek, nohut, kuru fasulye',
  sut: 'yoğurt, ayran, süt, peynir',
};
/** Göreli payların birebir sayısal anlamı yoktur; yalnızca dilimlerin görsel genişliğini belirler. */
export const PLATES: { id: DayType; title: string; caption: string; weights: Record<PlateGroup, number> }[] = [
  { id: 'dinlenme', title: 'Dinlenme günü', caption: 'Sebze ve protein öne çıkar; karbonhidrat payı daha azdır.', weights: { sebze: 26, meyve: 14, tahil: 20, protein: 24, sut: 16 } },
  { id: 'antrenman', title: 'Antrenman günü', caption: 'Karbonhidrat payı artar; sebze, protein ve süt grubu yerinde kalır.', weights: { sebze: 20, meyve: 12, tahil: 30, protein: 22, sut: 16 } },
  { id: 'mac', title: 'Maç günü', caption: 'En çok karbonhidrat; yağ ve lif maç öncesi azdır, maçtan sonra tabak yeniden dolar.', weights: { sebze: 14, meyve: 12, tahil: 40, protein: 20, sut: 14 } },
];

// ── Turnuva çantası ──────────────────────────────────────

export const TOURNAMENT_BAG: string[] = ['Su şişesi (dolu ve yedek)', 'Muz', 'Ekmek-peynir ya da ekmek-bal', 'Kuru kayısı ya da hurma', 'Ayran ya da süt (soğuk çantada)', 'Peynirli tost ya da tavuklu dürüm (iyi saklanmış)', 'Yedek forma ve havlu', 'Şapka / gölge için örtü'];

export const TOURNAMENT_POINTS: { t: string; d: string; review?: string }[] = [
  { t: 'Önce sıvı', d: 'Her maçın bitişinde ilk iş sıvı. Aynı günde ardışık antrenman ya da maç turları arasında yetersiz toparlanma, ısı sorunlarının değiştirilebilir risk etkenleri arasındadır (AAP).' },
  { t: 'Aralar kısaysa kolay sindirilen karbonhidrat', d: 'Aralar kısaysa muz, ekmek-bal gibi hafif karbonhidratlar; yağlı, kızarmış ve çok lifli yiyecekler mideyi yorar. Aralar uzunsa küçük bir öğün yenebilir.', review: 'turnuva' },
  { t: 'Tanıdık yiyecek', d: 'Turnuva günü yeni yiyecek denemek için uygun bir gün değildir. Evde sevdiğin ve iyi geldiğini bildiğin yiyeceklerle git.', review: 'turnuva' },
  { t: 'Gölge ve mola', d: 'Sıcakta maçlar arasında güneşten uzak dur, kıyafeti ısı tutmayacak şekilde seç.' },
  { t: 'Gün sonu', d: 'Turnuva günü sonunda tabak modeline uygun ana öğün ve erken uyku. Ertesi gün dinlenmeye öncelik ver.', review: 'turnuva' },
];

// ── Kısa kaynak adları (bölüm altı atıflar için) ──────────

export const SOURCE_SHORT: Record<string, string> = {
  tuber: 'TÜBER 2015',
  'who-diet': 'WHO Sağlıklı beslenme',
  'sda-adolescent': 'SDA ergen sporcu 2014',
  'uefa-nutrition': 'UEFA beslenme 2021',
  'acsm-nutrition': 'ACSM/AND/DC 2016',
  'reds-2014': 'IOC RED-S 2014',
  'reds-2023': 'IOC REDs 2023',
  'acsm-fluid-2007': 'ACSM sıvı 2007',
  'nata-fluid-2017': 'NATA sıvı 2017',
  'aap-drinks-2011': 'AAP içecekler 2011',
  'aap-heat-2011': 'AAP sıcak 2011',
  'aasm-sleep-2016': 'AASM uyku 2016',
  'sleep-athlete-2021': 'Sporcuda uyku 2021',
  'aap-media-2016': 'AAP medya 2016',
  'overtraining-2013': 'Aşırı antrenman 2013',
  'ioc-supplements': 'IOC takviye 2018',
  'ramadan-2012': 'Ramazan ve spor 2012',
};

/** Her kaynağın bu rehberde hangi düzeyde okunduğu (doğrulama şeffaflığı) */
export const SOURCE_CHECK: Record<string, string> = {
  tuber: 'İlgili bölümler (sporcu beslenmesi, ergen beslenmesi, tabak modeli) tam metinden okundu.',
  'who-diet': 'Bilgi sayfası okundu.',
  'sda-adolescent': 'Özet metni Europe PMC üzerinden okundu; tam metne erişilemedi.',
  'uefa-nutrition': 'Özet metni Europe PMC üzerinden okundu; tam metne erişilemedi. Yalnızca “önce gıda” ilkesi ve konu başlıkları aktarıldı.',
  'acsm-nutrition': 'Özet metni Europe PMC üzerinden okundu.',
  'reds-2014': 'Özet metni Europe PMC üzerinden okundu.',
  'reds-2023': 'Özet metni Europe PMC üzerinden okundu.',
  'acsm-fluid-2007': 'Özet metni Europe PMC üzerinden okundu.',
  'nata-fluid-2017': 'Özet metni Europe PMC üzerinden okundu.',
  'aap-drinks-2011': 'Özet metni Europe PMC üzerinden okundu. Düzenli dayanıklılık ya da yüksek şiddetli spor yapan gençlerde spor içeceğinin uygun kullanımı raporun kapsamı dışında bırakılmıştır.',
  'aap-heat-2011': 'Özet metni Europe PMC üzerinden okundu. Belirtiler ve ilk müdahale ayrıntıları özette yoktur; sayfadaki “kendini kötü hissedersen dur ve söyle” uyarısı genel bir güvenlik mesajıdır.',
  'aasm-sleep-2016': 'Tam metin PubMed Central üzerinden okundu.',
  'sleep-athlete-2021': 'Özet metni Europe PMC üzerinden okundu; tam metne erişilemedi.',
  'aap-media-2016': 'Özet metni Europe PMC üzerinden okundu.',
  'overtraining-2013': 'Özet metni Europe PMC üzerinden okundu.',
  'ioc-supplements': 'Özet tamamı okundu; tam metnin kafein yan etkileri, yağ yakıcılar ve çocuk/ergen ifadeleri bölümleri Europe PMC üzerinden tarandı (tam metin baştan sona okunmadı). Metin çocuklar için ayrı öneri vermez.',
  'ramadan-2012': 'Özet metni Europe PMC üzerinden okundu.',
};
