import type { StaticImageData } from "next/image";
import windshield from "@/assets/images/service-windshield.jpg";
import crack from "@/assets/images/repair-crack.jpg";
import sideWindow from "@/assets/images/service-side-window.jpg";
import rearWindow from "@/assets/images/service-rear-window.jpg";
import chip from "@/assets/images/repair-chip.jpg";
import installers from "@/assets/images/about-installers.jpg";
import glassSky from "@/assets/images/glass-sky.jpg";
import { repairWhen, replaceWhen, tellUs } from "./guidance";

export type ServiceSlug =
  | "windshield-repair"
  | "windshield-replacement"
  | "side-window-replacement"
  | "rear-windshield-replacement";

export type ServiceSection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
};

export type Service = {
  slug: ServiceSlug;
  /** Short name for navigation, cards and structured data. */
  title: string;
  /** Page heading. */
  heading: string;
  metaDescription: string;
  lead: string;
  /** One or two sentences for cards. */
  summary: string;
  image: StaticImageData;
  alt: string;
  /** Short facts in the sidebar. Only things that are true for every vehicle. */
  glance: { label: string; value: string }[];
  /** Optional second photograph shown beside the first section of the page. */
  figure?: { image: StaticImageData; alt: string; caption?: string };
  sections: ServiceSection[];
  faqIds: string[];
  related: ServiceSlug[];
};

