// YouTube sayfa verisinden doğrulanabilir video künyesi çıkarır (API anahtarı gerekmez).
export async function fetchVideoMeta(id, tries = 3) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) StudyFlowVerifier", "Accept-Language": "tr-TR,tr;q=0.9" }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error("http " + r.status);
      const html = await r.text();
      const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});\s*(?:var |<\/script>)/);
      if (!m) throw new Error("no player response");
      const d = JSON.parse(m[1]);
      const vd = d.videoDetails ?? {};
      const mf = d.microformat?.playerMicroformatRenderer ?? {};
      const ok = d.playabilityStatus?.status === "OK";
      return {
        id,
        ok,
        status: d.playabilityStatus?.status ?? "?",
        embeddable: Boolean(d.playabilityStatus?.playableInEmbed),
        title: vd.title ?? "",
        author: vd.author ?? "",
        channelId: vd.channelId ?? "",
        lengthSeconds: Number(vd.lengthSeconds ?? 0),
        views: Number(vd.viewCount ?? 0),
        live: Boolean(vd.isLiveContent) || Boolean(vd.isLive),
        familySafe: mf.isFamilySafe !== false,
        unlisted: Boolean(mf.isUnlisted),
        published: (mf.publishDate ?? "").slice(0, 10),
        description: (vd.shortDescription ?? "").slice(0, 600),
        lang: mf.defaultAudioLanguage ?? d.captions?.playerCaptionsTracklistRenderer?.captionTracks?.[0]?.languageCode ?? null,
        hasCaptions: Boolean(d.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length),
      };
    } catch (e) {
      if (i === tries - 1) return { id, ok: false, status: "error:" + e.message };
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
}

export async function oembed(id) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return { ok: false, status: r.status };
    const j = await r.json();
    return { ok: true, title: j.title, author: j.author_name, thumbnail: j.thumbnail_url };
  } catch {
    return { ok: false, status: "error" };
  }
}

export async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}
