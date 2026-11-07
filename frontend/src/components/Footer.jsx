import { ArrowUp, Facebook, Github, Instagram, Linkedin, Mail } from "lucide-react";
import { me } from "../data";
import Logo from "./Logo";

// Deep green footer in both themes — fixed hex colours (not the theme-swapping
// slate/white tokens) so text stays light and readable on the green background.
const iconLink =
  "grid h-10 w-10 place-items-center rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffffff]";

const BRAND = {
  github: "text-[#ffffff] hover:text-[#181717]",
  linkedin: "text-[#7cc4ff] hover:text-[#0A66C2]",
  instagram: "text-[#ff8fa6] hover:text-[#E4405F]",
  facebook: "text-[#8fb8ff] hover:text-[#1877F2]",
  mail: "text-[#6ee7b7] hover:text-[#064e3b]",
};

export default function Footer() {
  const toTop = () => {
    if (window.__lenis) window.__lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-[rgba(52,211,153,0.25)] bg-[#064e3b] pb-28 pt-10 sm:pb-10" data-testid="site-footer">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 sm:px-8">
        <Logo size={32} onDark />
        <div className="flex items-center gap-3">
          <a href={me.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" data-testid="footer-github-link" className={`${iconLink} ${BRAND.github}`}>
            <Github size={17} />
          </a>
          <a href={me.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" data-testid="footer-linkedin-link" className={`${iconLink} ${BRAND.linkedin}`}>
            <Linkedin size={17} />
          </a>
          <a href={me.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" data-testid="footer-instagram-link" className={`${iconLink} ${BRAND.instagram}`}>
            <Instagram size={17} />
          </a>
          <a href={me.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" data-testid="footer-facebook-link" className={`${iconLink} ${BRAND.facebook}`}>
            <Facebook size={17} />
          </a>
          <a href={`mailto:${me.email}`} aria-label="Email" data-testid="footer-email-link" className={`${iconLink} ${BRAND.mail}`}>
            <Mail size={17} />
          </a>
          <button onClick={toTop} aria-label="Back to top" data-testid="footer-back-to-top"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#34d399] text-[#04120d] transition-transform duration-200 hover:-translate-y-1 hover:bg-[#6ee7b7]">
            <ArrowUp size={17} />
          </button>
        </div>
        <p className="font-mono text-xs tracking-wider text-[#a7f3d0]" data-testid="footer-copyright">
          © {new Date().getFullYear()} {me.name} · {me.location} · <a href="/admin" data-testid="footer-admin-link" className="text-[#a7f3d0] underline-offset-2 hover:text-[#ffffff] hover:underline">Admin</a>
        </p>
      </div>
    </footer>
  );
}
