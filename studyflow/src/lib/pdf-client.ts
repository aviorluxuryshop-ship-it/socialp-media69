"use client";
// Tarayıcıda PDF metin çıkarımı ve sayfa görüntüleme (dosya sunucuya gönderilmeden).

type PdfLib = typeof import("pdfjs-dist");
let libP: Promise<PdfLib> | null = null;
async function lib(): Promise<PdfLib> {
  libP ??= import("pdfjs-dist").then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    return m;
  });
  return libP;
}

export const MAX_EXTRACT_PAGES = 150;

export interface Extraction {
  pageCount: number;
  pages: { n: number; text: string }[];
  truncated: boolean;
}

export async function extractPdf(file: File, onProgress?: (done: number, total: number) => void): Promise<Extraction> {
  const pdfjs = await lib();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const total = doc.numPages;
  const limit = Math.min(total, MAX_EXTRACT_PAGES);
  const pages: { n: number; text: string }[] = [];
  for (let n = 1; n <= limit; n++) {
    const page = await doc.getPage(n);
    const tc = await page.getTextContent();
    const text = tc.items
      .map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : "") : ""))
      .join("")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    pages.push({ n, text });
    onProgress?.(n, limit);
    page.cleanup();
  }
  void task.destroy();
  return { pageCount: total, pages, truncated: total > limit };
}

/** Seçili sayfaları JPEG'e çevirir (taranmış PDF'ler için OCR girdisi). */
export async function renderPdfPages(file: File, pageNumbers: number[], maxDim = 1500): Promise<{ n: number; mime: "image/jpeg"; data: string }[]> {
  const pdfjs = await lib();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const out: { n: number; mime: "image/jpeg"; data: string }[] = [];
  for (const n of pageNumbers) {
    const page = await doc.getPage(n);
    const v1 = page.getViewport({ scale: 1 });
    const scale = Math.min(2, maxDim / Math.max(v1.width, v1.height));
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(vp.width);
    canvas.height = Math.ceil(vp.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    await page.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
    out.push({ n, mime: "image/jpeg", data: canvas.toDataURL("image/jpeg", 0.82).split(",")[1] });
    page.cleanup();
  }
  void task.destroy();
  return out;
}

/** Fotoğrafı küçültüp JPEG'e çevirir (OCR için). */
export async function imageToJpeg(file: Blob, maxDim = 1600): Promise<{ mime: "image/jpeg"; data: string }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return { mime: "image/jpeg", data: canvas.toDataURL("image/jpeg", 0.85).split(",")[1] };
}
