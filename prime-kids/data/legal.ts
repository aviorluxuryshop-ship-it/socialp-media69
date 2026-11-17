import { site } from '@/data/site'

/**
 * Yasal metinler — 6502 sayılı Tüketicinin Korunması Hakkında Kanun,
 * Mesafeli Sözleşmeler Yönetmeliği ve 6698 sayılı KVKK esas alınarak
 * hazırlanmıştır. Satıcı bilgileri data/site.ts › company alanından gelir.
 * Yayın öncesi bir hukuk danışmanına kontrol ettirmeniz önerilir.
 */

export interface LegalDoc {
  slug: string
  title: string
  short: string
  summary: string
  html: string
}

const c = site.company
const ship = site.shipping
const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n)} TL`

const sellerTable = `
<table>
  <tbody>
    <tr><th>Ünvan</th><td>${c.title}</td></tr>
    <tr><th>Marka</th><td>${site.name}</td></tr>
    <tr><th>Adres</th><td>${c.address}</td></tr>
    <tr><th>Telefon</th><td>${site.contact.phoneDisplay}</td></tr>
    <tr><th>E-posta</th><td>${site.contact.email}</td></tr>
    <tr><th>Vergi Dairesi / No</th><td>${c.taxOffice} / ${c.taxNumber}</td></tr>
    <tr><th>MERSİS No</th><td>${c.mersis}</td></tr>
    <tr><th>KEP Adresi</th><td>${c.kep}</td></tr>
  </tbody>
</table>`

const returnSteps = `
<ol>
  <li><strong>Bize haber verin:</strong> WhatsApp hattımızdan veya <a href="mailto:${site.contact.email}">${site.contact.email}</a> adresinden sipariş numaranızla birlikte iade ya da değişim talebinizi iletin.</li>
  <li><strong>İade kodunuzu alın:</strong> Size ${ship.carrier.toLowerCase()} için bir iade kodu gönderiyoruz.${site.returns.freeReturn ? ' Bu kodla yapılan gönderimlerde kargo ücreti ödemezsiniz.' : ''}</li>
  <li><strong>Paketleyin:</strong> Ürünü, etiketleri sökülmemiş ve kullanılmamış şekilde, mümkünse orijinal ambalajıyla ve faturasıyla birlikte paketleyin.</li>
  <li><strong>Kargoya verin:</strong> Ürün bize ulaştıktan sonra en geç 14 gün içinde ücretiniz, ödeme yaptığınız yönteme iade edilir; değişimde yeni ürününüz kargoya verilir.</li>
</ol>`

export const legalDocs: LegalDoc[] = [
  {
    slug: 'mesafeli-satis-sozlesmesi',
    title: 'Mesafeli Satış Sözleşmesi',
    short: 'Mesafeli Satış Sözleşmesi',
    summary: 'Online siparişinizde sizinle aramızdaki hak ve yükümlülükler.',
    html: `
<h2>Madde 1 — Taraflar</h2>
<h3>1.1 Satıcı</h3>
${sellerTable}
<h3>1.2 Alıcı</h3>
<p>Sipariş sırasında ad, soyad, adres, telefon ve e-posta bilgilerini giren kişidir (“Alıcı”). Alıcı bilgileri sipariş anında bu sözleşmenin ayrılmaz parçası olarak kayda alınır.</p>

<h2>Madde 2 — Konu</h2>
<p>İşbu sözleşmenin konusu, Alıcı’nın ${site.name} internet sitesi üzerinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sipariş özetinde belirtilen ürünün satışı ve teslimine ilişkin olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.</p>

<h2>Madde 3 — Sözleşme Konusu Ürün, Ödeme ve Teslimat</h2>
<ul>
  <li>Ürünlerin cinsi, türü, rengi, bedeni, adedi ve KDV dahil satış fiyatı sipariş özetinde ve ödeme sayfasında gösterildiği gibidir.</li>
  <li>${tl(ship.freeOver)} ve üzeri siparişlerde kargo ücretsizdir; altındaki siparişlerde ${tl(ship.fee)} kargo ücreti sipariş toplamına eklenir ve ödeme öncesinde açıkça gösterilir.</li>
  <li>Ödeme; kredi/banka kartı (lisanslı ödeme kuruluşu altyapısı ve 3D Secure ile) veya Havale/EFT yöntemiyle yapılır.</li>
  <li>Teslimat, Alıcı’nın sipariş sırasında belirttiği adrese ${ship.carrier.toLowerCase()} aracılığıyla yapılır. Teslim süresi, siparişin onaylanmasından itibaren yasal 30 günlük süreyi aşmamak kaydıyla, genellikle ${ship.deliveryDays[0]}-${ship.deliveryDays[1]} iş günüdür.</li>
