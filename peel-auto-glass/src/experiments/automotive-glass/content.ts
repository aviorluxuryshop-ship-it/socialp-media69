import type { StepId } from "./timeline";

export type Step = { id: StepId; number: string; title: string; text: string };

/**
 * Plain-language notes shown beside each component. They match the general guidance
 * on the public FAQ and avoid any claim about Peel Auto Glass's own products.
 */
export const STEPS: Step[] = [
  {
    id: "windshield",
    number: "01",
    title: "Windshield",
    text: "Laminated safety glass bonded to the body. It gives the driver a clear view and contributes to the strength of the vehicle's structure.",
  },
  {
    id: "side",
    number: "02",
    title: "Side windows",
    text: "Door glass is normally tempered. If it breaks it crumbles into small pieces, so a damaged side window is replaced rather than repaired.",
  },
  {
    id: "rear",
    number: "03",
    title: "Rear windshield",
    text: "Usually tempered glass, often with heating lines or an antenna built in. The right glass depends on the vehicle.",
  },
];

export const TITLE = "The anatomy of vehicle glass";
export const LEAD = "Scroll to separate the windshield, side windows and rear glass from the body.";
export const CANVAS_LABEL =
  "A stylised illustration of a sedan. As you scroll, its windshield, side windows and rear windshield separate from the body one group at a time.";
