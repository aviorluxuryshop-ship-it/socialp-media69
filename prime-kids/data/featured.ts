/**
 * Ana sayfadaki "Öne çıkanlar" kayan vitrini.
 *
 * Hangi ürünün hangi etiketle, hangi renk fotoğrafıyla görüneceğini buradan
 * seçin. Örneğin Trendyol panelinizde en çok sepete eklenen ürün hangisiyse
 * "En Çok Sepete Eklenen" etiketini ona verin. Sıra, vitrindeki sıradır.
 *
 * slug  → data/products.ts içindeki ürünün adresi
 * color → o ürünün renk kimliği (fotoğraf bu renkten gelir)
 * icon  → bag (sepet) · trophy (kupa) · snow (kar tanesi) · heart (kalp) · sparkle (yıldız)
 */
export type FeaturedIcon = 'bag' | 'trophy' | 'snow' | 'heart' | 'sparkle'

export interface FeaturedSlide {
  slug: string
  color: string
  label: string
  icon: FeaturedIcon
}

export const featured: FeaturedSlide[] = [
  { slug: 'legend-kargo-takim', color: 'zumrut', label: 'En Çok Sepete Eklenen', icon: 'bag' },
  { slug: 'perfect-denim-seritli-takim', color: 'ekru', label: 'Sezonun En İyisi', icon: 'trophy' },
  { slug: 'vintage-vibes-takim', color: 'kahve', label: 'Kışın En İyisi', icon: 'snow' },
  { slug: 'mini-inek-takim', color: 'kahve', label: 'Miniklerin Favorisi', icon: 'heart' },
  { slug: 'star-girl-denim-takim', color: 'mavi', label: 'Yeni Gelen', icon: 'sparkle' },
]
