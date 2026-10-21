import { business } from "./business";

export const steps = [
  {
    title: "Contact us",
    text: "Call or email Peel Auto Glass. Have your vehicle's year, make and model ready.",
    details: [
      `Call ${business.phone.display} or email ${business.email}`,
      "Your vehicle's year, make and model",
      "Your VIN, if you have it to hand, helps confirm the right glass",
    ],
  },
  {
    title: "Describe the damage",
    text: "Tell us what happened, where the damage is and roughly how large it is. Photos help if you are emailing.",
    details: [
      "Which glass is damaged",
      "Where the damage is and roughly how large it is",
      "Photos, if you are emailing",
    ],
  },
  {
    title: "Assess the right solution",
    text: "We explain whether repair or replacement is appropriate for your vehicle, and what the work involves.",
    details: [
      "Repair when the damage is suitable",
      "Replacement when repair is not appropriate",
      "Glass features checked against your vehicle",
    ],
  },
  {
    title: "Complete the agreed work",
    text: "Once you are happy with the plan, we complete the agreed repair or replacement.",
    details: [
      "Pricing and timing confirmed with you directly",
      "After a windshield replacement, ask how long the adhesive needs to cure",
    ],
  },
];
