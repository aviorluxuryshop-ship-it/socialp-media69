import { LoginForm } from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-mist)] px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--color-royal)]">Akademi Royal</h1>
        <p className="text-sm text-[var(--color-royal-dim)]">Yönetim Paneli — Giriş</p>
        <LoginForm next={next ?? '/dashboard'} />
      </div>
    </main>
  );
}
