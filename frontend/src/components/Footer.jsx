import { ArrowUp, Facebook, Github, Instagram, Linkedin, Mail } from "lucide-react";
import { me } from "../data";
import Logo from "./Logo";

const iconLink =
  "grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-400 transition-all duration-200 hover:-translate-y-0.5";

const BRAND = {
  github: "hover:border-slate-400/50 hover:text-[#181717] dark:hover:border-white/30 dark:hover:text-white",
  linkedin: "hover:border-[#0A66C2]/50 hover:text-[#0A66C2]",
  instagram: "hover:border-[#E4405F]/50 hover:text-[#E4405F]",
  facebook: "hover:border-[#1877F2]/50 hover:text-[#1877F2]",
  mail: "hover:border-emerald-400/50 hover:text-emerald-300",
};

export default function Footer() {
  const toTop = () => {
    if (window.__lenis) window.__lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 sm:px-8">
        <Logo size={32} />
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
            className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-onacc transition-transform duration-200 hover:-translate-y-1">
            <ArrowUp size={17} />
          </button>
        </div>
        <p className="font-mono text-xs tracking-wider text-slate-500" data-testid="footer-copyright">
          © {new Date().getFullYear()} {me.name} · {me.location} · <a href="/admin" data-testid="footer-admin-link" className="hover:text-emerald-300">Admin</a>
        </p>
      </div>
    </footer>
  );
}
