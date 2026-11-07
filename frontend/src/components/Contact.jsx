import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Facebook, Github, Instagram, Linkedin, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { me } from "../data";
import { Block, Reveal } from "./Section";

import { API } from "../lib/backend";

const input =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-emerald-400";

const waLink = `${me.wa}?text=${encodeURIComponent("Hi Ram, I found your portfolio and want to discuss a project.")}`;

const row =
  "flex items-start gap-4 border-b border-white/5 py-4 text-sm text-slate-300 transition-colors duration-200 hover:text-emerald-300";

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const message = String(f.get("message") || "").trim();
    if (message.length < 10) {
      toast.error("Please add a little more detail about your project (at least 10 characters).");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/contact`, {
        name: String(f.get("name") || "").trim(),
        email: String(f.get("email") || "").trim(),
        phone: String(f.get("phone") || "").trim(),
        message,
        website: String(f.get("website") || ""),
      });
      toast.success("Enquiry sent — I'll reply within a day.");
      setSent(true);
      form.reset();
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 429) toast.error("You've sent a few messages already — please WhatsApp or email me directly.");
      else if (status === 422) toast.error(typeof detail === "string" ? detail : "Please check your name, email and message.");
      else toast.error(`Could not send right now. Please WhatsApp ${me.phone} or email ${me.email}.`);
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
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
          Tell me what you need — a website, an app, an API or an automation. I reply within 24 hours
          with next steps and a clear quote. Free first call, no obligation.
        </p>
        <a
          href={`mailto:${me.email}?subject=${encodeURIComponent("Project enquiry from your portfolio")}`}
          data-testid="contact-email-link"
          className="mt-5 block break-all font-display text-2xl font-extrabold tracking-tight text-slate-100 transition-colors duration-300 hover:text-emerald-400 sm:text-4xl"
        >
          {me.email}
        </a>
        <div className="mb-14 mt-6 flex flex-wrap gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="contact-whatsapp-cta"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-[#06240f] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            <MessageCircle size={16} /> Chat on WhatsApp
          </a>
          <a
            href={me.tel}
            data-testid="contact-call-cta"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/60 hover:text-emerald-300"
          >
            <Phone size={16} /> Call {me.phone}
          </a>
        </div>
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
          <a href={waLink} target="_blank" rel="noopener noreferrer" data-testid="contact-whatsapp-link" className={row}>
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
            <label className="sr-only" htmlFor="contact-name">Your name</label>
            <input id="contact-name" name="name" placeholder="Your name" required minLength={2} maxLength={120} autoComplete="name" data-testid="contact-name-input" className={input} />
            <label className="sr-only" htmlFor="contact-email">Your email</label>
            <input id="contact-email" name="email" type="email" placeholder="Your email" required maxLength={254} autoComplete="email" data-testid="contact-email-input" className={input} />
            <label className="sr-only" htmlFor="contact-phone">Phone or WhatsApp (optional)</label>
            <input id="contact-phone" name="phone" type="tel" placeholder="Phone / WhatsApp (optional)" maxLength={40} autoComplete="tel" data-testid="contact-phone-input" className={input} />
            <label className="sr-only" htmlFor="contact-message">Your project</label>
            <textarea id="contact-message" name="message" placeholder="What do you want to build? Rough budget and timeline help me reply faster." required minLength={10} maxLength={4000} rows={5} data-testid="contact-message-input" className={input} />
            {/* Honeypot for bots — invisible to people and screen readers */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />
            <button
              type="submit"
              disabled={loading}
              data-testid="contact-submit-button"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-onacc transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Sending..." : sent ? "Send another enquiry" : "Send enquiry"}
              <Send size={15} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
            </button>
            <p className="text-center text-xs text-slate-500" aria-live="polite">
              {sent ? "Thanks! Your message reached me — expect a reply within 24 hours." : "Usually replies within a few hours · Your details stay private"}
            </p>
          </form>
        </Reveal>
      </div>
    </Block>
  );
}
