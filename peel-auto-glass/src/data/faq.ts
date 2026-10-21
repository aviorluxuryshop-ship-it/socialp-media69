import { business } from "./business";

export type Faq = { id: string; q: string; a: string };
export type FaqGroup = { id: string; title: string; intro?: string; items: Faq[] };

const b = business;

export const faqGroups: FaqGroup[] = [
  {
    id: "windshield",
    title: "Windshield repair & replacement",
    items: [
      {
        id: "can-repair",
        q: "Can my windshield be repaired?",
        a: "Sometimes. Repair is generally suitable for small chips and short cracks, as long as the damage is not directly in the driver's line of sight or at the edge of the glass, and the damage has not been contaminated by dirt or moisture. Every windshield is different, so we assess the damage before recommending repair.",
      },
      {
        id: "when-replace",
        q: "When does a windshield need to be replaced?",
        a: "Replacement is usually the safer option when the damage is large, spreading or close to the edge of the windshield; when it sits in the driver's view; when there is more than one point of damage; or when the damage reaches beyond the outer layer of glass. If you are unsure, describe the damage to us and we will tell you what we recommend.",
      },
      {
        id: "act-quickly",
        q: "Why should I have a chip looked at quickly?",
        a: "A chip or crack can spread as the vehicle flexes, as temperatures change, or as moisture and dirt work into the damage. Damage that could have been repaired may then need a full replacement, so it is worth having it assessed early.",
      },
      {
        id: "safe-to-drive",
        q: "Is it safe to drive with a cracked windshield?",
        a: "A windshield is an important safety component. It helps you see clearly and contributes to the strength of your vehicle's structure. Cracks can reduce visibility and weaken the glass, so we recommend having damage assessed as soon as you can. If you are unsure whether your vehicle is safe to drive, contact us.",
      },
    ],
  },
  {
    id: "side-rear",
    title: "Side windows & rear windshields",
    items: [
      {
        id: "side-window",
        q: "Can a broken side window be repaired?",
        a: "Side windows are normally made from tempered glass, which is designed to break into small pieces rather than crack in a line. Because of this, a damaged side window is generally replaced rather than repaired.",
      },
      {
        id: "rear-window",
        q: "Do you replace rear windshields?",
        a: "Yes, rear windshield replacement is one of our services. Rear glass often includes features such as heating (defroster) lines or an antenna, so please tell us your vehicle's year, make and model when you contact us.",
      },
    ],
  },
  {
    id: "vehicle",
    title: "Your vehicle",
    items: [
      {
        id: "compatibility",
        q: "How do you make sure the glass fits my vehicle?",
        a: "Auto glass differs by make, model, year and trim, and may include features such as rain sensors, heating, acoustic layers, camera mounts or antennas. When you contact us, give your vehicle's year, make and model and mention any special features. Your vehicle identification number (VIN) can also help confirm compatibility.",
      },
      {
        id: "info-to-have",
        q: "What should I have ready when I contact you?",
        a: "Your vehicle's year, make and model; which glass is damaged; and a short description of the damage, including where it is and roughly how large it is. If you are emailing, photos are helpful. Your VIN can help if you have it to hand.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing, appointments & insurance",
    intro:
      "We do not publish prices, turnaround times or insurance arrangements on this website. They depend on your vehicle and the job, so we confirm them with you directly.",
    items: [
      {
        id: "cost",
        q: "How much does auto glass repair or replacement cost?",
        a: "The cost depends on your vehicle, the type of glass and whether the work is a repair or a replacement, so we do not list fixed prices on this website. Contact us with your vehicle details and a description of the damage and we will discuss pricing with you.",
      },
      {
        id: "estimate",
        q: "How do I get an estimate?",
        a: `Call us on ${b.phone.display} or email ${b.email} with your vehicle details and a description of the damage. Please confirm directly with us what an estimate includes before agreeing to any work.`,
      },
      {
        id: "appointments",
        q: "How do I book an appointment, and how long will the job take?",
        a: "Call us to discuss your vehicle and arrange a time. Appointment availability and how long the work takes depend on the type of job, your vehicle and glass availability, so we confirm these details with you directly. After a windshield replacement, the adhesive needs time to cure before the vehicle is driven. Ask us how long that applies to your vehicle.",
      },
      {
        id: "location",
        q: "Can the work be done at my home or workplace?",
        a: "Please contact us to ask. Where and when the work can be done depends on the job, so we confirm this directly rather than listing it as a standard service.",
      },
      {
        id: "insurance",
        q: "Will my insurance cover the work?",
        a: "It depends on your policy. Some auto insurance policies include glass coverage or apply a deductible to glass claims, and others do not. Check your policy or ask your insurer or broker what is covered. Contact us to discuss payment and any documentation you may need for a claim. We do not list insurance partnerships on this website.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contacting us",
    items: [
      {
        id: "how-to-contact",
        q: "How can I contact Peel Auto Glass?",
        a: `Phone: ${b.phone.display}. Email: ${b.email}. Address: ${b.address.oneLine}. Please call before visiting so we can confirm service details.`,
      },
      {
        id: "online-quote",
        q: "Can I book or request a quote online?",
        a: "This website does not have an online booking or quote form. Please call or email us directly.",
      },
    ],
  },
];

/** Questions shown in the homepage preview, by id. */
export const homeFaqIds = ["can-repair", "when-replace", "cost", "insurance"] as const;

export const allFaqs: Faq[] = faqGroups.flatMap((g) => g.items);
