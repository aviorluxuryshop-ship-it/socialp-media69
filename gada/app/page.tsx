import Effects from '@/components/Effects'
import Header from '@/components/Header'
import Stage from '@/components/Stage'
import About from '@/components/sections/About'
import Contact from '@/components/sections/Contact'
import Design from '@/components/sections/Design'
import Footer from '@/components/sections/Footer'
import Hero from '@/components/sections/Hero'
import Ingredients from '@/components/sections/Ingredients'
import Origin from '@/components/sections/Origin'
import ProductIntro from '@/components/sections/ProductIntro'
import Story from '@/components/sections/Story'
import { products } from '@/content/site'

export default function Page() {
  const [peach, lemon] = products
  return (
    <>
      <Header />
      <Stage />
      <main>
        <Hero />
        <About />

        <ProductIntro product={peach} id="urunler" keyName="peach" side="right" eyebrow="03 — Ürünler · Ürün 01" />
        <Story product={peach} id="hikaye" keyName="peachStory" side="left" no="04" />
        <Ingredients product={peach} id="icerik" keyName="peachIngredients" side="left" no="05" />
        <Design product={peach} id="tasarim" keyPrefix="peachDesign" side="left" />

        <ProductIntro product={lemon} id="limon" keyName="lemon" side="left" eyebrow="Ürünler · Ürün 02" />
        <Story product={lemon} id="hikaye-limon" keyName="lemonStory" side="right" no="04" />
        <Ingredients product={lemon} id="icerik-limon" keyName="lemonIngredients" side="right" no="05" />
        <Design product={lemon} id="tasarim-limon" keyPrefix="lemonDesign" side="right" />

        <Origin />
        <Contact />
      </main>
      <Footer />
      <Effects />
    </>
  )
}
