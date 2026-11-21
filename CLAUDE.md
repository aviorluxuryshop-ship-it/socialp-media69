# Site yapısı kuralı (bu depodaki tüm siteler için)

- **Ana sayfa (`index.html`) yalnızca ana sayfa içeriğini taşır:** hero, öne çıkan ürün/hizmetler ve kısa bir eylem çağrısı.
- **Ek içerikler ayrı HTML sayfalarında olur** (ör. hakkında, menü, galeri, yorumlar, iletişim). Bunlar ana sayfaya konmaz; ana sayfada yalnızca bu sayfalara bağlantı verilir.
- Üst menü ve alt bilgi her sayfada aynı olur; aktif sayfa `aria-current="page"` ile işaretlenir.
- Her ek sayfanın kendi `<title>`, `description`, `canonical` ve `og:` etiketleri olur; `sitemap.xml` güncel tutulur.
