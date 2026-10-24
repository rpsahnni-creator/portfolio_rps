import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Facebook, Github, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { me } from "../data";
import { Block, Reveal } from "./Section";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const input =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-emerald-400";

const row =
  "flex items-start gap-4 border-b border-white/5 py-4 text-sm text-slate-300 transition-colors duration-200 hover:text-emerald-300";

export default function Contact() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setLoading(true);
    try {
      await axios.post(`${API}/contact`, {
        name: f.get("name"),
        email: f.get("email"),
        message: f.get("message"),
      });
      toast.success("Enquiry sent — I'll reply within a day.");
      form.reset();
    } catch (err) {
      toast.error("Could not send right now. Please email me directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Block id="contact">
      <Reveal>
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-emerald-400">07 · Contact</p>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl lg:text-[2.75rem]">
          Let's build something.
        </h2>
        <a
          href={`mailto:${me.email}`}
          data-testid="contact-email-link"
          className="mb-14 mt-5 block break-all font-display text-2xl font-extrabold tracking-tight text-slate-100 transition-colors duration-300 hover:text-emerald-400 sm:text-4xl"
        >
          {me.email}
        </a>
      </Reveal>

      <div className="grid gap-14 md:grid-cols-2">
        <Reveal delay={0.1}>
          <a href={me.tel} className={row}>
            <Phone className="mt-0.5 shrink-0 text-emerald-400" size={18} />
            <span>
              <small className="block font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Phone</small>
              {me.phone}
            </span>
          </a>
          <a href={me.wa} target="_blank" rel="noopener noreferrer" data-testid="contact-whatsapp-link" className={row}>
            <MessageCircle className="mt-0.5 shrink-0 text-[#25D366]" size={18} />
            <span>
              <small className="block font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">WhatsApp</small>
              Message me directly
            </span>
          </a>
          <a href={me.github} target="_blank" rel="noopener noreferrer" className={row}>
            <Github className="mt-0.5 shrink-0 text-[#181717] dark:text-white" size={18} />
            <span>
              <small className="block font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">GitHub</small>
              github.com/rpsahnni-creator
            </span>
          </a>
          <a href={me.linkedin} target="_blank" rel="noopener noreferrer" className={row}>
            <Linkedin className="mt-0.5 shrink-0 text-[#0A66C2]" size={18} />
            <span>
              <small className="block font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">LinkedIn</small>
              linkedin.com/in/rp-sahnni
            </span>
          </a>
          <a href={me.instagram} target="_blank" rel="noopener noreferrer" data-testid="contact-instagram-link" className={row}>
            <Instagram className="mt-0.5 shrink-0 text-[#E4405F]" size={18} />
            <span>
              <small className="block font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Instagram</small>
              {me.instagram.replace("https://www.", "")}
            </span>
          </a>
          <a href={me.facebook} target="_blank" rel="noopener noreferrer" data-testid="contact-facebook-link" className={row}>
            <Facebook className="mt-0.5 shrink-0 text-[#1877F2]" size={18} />
            <span>
              <small className="block font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Facebook</small>
              {me.facebook.replace("https://www.", "")}
            </span>
          </a>
          <p className={row}>
            <MapPin className="mt-0.5 shrink-0 text-emerald-400" size={18} />
            <span>
              <small className="block font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Location</small>
              {me.address}
            </span>
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <form onSubmit={onSubmit} data-testid="contact-form" className="grid gap-3.5">
            <input name="name" placeholder="Your name" required autoComplete="name" data-testid="contact-name-input" className={input} />
            <input name="email" type="email" placeholder="Your email" required autoComplete="email" data-testid="contact-email-input" className={input} />
            <textarea name="message" placeholder="Tell me about your project" required rows={5} data-testid="contact-message-input" className={input} />
            <button
              type="submit"
              disabled={loading}
              data-testid="contact-submit-button"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-onacc transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send enquiry"}
              <Send size={15} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
            </button>
          </form>
        </Reveal>
      </div>
    </Block>
  );
}
