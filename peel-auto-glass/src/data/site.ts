import {
  BadgeCheck,
  Camera,
  CarFront,
  FileCheck2,
  Hammer,
  Truck,
  type LucideIcon,
} from "lucide-react";

/**
 * Everything business-specific lives in this file.
 *
 * ⚠ PLACEHOLDERS — replace before launch: phone, email, hours.
 * While the phone number is still the placeholder, the site tells search
 * engines not to index it (see `isPlaceholderContact` and app/layout.tsx).
 */
export const site = {
  name: "Peel Auto Glass",
  shortName: "Peel Auto Glass",
  tagline: "Windshield repair & replacement",
  description:
    "Windshield repair, replacement and ADAS camera calibration across Peel Region — Mississauga, Brampton and Caledon. Free quotes, mobile service and insurance claims handled.",
  region: "Peel Region, Ontario",
  phone: { display: "(905) 555-0100", tel: "+19055550100" },
  email: "info@example.com",
  hours: "Mon–Sat · 8 AM – 6 PM",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
} as const;

export const isPlaceholderContact = site.phone.tel.startsWith("+1905555");

export const nav = [
  { href: "#services", label: "Services" },
  { href: "#process", label: "How it works" },
  { href: "#area", label: "Service area" },
  { href: "#faq", label: "FAQ" },
] as const;

export type Service = { icon: LucideIcon; title: string; text: string };

export const services: Service[] = [
  {
    icon: CarFront,
    title: "Windshield replacement",
    text: "Cracked beyond repair? We fit quality glass and seal it properly so it's as strong as it should be.",
  },
  {
    icon: Hammer,
    title: "Chip & crack repair",
    text: "Catch it early. Most small chips can be repaired in a short visit — before they spread.",
  },
  {
    icon: BadgeCheck,
    title: "Side & rear glass",
    text: "Smashed door window or rear screen? We replace it and clean up the glass left behind.",
  },
  {
    icon: Camera,
    title: "ADAS camera calibration",
    text: "Lane-keep and braking cameras need recalibrating after a windshield change. We can take care of it.",
  },
  {
    icon: Truck,
    title: "Mobile service",
    text: "We come to your home or workplace across Peel Region — weather and the job permitting.",
  },
  {
    icon: FileCheck2,
    title: "Insurance claims",
    text: "We help with the paperwork and deal with the claim process so you don't have to chase it.",
  },
];

export const steps = [
  {
    title: "Get a free quote",
    text: "Call, text or fill in the form with your vehicle and what happened. We'll confirm price and timing.",
  },
  {
    title: "Book your time",
    text: "Choose a time that suits you. We'll confirm the details when you book.",
  },
  {
    title: "We repair or replace",
    text: "Our technicians fit the glass, re-seal it and leave your vehicle clean.",
  },
  {
    title: "Drive away safely",
    text: "We tell you exactly how long the adhesive needs to cure before you hit the road.",
  },
] as const;

export const reasons = [
  {
    title: "Safety first",
    text: "A windshield is part of your car's structure. We use proper adhesives and respect cure times.",
  },
  {
    title: "Upfront pricing",
    text: "Free quotes and a clear price before we start — no surprises on the day.",
  },
  {
    title: "Insurance made easy",
    text: "Glass often falls under your policy. We guide you through the claim.",
  },
  {
    title: "Careful, clean work",
    text: "Protective covers, tidy fitting and a proper clean-up when we're done.",
  },
] as const;

export const areas = [
  "Mississauga",
  "Brampton",
  "Caledon",
  "Bolton",
  "Malton",
  "Streetsville",
  "Port Credit",
  "Heart Lake",
] as const;

export const faqs = [
  {
    q: "Can my chip be repaired instead of replaced?",
    a: "Often, yes. Small chips and short cracks that aren't in the driver's direct line of sight can usually be repaired if they're caught early. Larger cracks, damage at the edge of the glass or damage in the driver's view usually mean replacement. Send us a photo and we'll tell you honestly which it is.",
  },
  {
    q: "Will my insurance cover it?",
    a: "Many auto policies with glass or comprehensive coverage include windshield damage, subject to your deductible. Coverage varies by policy, so check with your insurer — we can help with the claim and tell you what to expect.",
  },
  {
    q: "How long does a replacement take?",
    a: "Most windshield replacements take around one to two hours, plus time for the adhesive to cure before you drive. We'll give you a safe drive-away time when you book.",
  },
  {
    q: "Do you come to me?",
    a: "Yes — we offer mobile service across Peel Region. Weather and the type of job can affect whether we can work outdoors, and we'll let you know when you book.",
  },
  {
    q: "What is ADAS calibration and do I need it?",
    a: "Many newer vehicles have a camera behind the windshield for features like lane-keep assist and automatic emergency braking. After a windshield replacement that camera usually needs recalibrating so it keeps working accurately. Tell us your vehicle and we'll let you know.",
  },
  {
    q: "Should I fix a cracked windshield right away?",
    a: "Yes. Cracks spread with bumps and temperature changes, and a damaged windshield can hurt your view and weaken the structure around it. A quick chip repair now is cheaper than a replacement later.",
  },
] as const;

export const quoteServices = [
  "Windshield replacement",
  "Chip or crack repair",
  "Side or rear window",
  "ADAS calibration",
  "Not sure yet",
] as const;
