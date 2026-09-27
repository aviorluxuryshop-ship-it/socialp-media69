import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Akademi Royal — Yönetim Paneli',
  description: 'Akademi Royal kurum içi eğitim akademisi yönetim sistemi',
};

const THEME_INIT_SCRIPT = `
try {
  var theme = localStorage.getItem('theme');
  if (theme === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
