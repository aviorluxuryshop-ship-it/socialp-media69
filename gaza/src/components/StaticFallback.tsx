/**
 * Shown instead of the WebGL canvas when the browser can't run it. Keeps the
 * brand and the core message intact — no dead 3D area, no error message.
 */
export function StaticFallback() {
  return (
    <div className="fixed inset-0 -z-10 bg-fade-void">
      {/* framed high, like the 3D hero, so the page title underneath stays clear */}
      <div className="flex h-full justify-center pt-[13svh]">
        <div className="relative flex h-[40svh] w-[23svh] flex-col items-center justify-center rounded-[2rem] bg-gradient-to-b from-gaza-400 via-gaza-500 to-gaza-700 shadow-2xl">
          <div className="absolute inset-x-6 top-6 h-3 rounded-full bg-black/15" />
          <span className="font-display text-4xl font-black tracking-wide text-cream">GAZA</span>
          <span className="mt-2 px-6 text-center text-xs font-medium uppercase tracking-wide3 text-cream/85">
            Portakallı ve Çay Aromalı İçecek
          </span>
          <span className="mt-4 rounded-full bg-black/70 px-4 py-1.5 text-xs font-semibold text-cream">330 ml</span>
          <div className="absolute inset-x-8 bottom-6 h-2 rounded-full bg-black/15" />
        </div>
      </div>
    </div>
  )
}
