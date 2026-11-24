import { siFacebook, siInstagram, siTiktok, siX, siYoutube } from "simple-icons";
import { SOCIALS } from "@/lib/config";

const PATHS = { facebook: siFacebook.path, instagram: siInstagram.path, x: siX.path, youtube: siYoutube.path, tiktok: siTiktok.path };

/** Social media symbols for the footer. Icons without a URL yet show but don't link. */
export function SocialIcons() {
  return (
    <ul className="socials" aria-label="Estate IQ on social media">
      {SOCIALS.map((s) => {
        const icon = (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d={PATHS[s.network]} />
          </svg>
        );
        return (
          <li key={s.network}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}>{icon}</a>
            ) : (
              <span role="img" aria-label={s.label}>{icon}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
