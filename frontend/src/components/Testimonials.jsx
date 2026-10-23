import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { useContent } from "../content";
import { Block, Head, Reveal } from "./Section";

const ease = [0.22, 1, 0.36, 1];

export default function Testimonials() {
  const { testimonials } = useContent();
  const [i, setI] = useState(0);
  const next = useCallback(() => setI((n) => (n + 1) % testimonials.length), [testimonials.length]);
  const prev = () => setI((n) => (n - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next]);

  const q = testimonials[i % testimonials.length];

  return (
    <Block id="testimonials" className="max-w-none bg-panel/40">
      <div className="mx-auto max-w-6xl" data-testid="testimonials-section">
        <Head eyebrow="06 · Testimonials" title="What clients say." />
        <Reveal>
          <div className="relative rounded-2xl border border-white/10 bg-panel p-8 sm:p-12">
            <Quote size={44} className="absolute -top-5 left-8 rounded-xl border border-emerald-400/30 bg-night p-2 text-emerald-400" aria-hidden="true" />
            <div className="mb-5 flex gap-1" aria-label="5 star rating">
              {[...Array(5)].map((_, s) => (
                <Star key={s} size={15} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="min-h-[120px] sm:min-h-[96px]">
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease }}
                  className="font-display text-xl font-semibold leading-relaxed text-slate-100 sm:text-2xl"
                  data-testid="testimonial-quote"
                >
                  "{q.text}"
                </motion.blockquote>
              </AnimatePresence>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3.5"
                  data-testid="testimonial-author"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 font-display text-sm font-extrabold text-emerald-400">
                    {q.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-100">{q.name}</span>
                    <span className="block font-mono text-xs text-slate-500">{q.role}</span>
                  </span>
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center gap-3">
                <button
                  onClick={prev}
                  aria-label="Previous testimonial"
                  data-testid="testimonial-prev-button"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-400 transition-colors duration-200 hover:border-emerald-400/50 hover:text-emerald-300"
                >
                  <ChevronLeft size={17} />
                </button>
                <div className="flex gap-2">
                  {testimonials.map((_, d) => (
                    <button
                      key={d}
                      onClick={() => setI(d)}
                      aria-label={`Go to testimonial ${d + 1}`}
                      data-testid={`testimonial-dot-${d + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${d === i % testimonials.length ? "w-6 bg-emerald-400" : "w-1.5 bg-white/15 hover:bg-white/30"}`}
                    />
                  ))}
                </div>
                <button
                  onClick={next}
                  aria-label="Next testimonial"
                  data-testid="testimonial-next-button"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-400 transition-colors duration-200 hover:border-emerald-400/50 hover:text-emerald-300"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Block>
  );
}
