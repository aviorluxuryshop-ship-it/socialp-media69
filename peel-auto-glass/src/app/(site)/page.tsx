import { Hero } from "@/components/home/Hero";
import { PageTiles } from "@/components/home/PageTiles";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: { absolute: "Peel Auto Glass | Windshield Repair & Replacement in Mississauga, ON" },
  description:
    "Professional windshield repair and replacement, side window replacement and rear windshield replacement in Mississauga, Ontario. Call Peel Auto Glass at +1 437-339-9054.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <PageTiles />
    </>
  );
}
