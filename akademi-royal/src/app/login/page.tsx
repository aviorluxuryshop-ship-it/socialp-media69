import Image from 'next/image';
import { LoginForm } from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-mist)] px-4">
      <div className="w-full max-w-sm rounded-xl bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="mb-4 rounded-md bg-white p-2">
          <Image src="/logo.png" alt="Akademi Royal" width={1372} height={458} className="h-auto w-full" priority />
        </div>
        <p className="text-sm text-[var(--color-royal-dim)]">Yönetim Paneli — Giriş</p>
        <LoginForm next={next ?? '/dashboard'} />
      </div>
    </main>
  );
}