export const services: Service[] = [
  {
    slug: "windshield-repair",
    title: "Windshield Repair",
    heading: "Windshield repair in Mississauga",
    metaDescription:
      "Windshield repair for small chips and short cracks in Mississauga, Ontario. Peel Auto Glass assesses the damage and tells you whether repair is suitable. Call +1 437-339-9054.",
    lead: "Small chips and short cracks can often be repaired, which keeps your original windshield in place. We look at the damage first and tell you plainly whether repair is the right call.",
    summary:
      "Small chips and short cracks can often be repaired. We assess the damage and tell you whether repair is suitable.",
    image: crack,
    alt: "A cracked windshield with a star-shaped impact point and long cracks spreading across the glass",
    glance: [
      { label: "Glass", value: "Windshield" },
      { label: "Approach", value: "Repair when the damage is suitable" },
      { label: "Confirmed with you", value: "Suitability, pricing and timing" },
    ],
    figure: {
      image: chip,
      alt: "Close-up of a small star-shaped chip in glass with fine cracks radiating from the centre",
      caption: "A small chip like this is the kind of damage that can often be repaired.",
    },
    sections: [
      {
        title: "When repair may be suitable",
        paragraphs: [
          "Every windshield is different, so these are guidelines rather than promises. We assess your windshield before recommending repair.",
        ],
        list: repairWhen,
      },
      {
        title: "When replacement is the better answer",
        paragraphs: [
          "If the damage is large, spreading, close to the edge, in the driver's view, or reaches beyond the outer layer of glass, replacement is usually the safer option. Describe the damage to us and we will say which we recommend.",
        ],
      },
      {
        title: "Why it is worth acting early",
        paragraphs: [
          "A chip or crack can spread as the vehicle flexes, as temperatures change, or as moisture and dirt work into the damage. Damage that could have been repaired may then need a full replacement, so it is worth having it assessed early.",
        ],
      },
      { title: "What to tell us", list: tellUs },
    ],
    faqIds: ["can-repair", "act-quickly", "safe-to-drive", "cost"],
    related: ["windshield-replacement", "side-window-replacement"],
  },
  {
    slug: "windshield-replacement",
    title: "Windshield Replacement",
    heading: "Windshield replacement in Mississauga",
    metaDescription:
      "Windshield replacement in Mississauga, Ontario, with glass matched to your vehicle. Peel Auto Glass confirms what your vehicle needs before work begins. Call +1 437-339-9054.",
    lead: "When damage is too large, too close to the edge or in the driver's view, replacement is the safer choice. We confirm the glass your vehicle needs before any work begins.",
    summary:
      "When repair is not appropriate, we replace the windshield with glass that suits your vehicle's make, model, year and features.",
    image: windshield,
    alt: "A technician in blue gloves positioning a windshield with a suction-cup lifting tool",
    glance: [
      { label: "Glass", value: "Windshield" },
      { label: "Approach", value: "Replacement when repair is not appropriate" },
      { label: "Confirmed with you", value: "Glass type, pricing and timing" },
    ],
    figure: {
      image: installers,
      alt: "Two technicians in blue gloves fitting a windshield to a car with suction-cup lifters",
      caption: "Windshield installation requires care and the right tools.",
    },
    sections: [
      {
        title: "When replacement is the safer choice",
        paragraphs: [
          "A windshield is an important safety component. It helps you see clearly and contributes to the strength of your vehicle's structure. Replacement is usually the safer option when:",
        ],
        list: replaceWhen,
      },
      {
        title: "Glass matched to your vehicle",
        paragraphs: [
          "Windshields differ by make, model, year and trim, and may include features such as rain sensors, heating, acoustic layers, camera mounts or antennas. Mention any special features when you contact us. Your vehicle identification number (VIN) can also help confirm compatibility.",
        ],
      },
      {
        title: "After the windshield is replaced",
        paragraphs: [
          "After a windshield replacement, the adhesive needs time to cure before the vehicle is driven. Ask us how long that applies to your vehicle.",
        ],
      },
      { title: "What to tell us", list: tellUs },
    ],
    faqIds: ["when-replace", "compatibility", "appointments", "insurance"],
    related: ["windshield-repair", "rear-windshield-replacement"],
  },
  {
    slug: "side-window-replacement",
    title: "Side Window Replacement",
    heading: "Side window replacement in Mississauga",
    metaDescription:
      "Side window replacement for front and rear door glass in Mississauga, Ontario. Peel Auto Glass matches the glass to your vehicle's make, model and year. Call +1 437-339-9054.",
    lead: "Side windows are made from tempered glass, so a damaged one is replaced rather than repaired. We replace door and side glass with glass that suits your vehicle.",
    summary:
      "Damaged door and side glass is replaced rather than repaired. We match the glass to your vehicle's make, model and year.",
    image: sideWindow,
    alt: "Side mirror and door window glass of a dark blue car",
    glance: [
      { label: "Glass", value: "Front and rear door glass" },
      { label: "Approach", value: "Replacement" },
      { label: "Confirmed with you", value: "Glass match, pricing and timing" },
    ],
    figure: {
      image: glassSky,
      alt: "Cloudy sky and trees reflected in a car window",
    },
    sections: [
      {
        title: "Why side windows are replaced, not repaired",
        paragraphs: [
          "Side windows are normally made from tempered glass, which is designed to break into small pieces rather than crack in a line. Because of this, a damaged side window is generally replaced rather than repaired.",
        ],
      },
      {
        title: "What we replace",
        list: ["Front door glass", "Rear door glass", "Glass matched to your vehicle's make, model and year"],
      },
      {
        title: "Getting the right glass",
        paragraphs: [
          "Auto glass differs by make, model, year and trim. Give us your vehicle's details and tell us which window is damaged, and we confirm what is needed before the work begins.",
        ],
      },
      { title: "What to tell us", list: tellUs },
    ],
    faqIds: ["side-window", "compatibility", "cost", "appointments"],
    related: ["rear-windshield-replacement", "windshield-replacement"],
  },
  {
    slug: "rear-windshield-replacement",
    title: "Rear Windshield Replacement",
    heading: "Rear windshield replacement in Mississauga",
    metaDescription:
      "Rear windshield replacement in Mississauga, Ontario. Peel Auto Glass confirms the right glass for your vehicle, including defroster lines and antennas. Call +1 437-339-9054.",
    lead: "Rear glass often includes features such as defroster lines or an antenna. Tell us about your vehicle and we confirm the right glass before work begins.",
    summary:
      "Rear glass can include defroster lines or an antenna. We confirm the right glass for your vehicle before work begins.",
    image: rearWindow,
    alt: "Rear quarter window and taillight of a dark sedan at dusk",
    glance: [
      { label: "Glass", value: "Rear windshield" },
      { label: "Approach", value: "Replacement" },
      { label: "Confirmed with you", value: "Vehicle details, pricing and timing" },
    ],
    sections: [
      {
        title: "Rear glass is more than a window",
        paragraphs: [
          "Rear windshields often include heating (defroster) lines or an antenna, so the right replacement depends on your vehicle's year, make, model and features.",
        ],
      },
      {
        title: "What we do",
        list: ["Rear windshield replacement", "Vehicle details confirmed before work begins"],
      },
      { title: "What to tell us", list: tellUs },
    ],
    faqIds: ["rear-window", "compatibility", "cost", "appointments"],
    related: ["side-window-replacement", "windshield-replacement"],
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
