"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { site } from "@/data/site";
import { waLink } from "@/lib/site-helpers";

const topics = [
  { id: "genel", label: "Genel soru" },
  { id: "beden", label: "Beden danışmanlığı" },
  { id: "siparis", label: "Siparişim hakkında" },
  { id: "iade", label: "İade / değişim" },
  { id: "toplu-siparis", label: "Toplu / kurumsal sipariş" },
];

/**
 * Sunucuya veri göndermez: mesajı kullanıcının kendi WhatsApp ya da e-posta uygulamasında
 * hazır hale getirir. Gönderimi kullanıcı tamamlar; bu yüzden "gönderildi" mesajı gösterilmez.
 */
export default function ContactForm() {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("genel");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("konu");
    if (k && topics.some((t) => t.id === k)) setTopic(k);
  }, []);

  const errors = {
    name: name.trim().length < 2 ? "Adınızı yazın." : "",
    message: message.trim().length < 10 ? "Mesajınızı birkaç kelimeyle yazın." : "",
  };
  const valid = !errors.name && !errors.message;
  const topicLabel = topics.find((t) => t.id === topic)?.label ?? "";
  const text = `Merhaba, ben ${name.trim()}.\nKonu: ${topicLabel}\n\n${message.trim()}`;

  function send(channel: "whatsapp" | "email") {
    setTried(true);
    if (!valid) {
      document.getElementById(errors.name ? "iletisim-ad" : "iletisim-mesaj")?.focus();
      return;
    }
    if (channel === "whatsapp") window.open(waLink(text), "_blank", "noopener");
    else window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent(`${topicLabel} — ${name.trim()}`)}&body=${encodeURIComponent(text)}`;
  }

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); send("whatsapp"); }} className="card p-6 sm:p-8">
      <h2 className="font-display text-[21px] font-bold">Bize yazın</h2>
      <p className="mt-2 text-[14.5px] leading-relaxed text-mute">
        Bu form mesajınızı WhatsApp ya da e-posta uygulamanızda hazırlar; göndermek için açılan uygulamada “Gönder”e basmanız yeterli.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="iletisim-ad" className="label">Adınız</label>
          <input id="iletisim-ad" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
            aria-invalid={tried && !!errors.name} aria-describedby={tried && errors.name ? "iletisim-ad-hata" : undefined} />
          {tried && errors.name && <p id="iletisim-ad-hata" className="mt-1.5 text-[13px] text-alert">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="iletisim-konu" className="label">Konu</label>
          <select id="iletisim-konu" className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="iletisim-mesaj" className="label">Mesajınız</label>
          <textarea id="iletisim-mesaj" rows={5} className="input" value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder={topic === "siparis" || topic === "iade" ? "Sipariş numaranızı da yazarsanız daha hızlı yardımcı olabiliriz." : undefined}
            aria-invalid={tried && !!errors.message} aria-describedby={tried && errors.message ? "iletisim-mesaj-hata" : undefined} />
          {tried && errors.message && <p id="iletisim-mesaj-hata" className="mt-1.5 text-[13px] text-alert">{errors.message}</p>}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn-primary"><Icon name="whatsapp" /> WhatsApp ile gönder</button>
        <button type="button" onClick={() => send("email")} className="btn-outline"><Icon name="mail" /> E-posta ile gönder</button>
      </div>
    </form>
  );
}
