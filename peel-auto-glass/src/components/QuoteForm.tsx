"use client";

import { Mail, MessageSquare, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { quoteServices, site } from "@/data/site";

const field =
  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/40";

export function QuoteForm() {
  const [sent, setSent] = useState(false);

  // No backend yet: the form opens the visitor's email app with the details filled in.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const get = (k: string) => String(d.get(k) ?? "").trim();
    const body = [
      `Name: ${get("name")}`,
      `Phone: ${get("phone")}`,
      `Vehicle: ${get("vehicle")}`,
      `Service: ${get("service")}`,
      "",
      get("details"),
    ].join("\n");
    const subject = `Quote request — ${get("service")} (${get("vehicle")})`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <section id="quote" className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-24">
      <div aria-hidden className="hero-glow absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-cyan">Free quote</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tell us about your windshield
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/75">
            Share your vehicle and what happened. A photo of the damage helps — you can send one when we reply.
          </p>
          <ul className="mt-8 space-y-4 font-semibold">
            <li>
              <a href={`tel:${site.phone.tel}`} className="inline-flex items-center gap-3 hover:text-brand-cyan">
                <Phone className="size-5 text-brand-red" aria-hidden /> {site.phone.display}
              </a>
            </li>
            <li>
              <a href={`sms:${site.phone.tel}`} className="inline-flex items-center gap-3 hover:text-brand-cyan">
                <MessageSquare className="size-5 text-brand-red" aria-hidden /> Text us
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-3 hover:text-brand-cyan">
                <Mail className="size-5 text-brand-red" aria-hidden /> {site.email}
              </a>
            </li>
          </ul>
          <p className="mt-6 text-sm text-white/60">{site.hours}</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Name
              <input name="name" required autoComplete="name" className={`${field} mt-1.5`} placeholder="Your name" />
            </label>
            <label className="block text-sm font-semibold">
              Phone
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                className={`${field} mt-1.5`}
                placeholder="(905) 000-0000"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Vehicle (year, make, model)
            <input name="vehicle" required className={`${field} mt-1.5`} placeholder="2021 Honda Civic" />
          </label>
          <label className="block text-sm font-semibold">
            What do you need?
            <select name="service" className={`${field} mt-1.5`} defaultValue={quoteServices[0]}>
              {quoteServices.map((s) => (
                <option key={s} value={s} className="text-navy-900">
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Details <span className="font-normal text-white/50">(optional)</span>
            <textarea
              name="details"
              rows={4}
              className={`${field} mt-1.5 resize-y`}
              placeholder="Where is the damage? Where is the vehicle parked?"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-brand-red px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-brand-red/30 transition hover:brightness-110"
          >
            Request my free quote
          </button>
          <p role="status" className="min-h-5 text-center text-sm text-white/70">
            {sent && "Your email app should open with your request ready to send. Prefer to talk? Give us a call."}
          </p>
        </form>
      </div>
    </section>
  );
}
