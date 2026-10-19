Libero — MediaPipe poz (iskelet) modelleri
==========================================

Bu klasördeki .task dosyaları, "otomatik video analizi" için tarayıcıda çalışan
MediaPipe Pose Landmarker modelleridir. Siteyle birlikte sunulur; çalışma sırasında
dış bir sunucudan (CDN) indirilmez ve video cihazdan çıkmaz.

Dosyalar
--------
pose_landmarker_lite.task   (5 777 746 bayt)  hızlı, varsayılan
  Kaynak : https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
  SHA-256: 59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a

pose_landmarker_full.task   (9 398 198 bayt)  daha doğru, daha yavaş
  Kaynak : https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task
  SHA-256: 5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1

İndirme tarihi: 2026-10-16 (curl ile, yukarıdaki resmî Google depolama adreslerinden)

Lisans
------
Apache License 2.0 — https://www.apache.org/licenses/LICENSE-2.0
Telif: Google LLC / MediaPipe katkıcıları.
Model kartı: https://storage.googleapis.com/mediapipe-assets/Model%20Card%20BlazePose%20GHUM%203D.pdf
MediaPipe Pose Landmarker belgeleri: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker

Bu dosyalar değiştirilmemiştir. Çalışma zamanı kütüphanesi (@mediapipe/tasks-vision, Apache-2.0)
npm paketinden gelir; WebAssembly dosyaları scripts/prepare-assets.mjs ile public/mediapipe/wasm/
altına kopyalanır (depoya eklenmez).

Doğrulama
---------
  sha256sum public/models/*.task
çıktısı yukarıdaki değerlerle eşleşmelidir.

Not: Model, 2B görüntüden 33 eklem noktası ve yaklaşık 3B "dünya" koordinatları tahmin eder.
Doğruluğu çekim koşullarına (oyuncu boyutu, ışık, örtüşme, kamera hareketi) bağlıdır; hiçbir
tahmin klinik ya da biyomekanik ölçüm yerine geçmez.