</ul>

<h2>Madde 4 — Genel Hükümler</h2>
<ol>
  <li>Alıcı, ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimata ilişkin Ön Bilgilendirme Formu’nu okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder.</li>
  <li>Satıcı, sözleşme konusu ürünün sağlam, eksiksiz, siparişte belirtilen niteliklere uygun ve varsa garanti belgeleri ile teslim edilmesinden sorumludur.</li>
  <li>Ürünün teslimi için bedelinin ödenmiş olması gerekir. Herhangi bir nedenle ürün bedeli ödenmez veya banka kayıtlarında iptal edilirse Satıcı, ürünü teslim yükümlülüğünden kurtulmuş sayılır.</li>
  <li>Stok tükenmesi gibi sebeplerle sözleşme konusu ürünün teslimi imkânsızlaşırsa Satıcı, bu durumu öğrendiği tarihten itibaren 3 gün içinde Alıcı’ya bildirir ve tahsil edilen tutarı en geç 14 gün içinde iade eder.</li>
  <li>Kargo şirketinden kaynaklanan gecikmelerde Satıcı, Alıcı’yı bilgilendirir ve teslimatın takibini yapar.</li>
</ol>

<h2>Madde 5 — Cayma Hakkı</h2>
<p>Alıcı, ürünün kendisine veya gösterdiği adresteki kişiye tesliminden itibaren <strong>${site.returns.days} gün</strong> içinde hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin cayma hakkını kullanabilir.</p>
<ul>
  <li>Cayma hakkının kullanıldığına dair bildirimin bu süre içinde yazılı olarak veya kalıcı veri saklayıcısı ile (e-posta, WhatsApp mesajı) Satıcı’ya yöneltilmesi yeterlidir.</li>
  <li>Alıcı, cayma bildiriminden itibaren 10 gün içinde ürünü Satıcı’ya geri göndermekle yükümlüdür.${site.returns.freeReturn ? ' Satıcı’nın belirlediği anlaşmalı kargo ile yapılan iadelerde gönderim ücreti Alıcı’dan alınmaz.' : ''}</li>
  <li>Satıcı, cayma bildiriminin kendisine ulaştığı tarihten itibaren en geç 14 gün içinde toplam bedeli, Alıcı’nın ödeme yaptığı araca uygun şekilde iade eder.</li>
  <li>Ürünün olağan kullanımı dışında kullanılması nedeniyle oluşan değer kayıplarından Alıcı sorumludur.</li>
</ul>

<h2>Madde 6 — Cayma Hakkının Kullanılamayacağı Haller</h2>
<p>Alıcı’nın istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan (ör. isim baskılı, özel ölçü) ürünler ile ambalajı açıldıktan sonra sağlık ve hijyen açısından iadesi uygun olmayan ürünlerde (iç giyim, mayo alt parçası vb.) cayma hakkı kullanılamaz.</p>

<h2>Madde 7 — Temerrüt Hali</h2>
<p>Alıcı’nın kredi kartı ile yaptığı işlemlerde temerrüde düşmesi halinde kart sahibi bankanın uyguladığı hükümler geçerlidir.</p>

<h2>Madde 8 — Uyuşmazlıkların Çözümü</h2>
<p>İşbu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı’nca her yıl ilan edilen parasal sınırlar dahilinde Alıcı’nın veya Satıcı’nın yerleşim yerindeki <strong>İl veya İlçe Tüketici Hakem Heyetleri</strong>, bu sınırları aşan durumlarda <strong>Tüketici Mahkemeleri</strong> yetkilidir. Şikâyetler ayrıca e-Devlet üzerinden Tüketici Bilgi Sistemi (TÜBİS) ile iletilebilir.</p>

