# Gerçek ürün görselleri buraya

Bu klasöre aşağıdaki 4 dosyayı ekleyin (GAZA kutusunun önden/arkadan/sağdan/soldan referans fotoğrafları):

- `onden.jpg`
- `arkadan.jpg`
- `sagdan.jpg`
- `soldan.jpg`

Dosyalar buraya eklenir eklenmez `src/lib/canLabelTexture.ts` otomatik olarak
bunları kullanmaya başlar ve şu anki yer tutucu (placeholder) etiket yerine
gerçek ambalaj görselini 3D kutunun üzerine sarar. Kod tarafında hiçbir
değişiklik gerekmez.
