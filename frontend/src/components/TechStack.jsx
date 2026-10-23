import { Bot, Cloud, Database, Globe, Server, Smartphone } from "lucide-react";
import { useContent } from "../content";
import { Block, Head, Reveal } from "./Section";

const ICONS = {
  Backend: Server,
  Databases: Database,
  Frontend: Globe,
  Mobile: Smartphone,
  "Cloud & DevOps": Cloud,
  "AI & Automation": Bot,
};

export default function TechStack() {
  const { skills } = useContent();

  return (
    <Block id="stack">
      <Head
        eyebrow="03 · Arsenal"
        title="The stack behind the work."
        text="Tools I use to take a project from idea to production — and keep it there."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {skills.map(({ name, items }, idx) => {
          const Icon = ICONS[name] || Server;
          const id = `tech-group-${name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-+$/, "")}`;
          return (
            <Reveal key={name} delay={idx * 0.06} data-testid={id}>
              <div className="group h-full rounded-2xl border border-white/10 bg-panel p-6 transition-colors duration-300 hover:border-emerald-400/40">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="flex items-center gap-3 font-display text-lg font-bold text-slate-100">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
                      <Icon size={18} />
                    </span>
                    {name}
                  </h3>
                  <span className="font-mono text-xs text-slate-600">{String(items.length).padStart(2, "0")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((x) => (
                    <span
                      key={x}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400 transition-colors duration-200 hover:border-emerald-400/40 hover:text-emerald-300"
                    >
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Block>
  );
}
