import { COMMON, FLAVOR_ORDER, PRODUCTS } from '@/content/products'

/**
 * Shown instead of the WebGL canvas when the browser can't run it. Keeps the
 * brand and the core message intact — no dead 3D area, no error message.
 * Not interactive (no flavor switch): the picker's whole point is to show
 * the change on the can, which doesn't exist here.
 */
export function StaticFallback() {
  const product = PRODUCTS[FLAVOR_ORDER[0]]

  return (
    <div className="fixed inset-0 -z-10 bg-fade-void">
      {/* framed high, like the 3D hero, so the page title underneath stays clear */}
      <div className="flex h-full justify-center pt-[13svh]">
        <div
          className="relative flex h-[40svh] w-[23svh] flex-col items-center justify-center rounded-[2rem] shadow-2xl"
          style={{ background: `linear-gradient(180deg, ${product.colors.can}, ${product.colors.deep})` }}
        >
          <div className="absolute inset-x-6 top-6 h-3 rounded-full bg-black/15" />
          <span className="font-display text-4xl font-black tracking-wide text-void">{COMMON.brand}</span>
          <span className="mt-2 px-6 text-center text-xs font-medium uppercase tracking-wide3 text-void/75">{product.name}</span>
          <span className="mt-4 rounded-full bg-black/70 px-4 py-1.5 text-xs font-semibold text-cream">{product.volume}</span>
          <div className="absolute inset-x-8 bottom-6 h-2 rounded-full bg-black/15" />
        </div>
      </div>
    </div>
  )
}