<h2>Madde 9 — Yürürlük</h2>
<p>Alıcı, sipariş sırasında bu sözleşmeyi okuyup kabul ettiğini elektronik ortamda onaylar. Sözleşme, siparişin onaylandığı anda yürürlüğe girer ve bir kopyası Alıcı’nın e-posta adresine gönderilir.</p>`,
  },
  {
    slug: 'on-bilgilendirme-formu',
    title: 'Ön Bilgilendirme Formu',
    short: 'Ön Bilgilendirme Formu',
    summary: 'Sipariş vermeden önce bilmeniz gereken her şey, tek sayfada.',
    html: `
<p>Mesafeli Sözleşmeler Yönetmeliği’nin 5. maddesi uyarınca, siparişinizi onaylamadan önce aşağıdaki konularda bilgilendirilirsiniz.</p>
<h2>1. Satıcı Bilgileri</h2>
${sellerTable}
<h2>2. Ürün ve Fiyat</h2>
<ul>
  <li>Sipariş verdiğiniz ürünlerin adı, rengi, bedeni, adedi ve <strong>KDV dahil</strong> fiyatları sepet ve ödeme sayfasındaki sipariş özetinde gösterilir.</li>
  <li>Kargo ücreti: ${tl(ship.freeOver)} ve üzeri siparişlerde ücretsiz, altında ${tl(ship.fee)}. Bunun dışında hiçbir ek ücret alınmaz.</li>
  <li>Ürün görselleri ile gerçek ürün arasında ekran ayarlarından kaynaklı küçük renk farklılıkları olabilir.</li>
</ul>
<h2>3. Ödeme</h2>
<p>Kredi/banka kartı ile ödemeler lisanslı ödeme kuruluşunun güvenli altyapısında 3D Secure doğrulamasıyla alınır; kart bilgileriniz ${site.name} tarafından görülmez ve saklanmaz. Havale/EFT ile ödemede sipariş, tutarın hesabımıza geçmesiyle işleme alınır.</p>
<h2>4. Teslimat</h2>
<p>Hafta içi saat ${ship.cutoffHour}:00’e kadar onaylanan siparişler aynı gün, sonrasındakiler ilk iş günü kargoya verilir. Tahmini teslim süresi kargoya verildikten sonra ${ship.deliveryDays[0]}-${ship.deliveryDays[1]} iş günüdür; yasal azami süre 30 gündür.</p>
<h2>5. Cayma Hakkı</h2>
<p>Ürünü teslim aldığınız tarihten itibaren <strong>${site.returns.days} gün</strong> içinde gerekçe göstermeden cayma hakkınızı kullanabilirsiniz. Detaylar için <a href="/yasal/iade-ve-degisim">İade ve Değişim Koşulları</a> sayfasını inceleyebilirsiniz.</p>
<h2>6. Şikâyet ve İtiraz</h2>
<p>Şikâyetlerinizi ${site.contact.phoneDisplay} numaralı hattımıza, WhatsApp hattımıza veya ${site.contact.email} adresine iletebilirsiniz. Uyuşmazlık halinde parasal sınırlar dahilinde Tüketici Hakem Heyetleri’ne, aşan durumlarda Tüketici Mahkemeleri’ne başvurabilirsiniz.</p>`,
  },
  {
    slug: 'iade-ve-degisim',
    title: 'İade ve Değişim Koşulları',
    short: 'İade ve Değişim',
    summary: `${site.returns.days} gün içinde kolay iade ve beden değişimi — adım adım.`,
    html: `
<p>Beden mi olmadı, renk mi beklediğiniz gibi değil? Hiç dert etmeyin. Ürünü teslim aldığınız günden itibaren <strong>${site.returns.days} gün</strong> içinde iade edebilir ya da beden/renk değişimi yapabilirsiniz.</p>
<h2>Nasıl iade veya değişim yaparım?</h2>
${returnSteps}
<h2>İade şartları</h2>
<ul>
  <li>Ürün kullanılmamış, yıkanmamış ve etiketleri sökülmemiş olmalıdır.</li>
  <li>Takım halinde satılan ürünler, takımın tüm parçalarıyla birlikte iade edilmelidir.</li>
  <li>Kişiye özel hazırlanan (ör. isim baskılı) ürünlerde cayma hakkı kullanılamaz.</li>
