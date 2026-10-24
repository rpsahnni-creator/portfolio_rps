import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { me } from "../data";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STORAGE_KEY = "chat_history";
const MAX_HISTORY = 12;

const WELCOME = {
  role: "assistant",
  content: `Hi! I'm here to answer any questions about ${me.name}'s projects, skills, services, or how to get in touch. What would you like to know?`,
};

function loadHistory() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : [WELCOME];
  } catch {
    return [WELCOME];
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open, loading]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages
      .filter((m) => m !== WELCOME)
      .slice(-MAX_HISTORY)
      .map(({ role, content }) => ({ role, content }));

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(false);

    try {
      const { data } = await axios.post(`${API}/chat`, { message: trimmed, history });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            detail ||
            `Sorry, something went wrong on my end. Please try again, or reach out directly via the contact form or ${me.email}.`,
        },
      ]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[95] flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            data-testid="chat-panel"
            className="flex h-[min(32rem,75vh)] w-[min(23rem,92vw)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl shadow-black/20 dark:shadow-black/50"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-onacc">
                  <Bot size={16} />
                </span>
                <span>
                  <p className="font-display text-sm font-bold text-slate-100">Ask me anything</p>
                  <p className="text-[11px] text-slate-500">About projects, skills &amp; hiring {me.first}</p>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                data-testid="chat-close-button"
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" data-testid="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-emerald-500 text-onacc"
                        : "rounded-bl-sm bg-white/[0.06] text-slate-200"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white/[0.06] px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-white/5 p-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                maxLength={1500}
                disabled={loading}
                data-testid="chat-input"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-emerald-400 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                data-testid="chat-send-button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-onacc transition-all duration-200 hover:bg-emerald-400 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
            {error && (
              <p className="px-4 pb-3 text-center text-[11px] text-slate-500">
                Having trouble? Email{" "}
                <a href={`mailto:${me.email}`} className="text-emerald-400 hover:underline">
                  {me.email}
                </a>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        aria-label={open ? "Close chat" : "Open chat"}
        data-testid="chat-toggle-button"
        className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-onacc shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X size={22} /> : <MessageCircle size={22} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
