export type Credit = {
  file: string;
  usedFor: string;
  title: string;
  author: string;
  sourceUrl: string;
  licence: string;
};

const PEXELS = "Pexels Licence (free to use, no attribution required)";

/** Third-party photography used on the site. Supplied photographs are listed separately. */
export const credits: Credit[] = [
  {
    file: "hero.jpg",
    usedFor: "Homepage hero",
    title: "Elegant car window reflecting a vibrant sunset (cropped)",
    author: "天玑 不器",
    sourceUrl: "https://www.pexels.com/photo/sleek-car-with-sunset-reflection-34000330/",
    licence: PEXELS,
  },
  {
    file: "service-side-window.jpg",
    usedFor: "Side window service card and page",
    title: "Close-up of car mirror and window (cropped)",
    author: "Anna Keibalo",
    sourceUrl: "https://www.pexels.com/photo/close-up-of-car-mirror-and-window-17706641/",
    licence: PEXELS,
  },
  {
    file: "service-rear-window.jpg",
    usedFor: "Rear windshield service card and page",
    title: "Luxurious black car at dusk (cropped)",
    author: "Bayram Yalçın",
    sourceUrl: "https://www.pexels.com/photo/luxurious-black-car-at-dusk-15071553/",
    licence: PEXELS,
  },
  {
    file: "glass-sky.jpg",
    usedFor: "About Us page and side window replacement page",
    title: "Close-up of a car window (cropped)",
    author: "Mathias Reding",
    sourceUrl: "https://www.pexels.com/photo/close-up-of-a-car-window-9784181/",
    licence: PEXELS,
  },
  {
    file: "contact-mirror.jpg",
    usedFor: "Contact page",
    title: "Close-up of a sleek black car mirror with reflections (cropped)",
    author: "Anil Chandran",
    sourceUrl: "https://www.pexels.com/photo/close-up-of-a-sleek-black-car-mirror-with-reflections-32667390/",
    licence: PEXELS,
  },
];

export const suppliedAssets = [
  "The Peel Auto Glass logo.",
  "Photographs of a windshield installation, a suction-cup glass lifter, a cracked windshield and a windshield chip, supplied by the business as reference imagery.",
];
