"use client";

import { motion } from "framer-motion";

const N = 10;

/** Tıklanan noktada kısa neon patlama. Ebeveyn `relative` olmalı. */
export function Burst({ color = "#00ff66", radius = 26 }: { color?: string; radius?: number }) {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <motion.span
        className="absolute rounded-full"
        style={{ width: 8, height: 8, border: `2px solid ${color}`, boxShadow: `0 0 12px ${color}` }}
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: radius / 4, opacity: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
      {Array.from({ length: N }, (_, i) => {
        const a = (i / N) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ width: 4, height: 4, background: color, boxShadow: `0 0 8px ${color}` }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * radius, y: Math.sin(a) * radius, opacity: 0, scale: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}
