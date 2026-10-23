"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Notice, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function AuthCallback() {
  const auth = useAuth();
  const router = useRouter();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (auth.status === "signed-in") router.replace("/");
  }, [auth.status, router]);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-5 pt-10 text-center">
      {!slow ? (
        <p className="inline-flex items-center gap-2 text-ink-2">
          <Spinner /> Giriş tamamlanıyor…
        </p>
      ) : (
        <Notice tone="warn" title="Giriş tamamlanamadı" action={<Link href="/giris" className="btn btn-secondary btn-sm">Tekrar dene</Link>}>
          Bağlantının süresi dolmuş veya bu tarayıcıda açılmamış olabilir.
        </Notice>
      )}
    </div>
  );
}
