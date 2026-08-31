import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/content/site';
import { getDict, isLocale } from '@/lib/dict';
import { Hero } from '@/components/sections/Hero';
import { Marks } from '@/components/sections/Marks';
import { Manifesto } from '@/components/sections/Manifesto';
import { Services } from '@/components/sections/Services';
import { Process } from '@/components/sections/Process';
import { Work } from '@/components/sections/Work';
import { SocialMgmt } from '@/components/sections/SocialMgmt';
import { Ads } from '@/components/sections/Ads';
import { Testimonials } from '@/components/sections/Testimonials';
import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typed = locale as Locale;
  const dict = getDict(typed);

  return (
    <div id="top">
      <Hero dict={dict} locale={typed} />
      <Marks dict={dict} />
      <Manifesto dict={dict} />
      <Services dict={dict} locale={typed} />
      <Process dict={dict} />
      <Work dict={dict} />
      <SocialMgmt dict={dict} locale={typed} />
      <Ads dict={dict} locale={typed} />
      <Testimonials dict={dict} />
      <About dict={dict} />
      <Contact dict={dict} />
    </div>
  );
}
