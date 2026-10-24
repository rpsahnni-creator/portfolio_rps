import { Download, Github, Linkedin, MapPin } from "lucide-react";
import { me } from "../data";
import { useContent } from "../content";
import { Block, Head, Reveal } from "./Section";
import Logo from "./Logo";

export default function About() {
  const { projects, skills, resumeUrl } = useContent();
  const techCount = new Set(skills.flatMap((s) => s.items)).size;
  const stats = [
    [String(projects.length).padStart(2, "0"), "flagship projects"],
    [String(techCount), "technologies"],
    ["04", "disciplines"],
    ["24/7", "automations running"],
  ];

  return (
    <Block id="about" data-testid="about-section">
      <Head eyebrow="01 · About" title="The developer behind the work." />
      <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <div className="space-y-5 text-base leading-relaxed text-slate-400">
            <p>
              I'm <span className="font-semibold text-slate-100">{me.name}</span> — a freelance developer
              from {me.location}. I take products from a rough idea to a running system: the API behind it,
              the web app on top of it, the mobile app in your customer's pocket, and the AI automations
              that keep the boring work moving on its own.
            </p>
            <p>
              My favourite kind of project is the one where a business is drowning in repetitive work —
              copying leads into spreadsheets, answering the same questions, chasing invoices — and walks
              away with software that just handles it.
            </p>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">
              Backend · Web · Mobile · AI automation — one person, full stack.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-4">
            {stats.map(([v, l]) => (
              <div key={l} className="bg-panel px-5 py-6">
                <p className="font-display text-3xl font-extrabold text-emerald-400">{v}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="relative" data-testid="about-card">
            <div className="absolute inset-0 -translate-x-3 translate-y-3 rounded-2xl border border-amber-400/40" aria-hidden="true" />
            <div className="relative rounded-2xl border border-white/10 bg-panel p-8">
              <div className="flex items-center justify-between">
                <Logo size={52} withWordmark={false} />
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                  Open to work
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-slate-50">{me.name}</h3>
              <p className="mt-1 font-mono text-xs text-slate-500">rpsahnni.dev</p>
              <p className="mt-5 flex items-center gap-2 text-sm text-slate-400">
                <MapPin size={15} className="text-emerald-400" /> {me.location}
              </p>
              <div className="mt-7 flex flex-wrap gap-3 border-t border-white/5 pt-6">
                <a href={me.github} target="_blank" rel="noopener noreferrer" data-testid="about-github-link"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] text-slate-300 transition-colors hover:border-slate-400/50 hover:text-[#181717] dark:hover:text-white">
                  <Github size={14} /> GitHub
                </a>
                <a href={me.linkedin} target="_blank" rel="noopener noreferrer" data-testid="about-linkedin-link"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] text-slate-300 transition-colors hover:border-[#0A66C2]/50 hover:text-[#0A66C2]">
                  <Linkedin size={14} /> LinkedIn
                </a>
                <a href={resumeUrl || "/Ram-Pravesh-Sahni-Resume.pdf"} download data-testid="about-resume-button"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 font-mono text-[11px] font-bold text-onacc transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-400">
                  <Download size={14} /> Résumé
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Block>
  );
}
