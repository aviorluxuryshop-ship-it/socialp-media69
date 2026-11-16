import Image from "next/image";

/** Prime Kids yazı logosu (siyah ya da beyaz). Oran: 900×358. */
export default function Logo({ white = false, height = 36, priority = false }: { white?: boolean; height?: number; priority?: boolean }) {
  return (
    <Image
      src={white ? "/brand/logo-white.png" : "/brand/logo.png"}
      alt="Prime Kids"
      width={Math.round(height * 2.514)}
      height={height}
      priority={priority}
      style={{ height, width: "auto" }}
    />
  );
}