</ul>
<h2>Para iadesi ne zaman yapılır?</h2>
<p>İade ürününüz bize ulaşıp kontrol edildikten sonra, en geç 14 gün içinde iade işlemi başlatılır. Kartla yapılan ödemelerde tutarın kartınıza yansıması bankanıza bağlı olarak birkaç iş günü sürebilir. Havale/EFT ile yapılan ödemelerde iade, adınıza kayıtlı IBAN’a yapılır.</p>
<h2>Değişim</h2>
<p>Değişim taleplerinde, istediğiniz beden veya renk stokta varsa ürününüz bize ulaştığı gün yeni ürününüz kargoya verilir. Stokta yoksa ücret iadesi yapılır.</p>
<h2>Hasarlı veya hatalı ürün</h2>
<p>Kargo paketi hasarlı geldiyse lütfen kargo görevlisine tutanak tutturun. Ayıplı (hatalı) ürünlerde 6502 sayılı Kanun’un 11. maddesindeki seçimlik haklarınızı (bedel iadesi, değişim, onarım veya indirim) kullanabilirsiniz; bu durumda tüm kargo masrafları bize aittir.</p>`,
  },
  {
    slug: 'kargo-ve-teslimat',
    title: 'Kargo ve Teslimat',
    short: 'Kargo ve Teslimat',
    summary: 'Siparişiniz ne zaman kargoya verilir, ne zaman gelir?',
    html: `
<table>
  <tbody>
    <tr><th>Kargo ücreti</th><td>${tl(ship.freeOver)} ve üzeri <strong>ücretsiz</strong>, altında ${tl(ship.fee)}</td></tr>
    <tr><th>Kargoya veriliş</th><td>Hafta içi ${ship.cutoffHour}:00’e kadar verilen siparişler aynı gün; sonrası ilk iş günü</td></tr>
    <tr><th>Tahmini teslim</th><td>Kargoya verildikten sonra ${ship.deliveryDays[0]}-${ship.deliveryDays[1]} iş günü</td></tr>
    <tr><th>Kargo firması</th><td>${ship.carrier}</td></tr>
    <tr><th>Teslimat bölgesi</th><td>Türkiye’nin tüm il ve ilçeleri</td></tr>
  </tbody>
</table>
<h2>Kargo takibi</h2>
<p>Siparişiniz kargoya verildiğinde takip numaranız SMS/WhatsApp veya e-posta ile iletilir.</p>
<h2>Adreste bulunamazsam?</h2>
<p>Kargo görevlisi adreste kimseyi bulamazsa bilgilendirme notu bırakır ve paket en yakın şubede bekletilir. Teslim almadığınız paketler belirli bir süre sonra bize geri döner; bu durumda sizinle iletişime geçeriz.</p>
<h2>Hasarlı paket</h2>
<p>Paket hasarlı görünüyorsa teslim almadan önce kargo görevlisine hasar tespit tutanağı tutturun ve bize haber verin; ürününüzü hemen yeniliyoruz.</p>`,
  },
  {
    slug: 'kvkk-aydinlatma-metni',
    title: 'KVKK Aydınlatma Metni',
    short: 'KVKK Aydınlatma Metni',
    summary: 'Kişisel verilerinizi neden, nasıl işliyor ve nasıl koruyoruz?',
    html: `
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla <strong>${c.title}</strong> (“${site.name}”) olarak kişisel verilerinizi aşağıda açıklanan kapsamda işliyoruz.</p>
<h2>1. İşlenen kişisel veriler</h2>
<ul>
  <li><strong>Kimlik:</strong> ad, soyad</li>
  <li><strong>İletişim:</strong> telefon numarası, e-posta adresi, teslimat ve fatura adresi</li>
  <li><strong>Müşteri işlem:</strong> sipariş içeriği, sipariş notu, hediye notu, iade/değişim talepleri</li>
  <li><strong>Finans:</strong> ödeme tutarı ve iade için IBAN bilgisi (kart bilgileri tarafımızca işlenmez)</li>
  <li><strong>İşlem güvenliği:</strong> sunucu kayıtları (IP adresi, tarih-saat)</li>
</ul>
<h2>2. İşleme amaçları</h2>
<ul>
  <li>Siparişinizin alınması, hazırlanması, faturalandırılması ve teslim edilmesi</li>
  <li>İade, değişim ve müşteri destek taleplerinizin yürütülmesi</li>
  <li>Mesafeli sözleşme ve vergi mevzuatından doğan yükümlülüklerin yerine getirilmesi</li>
  <li>Bilgi güvenliğinin sağlanması ve hukuki uyuşmazlıklarda delil olarak kullanılması</li>
