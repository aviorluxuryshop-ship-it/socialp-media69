# Gerçek ürün görselleri buraya

GAZA kutusunun 4 referans fotoğrafını bu klasöre şu adlarla ekleyin:

- `onden.jpg` — önden
- `sagdan.jpg` — sağdan (öne bakarken sağ taraf)
- `arkadan.jpg` — arkadan
- `soldan.jpg` — soldan

Her fotoğraf düz karşıdan çekilmiş olmalı ve kutunun sağ–sol kenarlarından,
üst jant ile alt taban hizasından sıkıca kırpılmalı.

Dördü de bulunduğunda `src/lib/canLabelTexture.ts` bunları otomatik olarak
3D kutunun etiketine sarar (yer tutucu etiketin yerine geçer). Kod değişikliği gerekmez.
