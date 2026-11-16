import Icon from "./Icon";
import { site } from "@/data/site";

/** Instagram ve Trendyol — küçük, ikon + yazı bağlantıları. */
export default function SocialLinks({ className = "", stacked = false }: { className?: string; stacked?: boolean }) {
  const item = "inline-flex min-h-[44px] items-center gap-2.5 text-[14.5px] font-medium underline-offset-4 hover:underline";
  return (
    <ul className={`${stacked ? "flex flex-col" : "flex flex-wrap gap-x-7"} ${className}`}>
      <li>
        <a className={item} href={site.social.instagram.url} target="_blank" rel="noopener noreferrer">
          <Icon name="instagram" size={19} />
          <span>Instagram <span className="opacity-70">@{site.social.instagram.handle}</span></span>
        </a>
      </li>
      <li>
        <a className={item} href={site.social.trendyol.url} target="_blank" rel="noopener noreferrer">
          <Icon name="store" size={19} />
          <span>Trendyol mağazamız</span>
        </a>
      </li>
    </ul>
  );
}
