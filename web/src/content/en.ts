import { site } from './site';
import type { Dict } from './tr';

/**
 * English copy, mirroring the Turkish dictionary. Service, about and testimonial
 * text follows the English version published on socialpmedia.com.
 */
export const en: Dict = {
  locale: 'tr' as const, // overwritten by the loader; shape only
  htmlLang: 'en',
  dir: 'ltr',

  meta: {
    title: 'Socialp Media — Video Production, Content & Social Media Agency',
    description:
      'From the shoot to the edit, from social media management to Meta & Google advertising, we run your brand’s entire digital production in one place. Istanbul-based content and social media agency.',
  },

  nav: {
    home: 'Home',
    services: 'Services',
    work: 'Work',
    about: 'About',
    contact: 'Contact',
    menu: 'Menu',
    close: 'Close',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    skipToContent: 'Skip to content',
  },

  langSwitch: {
    label: 'Language',
    tr: 'Türkçe',
    en: 'English',
  },

  hero: {
    eyebrow: 'Different ideas · Original content',
    lines: ['We shoot.', 'We cut.', 'We grow brands.'],
    lead:
      'From behind the camera to campaign management, we run your brand’s entire digital production under one roof.',
    primaryCta: 'Start a project',
    secondaryCta: 'See our work',
    scroll: 'Scroll',
  },

  strip: {
    label: 'From the Socialp Media world',
  },

  manifesto: {
    kicker: '(01) Approach',
    heading: 'Good content is planned, not accidental.',
    body: [
      'We accompany hundreds of brands on their growth journey with the digital solutions we offer. We professionally manage every process, from social media management to content production.',
      'Every brand has a different audience and a different voice. We plan the whole process — from pre-production to what happens after publishing — and build sustainable social media management around content made for your brand.',
    ],
    facts: [
      { value: '2021', label: 'Founded' },
      { value: '100+', label: 'Brand collaborations' },
      { value: 'Istanbul', label: 'Based in' },
    ],
  },

  services: {
    kicker: '(02) Services',
    heading: 'End-to-end digital production.',
    lead:
      'One team from idea to publishing. Build a consistent brand voice without juggling separate suppliers.',
    detailCta: 'View details',
    listCta: 'Enquire',
    items: [
      {
        no: '01',
        title: 'Video Production',
        desc: 'Professional video production for brands, products, venues and campaigns — concept, lighting, camera and direction included.',
        long:
          'Professional shoots that tell your brand’s story properly, turning ideas into strong, arresting visuals.',
        image: 'showroom-otomotiv',
      },
      {
        no: '02',
        title: 'Photography',
        desc: 'Product, business, venue and campaign photography. Frames ready for social media and advertising.',
        long:
          'Photography that carries your brand identity, putting your products and services forward with a confident visual language.',
        image: 'guzellik-merkezi',
      },
      {
        no: '03',
        title: 'Video Editing',
        desc: 'Editing and post-production optimised for Reels, short-form video and advertising formats.',
        long:
          'We turn your footage into sharp, fluid content, delivering the message at the right pace and in the right visual language.',
        image: 'roportaj-stüdyo',
      },
      {
        no: '04',
        title: 'Social Media Management',
        desc: 'Content planning, publishing, account management, community engagement and performance analysis.',
        long:
          'We run your brand’s presence in the digital world end to end, building a real connection with your audience through content and strategy.',
        image: 'ekip-salon',
        href: 'social-media-management',
      },
      {
        no: '05',
        title: 'Post & Story',
        desc: 'Post and story content designed for your brand. A consistent visual language and a steady feed.',
        long:
          'Regular, arresting post and story content built around your social identity, so the profile reads as one coherent whole.',
        image: 'instagram-tepsi',
      },
      {
        no: '06',
        title: 'Meta & Google Ads',
        desc: 'Audience analysis, campaign setup, continuous optimisation and transparent performance reporting.',
        long:
          'We plan Meta and Google campaigns around the right audience, growing your digital reach while spending the budget efficiently.',
        image: 'meta-tepsi',
        href: 'meta-google-ads',
      },
      {
        no: '07',
        title: 'Web Design',
        desc: 'Modern, mobile-friendly, fast-loading websites with SEO foundations, plus digital solutions.',
        image: 'bilboard-mockup',
        href: 'web-design-setup',
      },
    ],
  },

  process: {
    kicker: '(03) Process',
    heading: 'One flow, from idea to growth.',
    lead:
      'We handle every step from pre-production to post-publishing, so the coordination load never lands on you.',
    steps: [
      { no: '01', title: 'Idea', desc: 'Brand, sector and audience analysis. Concept and content strategy.' },
      { no: '02', title: 'Shoot', desc: 'Video and photo production with a professional crew, lighting and gear.' },
      { no: '03', title: 'Edit', desc: 'Platform-specific editing, colour, sound and design. Ready to publish.' },
      { no: '04', title: 'Publish', desc: 'Content calendar, publishing management and community engagement.' },
      { no: '05', title: 'Grow', desc: 'Campaign management, optimisation and transparent performance reporting.' },
    ],
  },

  work: {
    kicker: '(04) Work',
    heading: 'Behind the camera, and what comes out.',
    lead: 'A selection of the content and production work we have made for brands across different sectors.',
    filters: {
      all: 'All',
      video: 'Video Production',
      photo: 'Photography',
      brand: 'Brand Content',
      social: 'Social Media Content',
    },
    alts: {
      'showroom-otomotiv': 'Automotive showroom commercial shoot: camera on a gimbal with softbox lighting',
      'mekan-video-kurulum': 'Venue promo video shoot: camera and monitor setup',
      'konsept-editorial': 'Black and white concept video shoot',
      'kafe-tanitim': 'Cafe promotional video shoot',
      'roportaj-stüdyo': 'Interview shoot setup in the studio',
      'icerik-hazir': 'Behind the scenes: getting ready for a new content shoot',
      'guzellik-merkezi': 'Beauty centre social media shoot',
      'restoran-masa': 'Restaurant menu and venue shoot',
      'studyo-sanat': 'Studio shoot: lighting setup and set',
      'kamera-detay': 'Checking the frame on the camera screen during a shoot',
      'mekan-isik': 'Professional lighting setup for a venue shoot',
      'telefon-tepsi': 'Socialp Media brand content: social media content on a silver tray',
      'meta-tepsi': 'Socialp Media brand content: Meta advertising management visual',
      'instagram-tepsi': 'Socialp Media brand content: Instagram management visual',
      'bilboard-mockup': 'Digital advertising and web work visual',
      'sokak-tabela': 'Socialp Media brand content: model holding a sign in the street',
      'fon-perde': 'Outdoor shooting backdrop: “Social media needs us!”',
      'nail-dergi': 'Concept social media shoot for a nail studio',
      'gazete-siyahbeyaz': 'Black and white editorial brand shoot',
      'cekim-mavi': 'Behind the scenes: venue shoot',
      'cekim-kamera': 'Behind the scenes: shooting content on camera',
      'cekim-studyo': 'Behind the scenes: studio content shoot',
      'ekip-salon': 'The Socialp Media team shooting content inside a business',
      'ofis-tabela': 'Socialp Media office signage',
      'ekip-beyaz': 'Socialp Media team shirt: different ideas, original content',
      'ekip-siyah': 'Socialp Media team shirt: different ideas, original content',
      'sektor-guzellik': 'Cosmetics product photography',
      'sektor-portre': 'Beauty sector portrait photography',
      'sektor-restoran': 'Restaurant and cafe venue visual',
      'sektor-egitim': 'Visual for education institutions',
      'sektor-insaat': 'Visual for the construction sector',
      'sektor-kurumsal': 'Visual for corporate companies',
    },
  },

  social: {
    kicker: '(05) Social Media Management',
    heading: 'We don’t just run your account — we position your brand.',
    body:
      'We professionally manage your brand’s identity in the digital world. We build content strategies suited to your audience, produce original photo and video shoots, prepare creative designs and plan content on a steady schedule.',
    points: [
      'Content planning and content calendar',
      'Post and story design',
      'Publishing and account management',
      'Community engagement and message handling',
      'Consistent visual language and brand communication',
      'Performance analysis and reporting',
    ],
    cta: 'Social media management',
  },

  ads: {
    kicker: '(06) Advertising',
    heading: 'The right people, at the right budget.',
    body:
      'We set up your campaigns across Meta and Google, optimise them continuously, and share the results in transparent reports.',
    items: [
      {
        title: 'Audience Analysis',
        desc: 'We identify the right audience for your brand and reach potential customers through age, interest, location and behaviour analysis.',
      },
      {
        title: 'Campaign Strategy',
        desc: 'We build campaigns around your business goals — brand awareness, engagement, website traffic or sales-focused advertising plans.',
      },
      {
        title: 'Continuous Optimisation',
        desc: 'We analyse live campaigns regularly and optimise targeting, creative and budget to improve performance.',
      },
      {
        title: 'Performance Reporting',
        desc: 'We track results in detailed reports and share reach, clicks, conversions and return on investment transparently.',
      },
    ],
    platforms: ['Meta Ads', 'Instagram', 'Facebook', 'Google Ads'],
    cta: 'Advertising management',
  },

  testimonials: {
    kicker: '(07) Testimonials',
    heading: 'From our customers.',
    attribution: 'From our customers',
    items: [
      'An agency with such a strong command of the sector, handling social media management stitch by stitch. It made its difference clear in a very short time. You could call it the Socialp Media difference!',
      'If you want to be visible in the digital world, if you want your name and your brand to be known, you have to move correctly. Socialp Media is definitely the first step of that move. A team you should get to know and work with.',
      'We had a fantastic rapport with the team during the commercial shoot. They were professional, energetic and very attentive. It was genuinely a pleasure to work together.',
    ],
  },

  about: {
    kicker: '(08) About',
    heading: 'We produce for your brand.',
    body: [
      `Founded in ${site.founded}, our agency set out to help brands build a strong, sustainable and compelling presence in the digital world. Since day one we have collaborated with hundreds of brands across different sectors, developing a tailored strategy for each of them.`,
      'We offer end-to-end services in social media management, content production and digital strategy, making sure brands are not only visible but actually reach and engage the right audience. We believe every brand has its own language, and we produce original, effective content accordingly.',
      'We approach every project with the same care and professionalism, aiming to take your brand one step ahead in the digital world.',
    ],
    signature: 'Different ideas, original content.',
    parts: [
      { label: 'Lens', title: 'Perspective', text: 'Our creative eye gives every project a perspective of its own.' },
      { label: 'Body', title: 'Production', text: 'Professional gear and field experience carry a brand’s story into the visual world.' },
      { label: 'Screen', title: 'Strategy', text: 'We don’t just make content — we plan and manage it with a strategy behind it.' },
      { label: 'Microphone', title: 'Voice', text: 'We carry your brand’s voice to the right audience, in the right language.' },
      { label: 'Core', title: 'Consistency', text: 'At the centre of every project sits production energy and a sustainable working discipline.' },
    ],
  },

  contact: {
    kicker: '(09) Contact',
    heading: 'Make a strong appearance in digital.',
    lead: 'Reach us directly to talk about your project — phone, WhatsApp or email, whichever is easiest.',
    trTitle: 'Türkiye',
    intlTitle: 'USA · Canada · UK · Australia · Germany',
    phoneLabel: 'Phone',
    whatsappLabel: 'WhatsApp',
    emailLabel: 'Email',
    addressLabel: 'Address',
    instagramLabel: 'Instagram',
  },

  footer: {
    tagline: 'Different ideas, original content.',
    rights: 'All rights reserved.',
    backToTop: 'Back to top',
  },

  serviceDetail: {
    backToHome: 'Back to home',
    otherServices: 'Other services',
    ctaHeading: 'Let’s talk about this service.',
  },
};
