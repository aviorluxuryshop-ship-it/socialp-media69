export type LegalCompany = {
  name: string; // ticari unvan
  brand: string; // marka adı (Prime Kids)
  mersis: string;
  taxOffice: string;
  taxNo: string;
  address: string;
  phone: string;
  email: string;
  kepEmail: string;
  siteUrl: string;
  returnDays: number; // cayma hakkı süresi (gün)
  freeShippingThreshold: number; // TL
  shippingFee: number; // TL
  dispatchDays: string; // örn. "1-2 iş günü" kargoya verme süresi
  deliveryDays: string; // örn. "2-4 iş günü" teslim süresi
  carrier: string; // örn. "Yurtiçi Kargo"
  paymentProvider: string; // örn. "iyzico" — ödeme kuruluşu adı
  returnAddress: string;
  returnShippingPolicy: string; // cayma hakkı iadesinde iade kargosunu kimin ödediği (tam cümle)
};
export type LegalSection = { heading?: string; paragraphs?: string[]; list?: string[] };
export type LegalDoc = {
  slug: string;
  title: string;
  summary: string; // 1 cümle, listeleme kartında görünür
  updated: string; // "16 Kasım 2026"
  sections: LegalSection[];
};

const UPDATED = "16 Kasım 2026";

const tl = (n: number): string => new Intl.NumberFormat("tr-TR").format(n) + " TL";

/** Her belgenin ilk bölümü: şablon uyarısı. */
function importantNote(): LegalSection {
  return {
    heading: "Önemli not",
    paragraphs: [
      "Bu metin bir şablon ve yer tutucudur. Gerçek hukuki danışmanlık yerine geçmez.",
      "Yayına almadan önce bir avukat veya alanında uzman bir danışman tarafından gözden geçirilmeli ve şirket bilgileriyle doldurulmalıdır.",
    ],
  };
}

/** Şirket kimlik bilgileri listesi. */
function companyList(c: LegalCompany): string[] {
  return [
    `Ticari unvan: ${c.name}`,
    `Marka: ${c.brand}`,
    `MERSİS no: ${c.mersis}`,
    `Vergi dairesi / vergi no: ${c.taxOffice} / ${c.taxNo}`,
    `Adres: ${c.address}`,
    `Telefon: ${c.phone}`,
    `E-posta: ${c.email}`,
    `KEP adresi: ${c.kepEmail}`,
    `İnternet sitesi: ${c.siteUrl}`,
  ];
}

/** Belge sonuna eklenen iletişim bölümü. */
function contactSection(c: LegalCompany, heading = "İletişim"): LegalSection {
  return {
    heading,
    paragraphs: ["Bu metinle veya siparişinizle ilgili sorularınız için bize ulaşabilirsiniz."],
    list: [
      `E-posta: ${c.email}`,
      `Telefon: ${c.phone}`,
      `Adres: ${c.address}`,
      `KEP adresi: ${c.kepEmail}`,
    ],
  };
}