</ul>
<h2>3. Hukuki sebepler</h2>
<p>Verileriniz KVKK m.5/2 kapsamında; <em>bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması</em> (c), <em>veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi</em> (ç), <em>bir hakkın tesisi, kullanılması veya korunması</em> (e) ve <em>meşru menfaat</em> (f) hukuki sebeplerine dayanılarak işlenir. Kampanya ve bilgilendirme mesajları yalnızca ayrıca açık rızanız/ticari elektronik ileti onayınız olursa gönderilir.</p>
<h2>4. Aktarım</h2>
<p>Verileriniz yalnızca yukarıdaki amaçlarla sınırlı olarak; kargo firmasına (teslimat), lisanslı ödeme kuruluşuna ve bankalara (ödeme ve iade), mali müşavir ve e-fatura entegratörüne (faturalandırma), barındırma ve teknik hizmet sağlayıcılarımıza ve talep halinde yetkili kamu kurumlarına aktarılabilir. Barındırma hizmet sağlayıcısının sunucularının yurt dışında bulunması halinde aktarım, KVKK m.9’daki şartlara uygun olarak yapılır.</p>
<h2>5. Toplama yöntemi</h2>
<p>Kişisel verileriniz internet sitemizdeki sipariş ve iletişim formları, WhatsApp, e-posta ve telefon kanallarıyla elektronik ortamda toplanır.</p>
<h2>6. Haklarınız (KVKK m.11)</h2>
<p>Verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini, şartları oluştuğunda silinmesini veya yok edilmesini isteme, otomatik sistemlerle analiz sonucu aleyhinize bir sonuç çıkmasına itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme haklarına sahipsiniz.</p>
<h2>7. Başvuru</h2>
<p>Taleplerinizi <a href="mailto:${site.contact.email}">${site.contact.email}</a> adresine veya ${c.kep} KEP adresine iletebilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.</p>`,
  },
  {
    slug: 'gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    short: 'Gizlilik Politikası',
    summary: 'Bilgileriniz bizde güvende: kısa ve anlaşılır açıklama.',
    html: `
