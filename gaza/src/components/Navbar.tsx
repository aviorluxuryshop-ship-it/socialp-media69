const LINKS = [
  { href: '#urun', label: 'Ürün' },
  { href: '#hikaye', label: 'Hikaye' },
  { href: '#icerik', label: 'İçerik' },
]

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30">
      <nav className="container flex items-center justify-between py-5 sm:py-6" aria-label="Ana menü">
        <a href="#top" className="font-display text-base font-extrabold tracking-wide3 text-cream sm:text-lg">
          GAZA
        </a>
        <ul className="flex gap-5 text-[10px] font-medium uppercase tracking-wide3 text-cream/70 sm:gap-8 sm:text-[11px]">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors duration-300 hover:text-gaza-300">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
