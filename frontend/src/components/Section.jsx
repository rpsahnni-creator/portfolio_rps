import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

export function Reveal({ children, className, delay = 0, ...rest }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Head({ eyebrow, title, text }) {
  return (
    <Reveal className="mb-12">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-emerald-400">{eyebrow}</p>
      <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.05]">
        {title}
      </h2>
      {text && <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">{text}</p>}
    </Reveal>
  );
}

export function Block({ id, className = "", children }) {
  return (
    <section id={id} className={`relative mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8 ${className}`}>
      {children}
    </section>
  );
}