export function getLegalDocs(c: LegalCompany): LegalDoc[] {
  const free = tl(c.freeShippingThreshold);
  const fee = tl(c.shippingFee);

  // 1 ----------------------------------------------------------------
  const kvkk: LegalDoc = {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    summary: `${c.brand} olarak kişisel verilerinizi nasıl işlediğimizi ve KVKK kapsamındaki haklarınızı anlatan aydınlatma metni.`,
    updated: UPDATED,
    sections: [
      importantNote(),
      {
        heading: "Giriş",
        paragraphs: [
          `Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun (KVKK) 10. maddesi uyarınca, ${c.brand} internet sitesini kullanan ve sipariş veren kişileri bilgilendirmek amacıyla hazırlanmıştır.`,
          "Amacımız, hangi verilerinizi neden işlediğimizi ve haklarınızı açık bir dille aktarmaktır.",
        ],
      },
      {
        heading: "Veri sorumlusu",
        paragraphs: ["Kişisel verileriniz bakımından veri sorumlusu aşağıdaki şirkettir:"],
        list: companyList(c),
      },
      {
        heading: "İşlenen kişisel veriler",
        paragraphs: ["Siteyi kullanımınıza ve sipariş sürecinize bağlı olarak aşağıdaki veriler işlenebilir:"],
        list: [
          "Kimlik bilgileri: ad, soyad",
          "İletişim bilgileri: e-posta adresi, telefon numarası, teslimat ve fatura adresi",
          "Müşteri işlem bilgileri: sipariş içeriği, sipariş geçmişi, iade ve değişim talepleri, talep ve şikayet kayıtları",
          "İşlem güvenliği bilgileri: IP adresi, tarayıcı ve cihaz bilgisi, oturum kayıtları",
          "Pazarlama bilgileri: yalnızca izin vermeniz halinde alışveriş tercihleriniz ve kampanya iletisi tercihleriniz",
          "Ödeme bilgileri: ödeme işlemi, ödeme kuruluşu üzerinden yürütülür. Kart numaranız ve güvenlik kodunuz tarafımızca saklanmaz.",
        ],
      },
      {
        heading: "Çocuklara ait bilgiler hakkında",
        paragraphs: [
          "Mağazamız çocuk giyim ürünleri sunar, ancak alışveriş yetişkinler tarafından yapılır.",
          "Siparişte çocuğunuzun beden veya yaş bilgisini ürün seçimi için girebilirsiniz. Bunun dışında çocuklara ait kişisel veri talep etmeyiz.",
        ],
      },
      {
        heading: "Kişisel verilerin işlenme amaçları",
        list: [
          "Üyelik ve sipariş işlemlerinin yürütülmesi",
          "Ürünlerin hazırlanması, kargolanması ve teslim edilmesi",
          "Ödemenin alınması, faturalandırma ve muhasebe süreçleri",
          "İade, değişim ve cayma taleplerinin yönetilmesi",
          "Müşteri hizmetleri ve destek taleplerinin yanıtlanması",
          "Bilgi güvenliğinin sağlanması ve hileli işlemlerin önlenmesi",
          "Yasal yükümlülüklerin yerine getirilmesi",
          "İzin vermeniz halinde kampanya, duyuru ve kişiselleştirilmiş öneri gönderilmesi",
          "Sitenin iyileştirilmesi için istatistiksel analizler yapılması",
        ],
      },
      {
        heading: "Kişisel verilerin aktarılması",
        paragraphs: [
          "Kişisel verileriniz, yukarıdaki amaçlarla sınırlı olmak üzere ve ilgili mevzuata uygun şekilde aşağıdaki taraflara aktarılabilir:",
        ],
        list: [
          `Kargo ve lojistik firmaları (ör. ${c.carrier})`,
          `Ödeme kuruluşu (${c.paymentProvider}) ve bankalar`,
          "E-posta, SMS ve barındırma gibi hizmet aldığımız iş ortakları",
          "Muhasebe, hukuk ve denetim alanındaki danışmanlarımız",
          "Yetkili kamu kurum ve kuruluşları ile yargı mercileri",
        ],
      },
      {
        paragraphs: [
          "Hizmet aldığımız tarafların sunucuları yurt dışında bulunuyorsa, aktarım KVKK'daki yurt dışına aktarım kurallarına uygun şekilde yapılır.",
        ],
      },
      {
        heading: "Toplama yöntemi ve hukuki sebepler",
        paragraphs: [
          "Verileriniz; internet sitesi, sipariş ve üyelik formları, e-posta, telefon ve müşteri hizmetleri yazışmaları gibi kanallardan, otomatik veya otomatik olmayan yollarla toplanır.",
          "Verileriniz KVKK'da sayılan aşağıdaki hukuki sebeplere dayanılarak işlenir:",
        ],
        list: [
          "Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (sipariş ve teslimat)",
          "Hukuki yükümlülüğümüzün yerine getirilmesi (fatura, vergi ve tüketici mevzuatı)",
          "Bir hakkın tesisi, kullanılması veya korunması",
          "Temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaatlerimiz (güvenlik, hizmet kalitesi)",
          "Açık rızanız (pazarlama iletileri, zorunlu olmayan çerezler gibi izne bağlı işlemler)",
        ],
      },
      {
        heading: "KVKK madde 11 kapsamındaki haklarınız",
        paragraphs: ["Veri sorumlusuna başvurarak kişisel verilerinizle ilgili şunları talep edebilirsiniz:"],
        list: [
          "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
          "İşlenmişse buna ilişkin bilgi talep etme",
          "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme",
          "Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme",
          "Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme",
          "İlgili mevzuattaki şartlar çerçevesinde verilerin silinmesini veya yok edilmesini isteme",
          "Düzeltme ve silme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme",
          "İşlenen verilerin otomatik sistemlerle analiz edilmesi sonucunda aleyhinize bir sonuç çıkmasına itiraz etme",
          "Kanuna aykırı işlenmesi nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme",
        ],
      },
      {
        heading: "Başvuru yolu",
        paragraphs: [
          "Haklarınıza ilişkin taleplerinizi, kimliğinizi doğrulayan bilgilerle birlikte ve talebinizi açıkça belirterek aşağıdaki yollardan iletebilirsiniz:",
        ],
        list: [
          `Yazılı olarak: ${c.address}`,
          `Kayıtlı elektronik posta (KEP) ile: ${c.kepEmail}`,
          `E-posta ile: ${c.email} (başvurunun, ilgili mevzuatta ve Kişisel Verileri Koruma Kurulu düzenlemelerinde öngörülen şartları taşıması gerekir)`,
        ],
      },
      {
        paragraphs: [
          "Başvurularınız, talebin niteliğine göre en kısa sürede ve her halükarda ilgili mevzuatta belirtilen süre içinde sonuçlandırılır. İşlem ayrıca bir maliyet gerektiriyorsa mevzuattaki tarifeye göre ücret talep edilebilir.",
          "Başvurunuzdan memnun kalmazsanız Kişisel Verileri Koruma Kurulu'na şikayet hakkınız saklıdır.",
        ],
      },
    ],
  };

  // 2 ----------------------------------------------------------------
  const gizlilik: LegalDoc = {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikası",
    summary: `${c.brand} olarak bilgilerinizi neden topladığımızı, nasıl kullandığımızı ve nasıl koruduğumuzu açıklayan gizlilik politikamız.`,
    updated: UPDATED,
    sections: [
      importantNote(),
      {
        heading: "Genel bakış",
        paragraphs: [
          `${c.name} (${c.brand}), ${c.siteUrl} adresindeki mağazayı işletir. Gizliliğinize saygı duyuyor, bilgilerinizi yalnızca gerekli olduğu kadar topluyoruz.`,
          "Bu politika, sitemizi kullanırken hangi bilgilerin toplandığını ve nasıl kullanıldığını özetler. Ayrıntılı bilgi için KVKK Aydınlatma Metni ve Çerez Politikası'na bakabilirsiniz.",
        ],
      },
      {
        heading: "Hangi bilgileri topluyoruz",
        list: [
          "Sipariş verirken girdiğiniz bilgiler: ad, soyad, e-posta, telefon, teslimat ve fatura adresi",
          "Sipariş ve iade geçmişiniz",
          "Bize yazdığınız mesajlar ve destek kayıtları",
          "Cihaz, tarayıcı ve IP adresi gibi teknik bilgiler",
          "Çerezler ve benzeri teknolojilerle elde edilen kullanım bilgileri (tercihinize bağlı olarak)",
        ],
      },
      {
        heading: "Bilgilerinizi nasıl kullanıyoruz",
        list: [
          "Siparişinizi almak, hazırlamak ve size ulaştırmak",
          "Ödeme, fatura ve iade işlemlerini yürütmek",
          "Sorularınızı ve taleplerinizi yanıtlamak",
          "Sitemizin güvenliğini sağlamak ve kötüye kullanımı önlemek",
          "Sitemizi daha kullanışlı hale getirmek",
          "Yalnızca izninizle kampanya ve yeni ürün duyuruları göndermek",
        ],
      },
      {
        heading: "Bilgilerinizi kimlerle paylaşıyoruz",
        paragraphs: [
          "Bilgilerinizi satmayız. Yalnızca hizmeti sunmak için gerekli olduğunda ve ilgili mevzuata uygun şekilde paylaşırız:",
        ],
        list: [
          `Kargo firması (${c.carrier})`,
          `Ödeme kuruluşu (${c.paymentProvider})`,
          "E-posta, SMS, barındırma ve analiz gibi hizmet sağlayıcılar",
          "Yasal zorunluluk halinde yetkili kurum ve mercilerle",
        ],
      },
      {
        heading: "Ödeme bilgileriniz",
        paragraphs: [
          `Kart bilgileriniz ${c.paymentProvider} tarafından güvenli şekilde işlenir. ${c.brand} kart numaranızı, son kullanma tarihinizi veya güvenlik kodunuzu kaydetmez ve saklamaz.`,
        ],
      },
      {
        heading: "Bilgilerin saklanma süresi",
        paragraphs: [
          "Bilgilerinizi, toplanma amacı için gerekli olan süre boyunca ve fatura, vergi ve tüketici mevzuatının öngördüğü saklama süreleri kadar tutarız. Süre dolduğunda bilgiler silinir, yok edilir veya anonim hale getirilir.",
        ],
      },
      {
        heading: "Güvenlik",
        paragraphs: [
          "Bilgilerinizi yetkisiz erişime, kayba ve kötüye kullanıma karşı korumak için makul teknik ve idari tedbirler alırız. Buna rağmen internet üzerinden yapılan hiçbir iletimin tamamen risksiz olmadığını hatırlatırız.",
          "Hesap şifrenizi kimseyle paylaşmamanızı ve başkalarının erişebileceği cihazlarda oturumunuzu kapatmanızı öneririz.",
        ],
      },
      {
        heading: "Çocukların gizliliği",
        paragraphs: [
          "Sitemiz ebeveynlere ve yetişkinlere yöneliktir. 18 yaşından küçüklerden bilerek kişisel veri toplamayız. Bir çocuğa ait bilginin bize iletildiğini düşünüyorsanız lütfen bizimle iletişime geçin, gerekli düzeltmeyi yapalım.",
        ],
      },
      {
        heading: "Üçüncü taraf bağlantıları",
        paragraphs: [
          "Sitemiz, başka sitelere bağlantılar içerebilir. Bu sitelerin gizlilik uygulamalarından sorumlu değiliz. Ziyaret ettiğiniz sitelerin politikalarını okumanızı öneririz.",
        ],
      },
      {
        heading: "Haklarınız",
        paragraphs: [
          "KVKK kapsamında verilerinize erişme, düzeltme, silme ve işlenmesine itiraz etme gibi haklara sahipsiniz. Bu hakların tam listesi ve başvuru yolu KVKK Aydınlatma Metni'nde yer alır.",
          "Pazarlama iletilerini dilediğiniz zaman, iletideki bağlantıdan veya bize yazarak durdurabilirsiniz.",
        ],
      },
      {
        heading: "Politikadaki değişiklikler",
        paragraphs: [
          "Bu politikayı zaman zaman güncelleyebiliriz. Güncel sürüm her zaman bu sayfada yayımlanır ve sayfanın üstündeki tarih son güncellemeyi gösterir.",
        ],
      },
      contactSection(c),
    ],
  };

  // 3 ----------------------------------------------------------------
  const cerez: LegalDoc = {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    summary: `${c.brand} sitesinde çerezlerin ve yerel depolamanın nasıl kullanıldığını ve tercihlerinizi nasıl yönetebileceğinizi açıklar.`,
    updated: UPDATED,
    sections: [
      importantNote(),
      {
        heading: "Çerez nedir",
        paragraphs: [
          "Çerezler, bir siteyi ziyaret ettiğinizde tarayıcınıza kaydedilen küçük metin dosyalarıdır. Siteyi hatırlamasına, güvenli çalışmasına ve nasıl kullanıldığını anlamasına yardımcı olurlar.",
          `Bu politika, ${c.siteUrl} adresinde hangi tür çerezlerin kullanıldığını ve tercihlerinizi nasıl yönetebileceğinizi açıklar.`,
        ],
      },
      {
        heading: "Şu anki durum",
        paragraphs: [
          `${c.brand} sitesi şu anda analitik veya pazarlama çerezi kullanmamaktadır; bu nedenle sitede bir çerez onay penceresi gösterilmez. Yalnızca sepetinizin ve ödeme formu taslağınızın çalışması için tarayıcınızın kendi depolama alanı kullanılır.`,
          "İleride analitik veya pazarlama çerezleri kullanılmaya başlanırsa bu politika güncellenir ve bu çerezler yalnızca onayınız alındıktan sonra etkinleştirilir.",
        ],
      },
      {
        heading: "Çerez türleri",
      },
      {
        heading: "1. Zorunlu çerezler",
        paragraphs: [
          "Sitenin çalışması için gereklidir. Güvenli oturum, sayfalar arası geçiş ve ödeme adımı gibi temel işlevleri sağlar. Bu çerezler için onayınız aranmaz ve sitenin çalışması için kapatılamaz.",
        ],
      },
      {
        heading: "2. Analitik çerezler",
        paragraphs: [
          "Şu anda kullanılmamaktadır. Ziyaretçilerin siteyi nasıl kullandığını anlamaya yardımcı olan çerezlerdir; örneğin hangi sayfaların ziyaret edildiği ve sitede ne kadar kalındığı ölçülür. Bu bilgiler toplu ve istatistiksel olarak değerlendirilir. Bu çerezler yalnızca tercihinize göre, onayınızla kullanılır.",
        ],
      },
      {
        heading: "3. Pazarlama çerezleri",
        paragraphs: [
          "Şu anda kullanılmamaktadır. İlgi alanlarınıza uygun ürün ve kampanyaları göstermek ve reklam performansını ölçmek için kullanılır. Bu çerezler yalnızca onayınızla etkinleştirilir.",
        ],
      },
      {
        heading: "Sepetiniz ve yerel depolama",
        paragraphs: [
          "Sepetiniz, tarayıcınızın yerel depolama alanında (localStorage) tutulur. Bu sayede sayfayı yenilediğinizde veya siteyi kapatıp tekrar açtığınızda sepetinizdeki ürünler kaybolmaz.",
          "Ödeme sayfasında yazdığınız teslimat bilgileri, ödeme adımından geri döndüğünüzde yeniden yazmanız gerekmesin diye tarayıcınızın oturum deposunda (sessionStorage) geçici olarak tutulur ve sekmeyi kapattığınızda silinir.",
          "Bu veri cihazınızda durur. Tarayıcı verilerini temizlerseniz veya başka bir cihaz ya da tarayıcı kullanırsanız sepetiniz boşalır.",
        ],
      },
      {
        heading: "Üçüncü taraf çerezleri",
        paragraphs: [
          `Ödeme sayfasında ${c.paymentProvider} gibi ödeme kuruluşları ve analiz ya da reklam hizmeti sağlayıcıları kendi çerezlerini kullanabilir. Bu çerezler ilgili tarafların politikalarına tabidir.`,
        ],
      },
      {
        heading: "Çerez tercihlerinizi nasıl yönetirsiniz",
        list: [
          "Analitik veya pazarlama çerezleri kullanılmaya başlandığında, sitede görüntülenecek çerez bildirimi üzerinden bunları kabul edebilir ya da reddedebilir, verdiğiniz onayı dilediğiniz zaman geri çekebilirsiniz.",
          "Tarayıcınızın ayarlarından çerezleri engelleyebilir, silebilir veya çerez kullanılmadan önce uyarı alacak şekilde yapılandırabilirsiniz.",
          "Tarayıcı verilerinizi temizlediğinizde çerezlerle birlikte sepetiniz de silinir.",
        ],
      },
      {
        paragraphs: [
          "Zorunlu çerezleri engellerseniz sitenin bazı bölümleri, örneğin sepet ve ödeme adımları, düzgün çalışmayabilir.",
        ],
      },
      {
        heading: "Kişisel verilerin korunması",
        paragraphs: [
          "Çerezler aracılığıyla elde edilen kişisel veriler, KVKK Aydınlatma Metni ve Gizlilik Politikası'nda açıklanan ilkelere uygun olarak işlenir.",
        ],
      },
      {
        heading: "Politikadaki değişiklikler",
        paragraphs: [
          "Çerez Politikası'nı güncelleyebiliriz. Güncel sürüm bu sayfada yayımlanır.",
        ],
      },
      contactSection(c),
    ],
  };

  // 4 ----------------------------------------------------------------
  const mesafeli: LegalDoc = {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    summary: `${c.siteUrl} üzerinden verdiğiniz siparişe ilişkin, satıcı ve alıcının hak ve yükümlülüklerini düzenleyen mesafeli satış sözleşmesi.`,
    updated: UPDATED,
    sections: [
      importantNote(),
      {
        heading: "Madde 1 - Taraflar",
        paragraphs: ["SATICI:"],
        list: companyList(c),
      },
      {
        paragraphs: [
          "ALICI: Sipariş sırasında ad, soyad, adres, telefon ve e-posta bilgilerini bildiren kişidir. Alıcının bilgileri sipariş özetinde ve onay e-postasında yer alır.",
        ],
      },
      {
        heading: "Madde 2 - Sözleşmenin konusu",
        paragraphs: [
          `Bu sözleşme, ALICI'nın ${c.siteUrl} üzerinden siparişini verdiği ürünlerin satışı ve teslimi ile tarafların hak ve yükümlülüklerini, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri çerçevesinde düzenler.`,
        ],
      },
      {
        heading: "Madde 3 - Ürün ve sipariş bilgileri",
        paragraphs: [
          "Ürünün adı, türü, rengi, bedeni, adedi, KDV dahil satış fiyatı ve kargo bedeli gibi bilgiler sipariş özetinde gösterilir. Sipariş özeti sipariş sırasında ve onay e-postasında yer alır.",
          "Sipariş özeti, bu sözleşmenin ayrılmaz bir parçasıdır.",
        ],
      },
      {
        heading: "Madde 4 - Fiyat ve ödeme",
        list: [
          "Ürün fiyatları, aksi belirtilmedikçe KDV dahil Türk Lirası cinsindendir.",
          `Sepet tutarı ${free} ve üzerindeyse kargo ücretsizdir. Bu tutarın altındaki siparişlerde kargo ücreti ${fee} olup ödeme adımında ayrıca gösterilir.`,
          `Ödeme, kredi/banka kartı ile ${c.paymentProvider} altyapısı üzerinden yapılır. Kart bilgileri SATICI tarafından saklanmaz.`,
          "Taksit imkanı, varsa, ödeme adımında gösterilir. Taksit ve olası komisyon ya da faiz bilgisi kartı veren bankaya ve ödeme kuruluşuna göre değişebilir.",
          "Ödeme tamamlanmadan sipariş kesinleşmez. Ödeme doğrulanamazsa sipariş iptal edilebilir.",
        ],
      },
      {
        heading: "Madde 5 - Teslimat",
        list: [
          `Ürünler, ödemenin onaylanmasından sonra ${c.dispatchDays} içinde kargoya verilir.`,
          `Teslim süresi, kargoya verilmesinden itibaren genellikle ${c.deliveryDays} içindedir. Ürünler ${c.carrier} ile gönderilir.`,
          "Kanunda öngörülen azami teslim süresi (siparişten itibaren 30 gün) aşılamaz. Bu süre içinde teslim edilemezse ALICI sözleşmeden dönebilir.",
          "Ürün, ALICI'nın belirttiği teslimat adresine veya ALICI'nın bildirdiği kişiye teslim edilir. Adres bilgilerinin doğruluğundan ALICI sorumludur.",
          "ALICI, teslim sırasında paketi kontrol etmelidir. Ezilmiş, yırtılmış veya hasarlı pakette teslim almadan kargo görevlisine tutanak tutturması önerilir.",
        ],
      },
      {
        heading: "Madde 6 - Cayma hakkı",
        paragraphs: [
          `ALICI, ürünün kendisine veya gösterdiği adresteki kişiye tesliminden itibaren ${c.returnDays} gün içinde, herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.`,
          `Cayma hakkının kullanıldığının, bu süre içinde SATICI'ya yazılı olarak (${c.email} veya ${c.kepEmail}) bildirilmesi gerekir. Ürünün de bildirimden itibaren ilgili mevzuatta öngörülen süre içinde SATICI'ya gönderilmesi gerekir.`,
          "İade edilecek ürün; kullanılmamış, yıkanmamış, etiketleri ve ambalajı sağlam ve eksiksiz olmalıdır. Fatura ve varsa hediye ve aksesuarlar ile birlikte gönderilmelidir.",
          "Mevzuatta sayılan istisnalar için cayma hakkı kullanılamaz. Örneğin ALICI'nın isteğine göre kişiye özel hazırlanan ürünler ve ambalajı açılmış, sağlık ve hijyen açısından iadesi uygun olmayan ürünler bu kapsamdadır.",
          "SATICI, cayma bildirimini aldığı tarihten itibaren 14 gün içinde ürün bedelini ve varsa teslimat masraflarını, ALICI'nın ödemede kullandığı yöntemle iade eder. Bankanın iadeyi hesaba yansıtma süresi SATICI'nın kontrolünde değildir.",
          "İade ve değişim işlemlerinin ayrıntıları İade ve Değişim Koşulları sayfasında yer alır.",
        ],
      },
      {
        heading: "Madde 7 - Ayıplı ürün",
        paragraphs: [
          "ALICI'nın, ayıplı mal teslim edilmesi halinde Tüketicinin Korunması Hakkında Kanun'dan doğan seçimlik hakları saklıdır. Hatalı, eksik veya hasarlı ürün teslim aldığınızda bize gecikmeden bildirmenizi rica ederiz.",
        ],
      },
      {
        heading: "Madde 8 - Mücbir sebep",
        paragraphs: [
          "Doğal afet, savaş, grev, salgın, kargo ve ulaşım ağında yaşanan olağanüstü aksamalar gibi tarafların kontrolü dışındaki olaylar nedeniyle yükümlülüklerin yerine getirilememesinden taraflar sorumlu tutulamaz. Bu durumda ALICI bilgilendirilir.",
        ],
      },
      {
        heading: "Madde 9 - Kişisel veriler",
        paragraphs: [
          "ALICI'nın kişisel verileri, sözleşmenin kurulması ve ifası amacıyla ve KVKK Aydınlatma Metni'nde açıklandığı şekilde işlenir.",
        ],
      },
      {
        heading: "Madde 10 - Uyuşmazlıkların çözümü",
        paragraphs: [
          "Bu sözleşmeden doğan uyuşmazlıklarda, her yıl Ticaret Bakanlığı tarafından ilan edilen güncel parasal sınırlar dahilinde ALICI'nın yerleşim yerindeki veya sözleşmenin kurulduğu yerdeki Tüketici Hakem Heyetleri'ne; bu sınırların üzerindeki uyuşmazlıklarda Tüketici Mahkemeleri'ne başvurulabilir.",
          "Parasal sınırlar her yıl yeniden belirlendiğinden, başvuru yapacağınız tarihteki güncel değerlere resmi kaynaklardan bakmanızı öneririz.",
        ],
      },
      {
        heading: "Madde 11 - Yürürlük",
        paragraphs: [
          "ALICI, sipariş vermekle bu sözleşmenin tüm şartlarını okuduğunu, anladığını ve elektronik ortamda kabul ettiğini beyan eder. Sözleşme, sipariş onayı ile birlikte yürürlüğe girer.",
        ],
      },
      contactSection(c),
    ],
  };

  // 5 ----------------------------------------------------------------
  const onBilgi: LegalDoc = {
    slug: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    summary: "Sipariş vermeden önce bilmeniz gereken satıcı, ürün, fiyat, teslimat ve cayma hakkı bilgilerini içeren ön bilgilendirme formu.",
    updated: UPDATED,
    sections: [
      importantNote(),
      {
        heading: "Bu form neden var",
        paragraphs: [
          "Mesafeli Sözleşmeler Yönetmeliği uyarınca, sipariş vermeden önce bazı bilgileri size sunmak zorundayız. Bu form bu bilgileri özetler.",
        ],
      },
      {
        heading: "1. Satıcı bilgileri",
        list: companyList(c),
      },
      {
        heading: "2. Ürünün temel nitelikleri",
        paragraphs: [
          "Ürünün adı, rengi, bedeni, adedi ve temel özellikleri ürün sayfasında yer alır. Sipariş özeti sipariş sırasında ve onay e-postasında yer alır.",
          "Ürün görselleri bilgilendirme amaçlıdır. Ekran ayarları nedeniyle renk tonlarında küçük farklar görülebilir.",
        ],
      },
      {
        heading: "3. Fiyat ve ödeme",
        list: [
          "Toplam fiyat, vergiler (KDV) dahil olarak sipariş özetinde gösterilir.",
          `Sepet tutarı ${free} ve üzerindeyse kargo ücretsizdir. Altındaki siparişlerde kargo ücreti ${fee} olarak toplam tutara eklenir.`,
          `Ödeme, kredi veya banka kartı ile ${c.paymentProvider} üzerinden yapılır.`,
          "Peşin ya da taksitli ödeme seçenekleri ödeme adımında gösterilir. Taksit ve olası ek maliyet bilgisi kartı veren bankaya göre değişebilir.",
        ],
      },
      {
        heading: "4. Teslimat",
        list: [
          `Kargoya verme süresi: ${c.dispatchDays}`,
          `Teslim süresi: ${c.deliveryDays}`,
          `Kargo firması: ${c.carrier}`,
          "Teslimat, sipariş sırasında belirttiğiniz adrese yapılır.",
        ],
      },
      {
        heading: "5. Cayma hakkı",
        paragraphs: [
          `Ürünü teslim aldığınız tarihten itibaren ${c.returnDays} gün içinde, hiçbir gerekçe göstermeden ve cezai şart ödemeden sözleşmeden cayabilirsiniz.`,
          `Cayma bildirimini ${c.email} adresine e-posta ile, ${c.kepEmail} adresine KEP ile veya yazılı olarak ${c.address} adresine iletebilirsiniz.`,
          "İade edilecek ürün kullanılmamış, yıkanmamış, etiketli ve ambalajı sağlam olmalıdır.",
          "Mevzuatta sayılan bazı ürünlerde cayma hakkı kullanılamaz. Örneğin kişiye özel hazırlanan ürünler ve ambalajı açılmış, hijyen açısından iadesi uygun olmayan ürünler bu kapsamdadır.",
          "Cayma halinde ürün bedeli, bildirimi aldığımız tarihten itibaren 14 gün içinde, ödemede kullandığınız yöntemle iade edilir.",
        ],
      },
      {
        heading: "6. Cayma hakkının kullanımında iade adresi",
        list: [`İade adresi: ${c.returnAddress}`, `Taşıyıcı: ${c.carrier} (veya sizin seçeceğiniz başka bir taşıyıcı)`],
      },
      {
        heading: "7. İade kargo masrafı",
        paragraphs: [
          "Ayıplı veya hatalı gönderilen ürünlerde iade kargo masrafı satıcıya aittir.",
          "Cayma hakkı kapsamındaki iadelerde kargo masrafı uygulaması İade ve Değişim Koşulları sayfasında açıklanır.",
        ],
      },
      {
        heading: "8. Şikayet ve uyuşmazlık çözümü",
        paragraphs: [
          "Şikayetlerinizi önce bize iletmenizi rica ederiz. Çözüm bulunamazsa, her yıl ilan edilen güncel parasal sınırlar dahilinde Tüketici Hakem Heyetleri'ne veya Tüketici Mahkemeleri'ne başvurabilirsiniz.",
        ],
      },
      {
        heading: "9. Onay",
        paragraphs: [
          "Siparişinizi onaylamadan önce bu formu ve Mesafeli Satış Sözleşmesi'ni okuduğunuzu ve elektronik ortamda onayladığınızı beyan etmiş olursunuz.",
        ],
      },
      contactSection(c),
    ],
  };

  // 6 ----------------------------------------------------------------
  const iade: LegalDoc = {
    slug: "iade-degisim",
    title: "İade ve Değişim Koşulları",
    summary: `Ürünü teslim aldıktan sonra ${c.returnDays} gün içinde nasıl iade veya değişim yapabileceğinizi adım adım anlatır.`,
    updated: UPDATED,
    sections: [
      importantNote(),
      {
        heading: "Cayma süresi",
        paragraphs: [
          `Ürünü teslim aldığınız tarihten itibaren ${c.returnDays} gün içinde, gerekçe göstermeden iade edebilirsiniz.`,
          "Bu süre, ürünün size veya adresinizdeki kişiye tesliminden itibaren işlemeye başlar.",
        ],
      },
      {
        heading: "İade nasıl yapılır",
        list: [
          `1. ${c.email} adresine, sipariş numaranız ve iade etmek istediğiniz ürünlerle birlikte iade talebinizi yazın. İsterseniz aşağıdaki cayma formu metnini kullanabilirsiniz.`,
          "2. Talebiniz değerlendirilir ve size iade için gerekli bilgiler e-posta ile iletilir.",
          "3. Ürünü, etiketleri takılı ve eksiksiz halde, mümkünse orijinal ambalajında ve faturasıyla birlikte paketleyin.",
          `4. Paketi ${c.carrier} veya dilediğiniz bir kargo firması ile aşağıdaki adrese gönderin: ${c.returnAddress}`,
          "5. Gönderi tarafımıza ulaşıp kontrol edildikten sonra iade işleminiz başlatılır.",
        ],
      },
      {
        paragraphs: ["Kargo takip numarasını saklamanızı öneririz. Paket tarafımıza ulaşana kadar gönderinin sorumluluğu sizdedir."],
      },
      {
        heading: "Ürünün durumu",
        paragraphs: ["İadenin kabul edilebilmesi için ürünün şu durumda olması gerekir:"],
        list: [
          "Kullanılmamış ve yıkanmamış olması",
          "Etiketlerinin üzerinde ve eksiksiz olması",
          "Kokulu, lekeli, kirli veya hasarlı olmaması",
          "Orijinal ambalajında ve varsa tüm aksesuarlarıyla birlikte gönderilmesi",
        ],
      },
      {
        paragraphs: [
          "Ürünü beden ve uyum açısından denemek amacıyla makul ölçüde inceleyebilirsiniz. Normal inceleme dışındaki kullanım nedeniyle oluşan değer kaybı iade bedelinden düşülebilir.",
        ],
      },
      {
        heading: "İade edilemeyen ürünler",
        paragraphs: [
          "Mevzuatta cayma hakkı dışında tutulan ürünler iade edilemez. Örneğin kişiye özel hazırlanan ürünler ve ambalajı açılmış, hijyen açısından iadesi uygun olmayan ürünler bu kapsamdadır.",
          "Bir ürünün iade edilip edilemeyeceği konusunda emin değilseniz sipariş vermeden önce bize sorabilirsiniz.",
        ],
      },
      {
        heading: "Ücret iadesi",
        list: [
          "Cayma bildirimini aldığımız tarihten itibaren 14 gün içinde ürün bedeli iade edilir.",
          "İade, ödemeyi yaptığınız yönteme yapılır. Kartla ödediyseniz tutar kartınıza iade edilir.",
          "Bankanız iadeyi hesabınıza veya kart ekstrenize yansıtırken ek süre geçebilir. Bu süre bankanıza bağlıdır.",
          "Ürün bize ulaşana kadar iade bedelini ödemeyi bekleme hakkımız saklıdır.",
        ],
      },
      {
        heading: "Kargo ücreti",
        paragraphs: [
          "Hatalı, eksik veya hasarlı gönderilen ürünlerde iade kargo ücreti tarafımızca karşılanır. Bu durumda lütfen göndermeden önce bizimle iletişime geçin.",
          c.returnShippingPolicy,
        ],
      },
      {
        heading: "Beden değişimi",
        list: [
          "Beden değişimi, aynı üründe stokta bulunan başka bir beden için yapılabilir.",
          "Değişim talebinizi iade ile aynı şekilde e-posta ile bildirin ve istediğiniz bedeni yazın.",
          "İstediğiniz beden stokta yoksa ürünü iade edebilir veya başka bir ürün seçebilirsiniz.",
          "Değişim için gönderdiğiniz ürün de yukarıdaki durum şartlarını karşılamalıdır.",
          "Değişim ürününün gönderiminde kargo ücreti uygulaması şirket politikasına göre belirlenir ve talebinizde size bildirilir.",
        ],
      },
      {
        heading: "Hatalı veya hasarlı ürün",
        paragraphs: [
          "Teslim aldığınız ürün hatalı, eksik veya hasarlıysa bize fotoğrafla birlikte, mümkün olan en kısa sürede bildirin. Tüketici mevzuatındaki ayıplı mal haklarınız saklıdır.",
        ],
      },
      {
        heading: "Örnek cayma formu metni",
        paragraphs: [
          "Aşağıdaki metni kopyalayıp doldurarak e-posta veya yazılı olarak gönderebilirsiniz. Kullanımı zorunlu değildir.",
        ],
      },
      {
        list: [
          `Kime: ${c.name}, ${c.address}, ${c.email}`,
          "Ben/Biz aşağıdaki malların satışına ilişkin sözleşmeden cayma hakkımı kullandığımı beyan ederim/ederiz.",
          "Sipariş numarası ve sipariş tarihi: ...............",
          "Malın adı, bedeni ve adedi: ...............",
          "Malı teslim aldığım tarih: ...............",
          "Tüketicinin adı ve soyadı: ...............",
          "Tüketicinin adresi: ...............",
          "Tüketicinin telefon ve e-posta adresi: ...............",
          "İade bedelinin yatırılacağı hesap veya kart bilgisi (ödemede kullanılan yöntemle aynı olur): ...............",
          "Tarih ve imza (kağıt ortamında gönderiliyorsa): ...............",
        ],
      },
      contactSection(c),
    ],
  };

  // 7 ----------------------------------------------------------------
  const teslimat: LegalDoc = {
    slug: "teslimat-kargo",
    title: "Teslimat ve Kargo Koşulları",
    summary: `Siparişinizin ne zaman kargoya verileceğini, ${c.deliveryDays} içinde nasıl teslim edileceğini ve kargo ücretini açıklar.`,
    updated: UPDATED,
    sections: [
      importantNote(),
      {
        heading: "Kargo firması",
        paragraphs: [`Siparişleriniz ${c.carrier} ile gönderilir.`],
      },
      {
        heading: "Hazırlık ve teslim süreleri",
        list: [
          `Siparişiniz, ödemenin onaylanmasından sonra ${c.dispatchDays} içinde kargoya verilir.`,
          `Kargoya verilen siparişler genellikle ${c.deliveryDays} içinde teslim edilir.`,
          "Hafta sonu ve resmi tatiller iş günü sayılmaz.",
          "Kampanya dönemleri, yılbaşı ve bayram gibi yoğun zamanlarda süreler uzayabilir. Bu durumda bilgilendirme yapılır.",
          "Kanunda öngörülen azami teslim süresi (siparişten itibaren 30 gün) aşılmaz.",
        ],
      },
      {
        heading: "Kargo ücreti",
        list: [
          `Sepet tutarı ${free} ve üzerindeyse kargo ücretsizdir.`,
          `Bu tutarın altındaki siparişlerde kargo ücreti ${fee} olup ödeme adımında toplam tutara eklenir.`,
          "Kargo ücreti, siparişi onaylamadan önce sipariş özetinde açıkça görünür.",
        ],
      },
      {
        heading: "Kargo takibi",
        paragraphs: [
          "Siparişiniz kargoya verildiğinde, e-posta ile bilgilendirilirsiniz. Mesajda yer alan takip numarasıyla gönderinizi kargo firmasının sitesinden izleyebilirsiniz.",
        ],
      },
      {
        heading: "Teslimat adresi",
        list: [
          "Ürün, sipariş sırasında belirttiğiniz adrese teslim edilir. Adresi, telefon numarasını ve kat/daire bilgisini eksiksiz yazmanız önemlidir.",
          "Kargo kurye tarafından aranır. Teslimat sırasında ulaşılabilir olmanız gerekir.",
          "Gönderi çıktıktan sonra adres değişikliği yapılamayabilir. Gerekirse hemen bizimle iletişime geçin.",
          "Siparişi sizin yerinize bir yakınınız teslim alabilir.",
        ],
      },
      {
        heading: "Teslim alırken kontrol",
        list: [
          "Paketi kargo görevlisinin yanında kontrol edin.",
          "Paket ezik, yırtık, ıslak veya açılmış görünüyorsa teslim almayın ve görevliye tutanak tutturun.",
          "Tutanak tutturduğunuzu bize hemen bildirin, sorunu birlikte çözelim.",
          "Paket sağlam görünüyor ama içindeki ürün hatalı veya eksikse bize fotoğrafla birlikte ulaşın.",
        ],
      },
      {
        heading: "Teslim edilemeyen gönderiler",
        paragraphs: [
          "Adres hatası, ulaşılamama veya teslim alınmama gibi nedenlerle teslim edilemeyen gönderiler kargo firmasının uygulamasına göre bekletilir ve ardından bize iade edilir.",
          "Bu durumda sizinle iletişime geçeriz. Yeniden gönderim veya iptal ve ücret iadesi seçeneklerini birlikte değerlendiririz.",
        ],
      },
      {
        heading: "Gecikme ve kayıp",
        paragraphs: [
          "Siparişiniz belirtilen sürede ulaşmazsa bize yazın. Kargo firmasıyla gerekli araştırmayı başlatırız. Kaybolan veya teslim edilemeyen siparişlerde sizin için en uygun çözüm uygulanır: yeniden gönderim veya ücret iadesi.",
        ],
      },
      {
        heading: "İade gönderileri",
        paragraphs: ["İade ve değişim için gönderim adresi ve adımlar İade ve Değişim Koşulları sayfasında yer alır."],
      },
      contactSection(c),
    ],
  };

  // 8 ----------------------------------------------------------------
  const guvenli: LegalDoc = {
    slug: "guvenli-alisveris",
    title: "Ödeme ve Güvenli Alışveriş",
    summary: `Ödemelerinizin ${c.paymentProvider} üzerinden 3D Secure ile nasıl güvenle alındığını ve kart bilgilerinizin saklanmadığını anlatır.`,
    updated: UPDATED,
    sections: [
      importantNote(),
      {
        heading: "Ödeme yöntemi",
        paragraphs: [
          `Siparişlerinizi kredi kartı veya banka kartı ile ödeyebilirsiniz. Ödemeler, lisanslı ödeme kuruluşu ${c.paymentProvider} altyapısı üzerinden alınır.`,
        ],
      },
      {
        heading: "Kart bilgileriniz saklanmaz",
        paragraphs: [
          `${c.brand} kart numaranızı, son kullanma tarihinizi veya güvenlik kodunuzu (CVV) kaydetmez ve saklamaz. Bu bilgiler ödeme sırasında doğrudan ${c.paymentProvider} tarafından işlenir.`,
        ],
      },
      {
        heading: "3D Secure ile ekstra güvenlik",
        paragraphs: [
          "Ödemelerde 3D Secure (3D Güvenli Ödeme) doğrulaması kullanılır. Ödeme sırasında bankanız, kayıtlı cep telefonunuza gönderdiği tek kullanımlık şifre veya mobil uygulama onayıyla sizi doğrular.",
          "Bu doğrulama, kartınızın sizin bilginiz dışında kullanılmasını zorlaştırır. Şifreyi yalnızca bankanızın ekranında girin ve kimseyle paylaşmayın.",
        ],
      },
      {
        heading: "Taksit ve ek maliyet",
        paragraphs: [
          "Taksit seçenekleri, kartınızı veren bankaya ve kampanya koşullarına göre değişir. Geçerli seçenekler ve varsa ek maliyet bilgisi ödeme adımında, ödemeyi onaylamadan önce gösterilir.",
        ],
      },
      {
        heading: "Güvenli bağlantı",
        paragraphs: [
          "Sitemizde bilgi alışverişi şifreli bağlantı (HTTPS) üzerinden yapılır. Alışveriş yaparken adres çubuğunda kilit simgesini ve doğru site adresini kontrol edin.",
        ],
      },
      {
        heading: "Güvenle alışveriş için ipuçları",
        list: [
          `Ödeme yaparken adres çubuğunda ${c.siteUrl} adresini gördüğünüzden emin olun.`,
          "Kart bilgilerinizi e-posta, mesaj veya telefonla kimseyle paylaşmayın. Bizden böyle bir bilgi istenmez.",
          "Şüpheli e-posta ve mesajlardaki bağlantılara tıklamayın.",
          "Ortak kullanılan cihazlarda alışveriş sonrası oturumunuzu kapatın.",
          "Banka hesap hareketlerinizi düzenli kontrol edin.",
        ],
      },
      {
        heading: "Ödeme başarısız olursa",
        list: [
          "Kart bilgilerinizi, limitinizi ve 3D Secure doğrulamasını kontrol ederek yeniden deneyin.",
          "Sorun sürerse bankanızla görüşün veya farklı bir kart deneyin.",
          "Tutar hesabınızdan çekildiği halde siparişiniz oluşmadıysa bize sipariş bilgilerinizle yazın. Durumu inceleyip gerekirse ödemeyi iade ederiz.",
        ],
      },
      {
        heading: "İade ödemeleri",
        paragraphs: [
          "İptal ve iade durumunda ücret, ödemede kullandığınız karta iade edilir. İade süreleri ve bankanın hesaba yansıtma süresi için İade ve Değişim Koşulları sayfasına bakabilirsiniz.",
        ],
      },
      {
        heading: "Fatura",
        paragraphs: [
          "Siparişiniz için fatura düzenlenir ve mevzuata uygun şekilde size iletilir. Fatura bilgilerinizi sipariş sırasında doğru girmeniz önemlidir.",
        ],
      },
      contactSection(c, "Uyuşmazlık ve iletişim"),
    ],
  };

  return [kvkk, gizlilik, cerez, mesafeli, onBilgi, iade, teslimat, guvenli];
}
