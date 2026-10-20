"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { cloudConfigured, signInWithGoogle, useCloud } from "@/lib/cloud";
import { sfx } from "@/lib/sound";
import { GoogleMark } from "./AccountCard";
import { useStore } from "@/lib/store";

export function Onboarding() {
  const finish = useStore((s) => s.finishOnboarding);
  const current = useStore((s) => s.profile.name);
  const cloud = useCloud((c) => c.status);
  const [name, setName] = useState(current === "Efehan" ? "" : current);

  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 py-10 safe-top">
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full"
        onSubmit={(e) => {
          e.preventDefault();
          sfx.welcome();
          finish(name);
        }}
      >
        <p className="eyebrow">Alp Book</p>
        <h1 className="h-title mt-3 text-[34px] leading-[1.1]">Günlerini kaydet,<br />düzenini gör.</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-mute">
          Her gün 14 rutinini tek bir tabloda işaretlersin. Kaydetmediğin bir alan başarısızlık sayılmaz; yalnızca girdiğin veriler hesaplanır.
        </p>

        <label className="eyebrow mt-9 block" htmlFor="name">Adın</label>
        <input id="name" className="input mt-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Efehan" maxLength={40} autoComplete="given-name" />

        <button className="btn btn-primary mt-5 w-full">
          Başla <ArrowRight size={16} />
        </button>
        {cloudConfigured && (
          <>
            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-faint"><span className="h-px flex-1 bg-line" />veya<span className="h-px flex-1 bg-line" /></div>
            <button type="button" className="btn btn-quiet w-full" disabled={cloud === "connecting" || cloud === "syncing"} onClick={() => void signInWithGoogle()}>
              <GoogleMark /> {cloud === "connecting" || cloud === "syncing" ? "Verilerin getiriliyor…" : "Google ile giriş yap"}
            </button>
            <p className="mt-2 text-center text-[12px] text-mute">Daha önce kayıt tuttuysan verilerin otomatik gelir.</p>
            {cloud === "error" && <CloudError />}
          </>
        )}
        <p className="mt-4 text-center text-xs text-faint">{cloudConfigured ? "Giriş yapmazsan veriler yalnızca bu cihazda saklanır." : "Veriler yalnızca bu cihazda saklanır. Ayarlar'dan yedek alabilirsin."}</p>
      </motion.form>
    </div>
  );
}

function CloudError() {
  const error = useCloud((c) => c.error);
  return <p role="alert" className="mt-3 text-center text-[13px] text-rose">{error}</p>;
}