<p>${site.name} olarak gizliliğinize önem veriyoruz. Bu politika, sitemizi kullanırken hangi bilgilerin toplandığını ve nasıl korunduğunu sade bir dille anlatır.</p>
<h2>Ne topluyoruz?</h2>
<p>Yalnızca siparişinizi teslim etmemiz ve sizinle iletişim kurmamız için gereken bilgileri: ad-soyad, telefon, e-posta ve adres. Üyelik zorunluluğu yoktur.</p>
<h2>Kart bilgileriniz</h2>
<p>Kart bilgileriniz sitemize hiç girmez. Kartlı ödemeler lisanslı ödeme kuruluşunun güvenli sayfasında, 3D Secure doğrulamasıyla alınır. Biz yalnızca ödemenin başarılı olup olmadığını görürüz.</p>
<h2>Bilgileri kimseyle paylaşıyor muyuz?</h2>
<p>Bilgileriniz satılmaz, kiralanmaz. Yalnızca siparişinizin teslimi için kargo firmasıyla, ödemeniz için ödeme kuruluşuyla ve yasal zorunluluk halinde yetkili kurumlarla paylaşılır.</p>
<h2>Güvenlik</h2>
<p>Sitemiz baştan sona SSL (HTTPS) ile şifrelenir. Sepetiniz yalnızca kendi cihazınızda saklanır.</p>
<h2>Çocukların gizliliği</h2>
<p>Sitemiz alışverişi yapan yetişkinlere yöneliktir; çocuklardan bilgi toplamayız.</p>
<p>Daha ayrıntılı bilgi için <a href="/yasal/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a>’ni inceleyebilirsiniz.</p>`,
  },
  {
    slug: 'cerez-politikasi',
    title: 'Çerez Politikası',
    short: 'Çerez Politikası',
    summary: 'Hangi çerezleri, neden kullanıyoruz?',
    html: `
<p>Çerezler ve benzeri teknolojiler (ör. tarayıcının yerel depolama alanı), bir web sitesini ziyaret ettiğinizde cihazınızda saklanan küçük veri parçalarıdır.</p>
<h2>Kullandığımız çerezler</h2>
<table>
  <thead><tr><th>Ad</th><th>Tür</th><th>Amaç</th><th>Süre</th></tr></thead>
  <tbody>
    <tr><td>pk-cart-v1</td><td>Zorunlu (yerel depolama)</td><td>Sepetinizdeki ürünleri hatırlamak</td><td>Siz silene kadar</td></tr>
    <tr><td>pk-cookie-ok</td><td>Zorunlu (yerel depolama)</td><td>Bu bildirimi gördüğünüzü hatırlamak</td><td>Siz silene kadar</td></tr>
    <tr><td>pk-checkout-draft</td><td>Zorunlu (oturum)</td><td>Ödeme formuna yazdıklarınızın kaybolmaması</td><td>Sekme kapanana kadar</td></tr>
    <tr><td>pk-primo-*</td><td>Tercih (yerel/oturum)</td><td>Stil asistanı Primo’nun ipuçlarını çok sık göstermemek</td><td>Oturum / siz silene kadar</td></tr>
  </tbody>
</table>
<p><strong>Reklam, profilleme veya üçüncü taraf takip çerezi kullanmıyoruz.</strong> İleride ziyaret istatistikleri için bir analiz aracı eklenirse, bu araç yalnızca açık onayınızla çalıştırılacak ve bu tablo güncellenecektir.</p>
<h2>Çerezleri nasıl silerim?</h2>
<p>Tarayıcınızın ayarlarından “site verilerini temizle” seçeneğiyle tüm kayıtları silebilirsiniz. Bu durumda sepetiniz de boşalır.</p>`,
  },
  {
    slug: 'guvenli-alisveris',
    title: 'Güvenli Alışveriş',
    short: 'Güvenli Alışveriş',
    summary: 'Ödemeniz nasıl korunuyor?',
    html: `
<h2>3D Secure ile ödeme</h2>
<p>Kartlı ödemelerde bankanızın gönderdiği tek kullanımlık SMS şifresiyle doğrulama yapılır. Bu şifre olmadan kartınızla işlem yapılamaz.</p>
<h2>Kart bilgisi saklamıyoruz</h2>
<p>Kart numaranız, son kullanma tarihiniz ve CVV kodunuz yalnızca lisanslı ödeme kuruluşunun PCI-DSS sertifikalı güvenli sayfasına girilir. ${site.name} bu bilgileri görmez, kaydetmez.</p>
<h2>SSL şifreleme</h2>
<p>Sitemizdeki tüm sayfalar 256-bit SSL sertifikasıyla şifrelenir. Adres çubuğundaki kilit simgesini görerek kontrol edebilirsiniz.</p>
<h2>Havale / EFT</h2>
<p>Havale/EFT ile ödemede yalnızca sipariş onay sayfasında ve sipariş mesajında gösterilen, <strong>${c.title}</strong> adına kayıtlı hesaba ödeme yapınız. Ekibimiz sizden asla telefonla kart şifresi veya SMS kodu istemez.</p>
<h2>Şüpheli bir durum mu var?</h2>
<p>Bize hemen <a href="mailto:${site.contact.email}">${site.contact.email}</a> adresinden veya WhatsApp hattımızdan ulaşın.</p>`,
  },
  {
    slug: 'kullanim-kosullari',
    title: 'Kullanım Koşulları',
    short: 'Kullanım Koşulları',
    summary: 'Sitemizi kullanırken geçerli kurallar.',
    html: `
<p>${site.name} internet sitesini ziyaret eden herkes aşağıdaki koşulları kabul etmiş sayılır.</p>
<ul>
  <li>Sitedeki tüm görseller, metinler, logo ve tasarımlar ${site.name}’e aittir; izinsiz kopyalanamaz ve ticari amaçla kullanılamaz.</li>
  <li>Ürün fiyatları ve stok bilgileri önceden haber verilmeksizin güncellenebilir. Onaylanmış siparişlerde sipariş anındaki fiyat geçerlidir.</li>
  <li>Açık bir yazım veya sistem hatası nedeniyle yanlış fiyatla verilen siparişlerde, Alıcı bilgilendirilerek sipariş iptal edilir ve ödenen tutar eksiksiz iade edilir.</li>
  <li>Siteyi kötüye kullanmaya, güvenliğini tehlikeye atmaya yönelik girişimler yasaktır.</li>
  <li>Bu koşullar Türkiye Cumhuriyeti kanunlarına tabidir.</li>
</ul>`,
  },
]

export const getLegalDoc = (slug: string) => legalDocs.find((d) => d.slug === slug)
