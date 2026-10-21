import type { StaticImageData } from "next/image";
import windshield from "@/assets/images/service-windshield.jpg";
import sideWindow from "@/assets/images/service-side-window.jpg";
import rearWindow from "@/assets/images/service-rear-window.jpg";

export type Service = {
  id: string;
  title: string;
  summary: string;
  points: string[];
  image: StaticImageData;
  alt: string;
};

export const services: Service[] = [
  {
    id: "windshield",
    title: "Windshield Repair & Replacement",
    summary:
      "Small chips and short cracks can often be repaired. When the damage is too large, in the driver's view or at the edge of the glass, replacement is the safer choice. We assess the damage and explain which one makes sense.",
    points: ["Repair when the damage is suitable", "Replacement when repair is not appropriate"],
    image: windshield,
    alt: "A technician in blue gloves positioning a windshield with a suction-cup lifting tool",
  },
  {
    id: "side-window",
    title: "Side Window Replacement",
    summary:
      "Side windows are made from tempered glass, so a damaged one is replaced rather than repaired. We replace door and side glass with glass that suits your vehicle.",
    points: ["Front and rear door glass", "Matched to your vehicle's make, model and year"],
    image: sideWindow,
    alt: "Side mirror and door window glass of a dark blue car",
  },
  {
    id: "rear-window",
    title: "Rear Window Replacement",
    summary:
      "Rear windshields often include features such as defroster lines or an antenna. Tell us about your vehicle and we will confirm the right glass for it.",
    points: ["Rear windshield replacement", "Vehicle details confirmed before work begins"],
    image: rearWindow,
    alt: "Rear quarter window and taillight of a dark sedan at dusk",
  },
];
