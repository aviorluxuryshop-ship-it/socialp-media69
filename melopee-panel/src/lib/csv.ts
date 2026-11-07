// Excel'in Türkçe ayarlarıyla doğrudan açılan CSV (noktalı virgül ayraç, UTF-8 BOM).

type Cell = string | number | null | undefined;

function esc(v: Cell): string {
  const s = v === null || v === undefined ? "" : typeof v === "number" ? String(v).replace(".", ",") : v;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return "﻿" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
}

export function download(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
