# Test görüntüleri (yalnızca testlerde kullanılır)

Bu klasör **uygulamayla birlikte yayımlanmaz** (`public/` altında değil); yalnızca `scripts/e2e-tests/video-analysis.mjs`
tarafından, MediaPipe motorunu gerçek bir görüntüde sınamak için kullanılır.

## pose.jpg

- **Kaynak:** `https://storage.googleapis.com/mediapipe-assets/pose.jpg` (MediaPipe'ın kendi test/örnek varlıklar deposu)
- **İndirilme tarihi:** 2026-10-17 (curl ile, doğrudan yukarıdaki adresten)
- **Boyut / SHA-256:** 1000×667 JPEG, 44 100 bayt · `c8a830ed683c0276d713dd5aeda28f415f10cd6291972084a40d0d8b934ed62b`
- **İçerik:** kumsalda "savaşçı II" yoga duruşunda tek bir kişi (futbol değil; hareketsiz).
- **Lisans notu (dürüstlük):** MediaPipe projesi ve bu depoda kullanılan modeller Apache-2.0 lisanslıdır. Bu tek fotoğrafın
  ayrıca yayımlanmış bir lisans metnini **bağımsız olarak doğrulayamadık**; görüntü bir stok fotoğrafa benziyor. Bu yüzden
  yalnızca küçük bir test girdisi olarak tutulur, arayüzde gösterilmez, çıktıya (`out/`) girmez ve başka bir amaçla
  yeniden dağıtılmamalıdır. Lisans konusunda emin olunamıyorsa dosya silinebilir; e2e testi bu durumda "atlandı" der.

Testteki video bu görüntüden `ffmpeg` ile üretilir (yavaş kaydırma + yakınlaştırma; kişi kadrajda birkaç piksel hareket eder).
Bu bir **gerçek futbol kaydı değildir**; olay tespitinin (vuruş, yön değiştirme…) doğruluğunu kanıtlamaz, yalnızca motorun
gerçek bir görüntüde iskelet bulup izlediğini ve çıktının makul aralıklarda kaldığını sınar.
