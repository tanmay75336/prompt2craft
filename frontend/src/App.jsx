/**
 * Prompt2Craft — AI Presentation Builder
 * Responsive · SEO-optimized · Accessible (WCAG 2.1 AA) · Performance-first
 */
import { useState, useEffect, useRef, useCallback, memo } from "react";

const API_URL = "http://localhost:8081/api/generate";

/* ─── Static data (defined outside component to avoid re-creation) ─────────── */
const SUGGESTIONS = [
  "Series A pitch deck for a fintech startup",
  "Quarterly business review for Q4 2024",
  "Product roadmap for our mobile app",
  "Climate change research presentation",
  "Go-to-market strategy for SaaS",
  "UX research findings for stakeholders",
  "Machine learning 101 for non-technical teams",
  "Company all-hands meeting agenda",
];

const CHIPS = [
  "Startup pitch", "Business review", "Product roadmap",
  "Research report", "Marketing strategy", "Board meeting",
  "Sales deck", "Team onboarding",
];

const AI_STEPS = [
  { label: "Analyzing your topic",  detail: "Understanding context & intent" },
  { label: "Building slide outline", detail: "Structuring narrative flow" },
  { label: "Writing slide content",  detail: "Crafting compelling copy" },
  { label: "Applying visual design", detail: "Layout, typography & color" },
  { label: "Packaging your file",   detail: "Compiling final .pptx" },
];

const FEATURES = [
  { title: "AI that actually understands you",  desc: "Not just bullet points. Prompt2Craft builds a real narrative — intro, problem, solution, evidence, call to action — the way a great presenter would.", tag: "Smart",     visual: "brain" },
  { title: "Ready in under 30 seconds",          desc: "From idea to fully-designed deck faster than you can open PowerPoint. No templates to pick, no formatting to fix.",                                tag: "Fast",      visual: "bolt" },
  { title: "Looks like a designer made it",      desc: "Professional typography, spatial hierarchy, and visual balance applied automatically. Every slide looks intentional.",                             tag: "Beautiful", visual: "star" },
  { title: "Edit freely after download",         desc: "Get a native .pptx file that works in PowerPoint, Keynote, and Google Slides. Every element is fully editable.",                                 tag: "Flexible",  visual: "edit" },
];

const STATS = [
  { value: 14280, suffix: "+",  label: "Decks created" },
  { value: 28,    suffix: "s",  label: "Avg. generation time" },
  { value: 4.9,   suffix: "/5", label: "User rating", decimal: true },
  { value: 98,    suffix: "%",  label: "Would recommend" },
];

const SLIDE_SAMPLES = [
  { title: "The Problem",          body: "Current tools require hours of manual work, breaking the creative flow.",      color: "#f97316", num: "01" },
  { title: "Our Solution",         body: "Describe your idea in plain language. We handle everything else.",              color: "#8b5cf6", num: "02" },
  { title: "Market Opportunity",   body: "$4.2B market with 34% YoY growth and no clear AI-native leader.",              color: "#0ea5e9", num: "03" },
  { title: "Product Demo",         body: "From prompt to polished deck in one click. See it live above.",                 color: "#10b981", num: "04" },
  { title: "Business Model",       body: "Freemium with Pro at $12/mo. 5% conversion target in 6 months.",               color: "#f43f5e", num: "05" },
  { title: "The Ask",              body: "Raising $1.2M seed to accelerate AI model fine-tuning and growth.",            color: "#f59e0b", num: "06" },
];

const FAQS = [
  { q: "What kind of topics work best?",                    a: "Any topic works — business pitches, research reports, lectures, product demos, company updates. The more specific your prompt, the better the output. Try 'Q3 sales review for our B2B SaaS startup targeting mid-market HR teams'." },
  { q: "How long does generation actually take?",           a: "Most 8–10 slide decks generate in 20–35 seconds. Longer decks (15–20 slides) can take up to 60 seconds. Pro users get priority queue processing." },
  { q: "Can I edit the presentation after downloading?",    a: "Yes, fully. The output is a standard .pptx file — open it in Microsoft PowerPoint, Apple Keynote, or import to Google Slides. Every text box, image placeholder, and colour is editable." },
  { q: "Is there a free version?",                         a: "Free accounts get 5 presentations per month, forever. No credit card required to start. Pro ($12/mo) gives you unlimited decks, priority speed, and custom brand themes." },
  { q: "What makes this different from ChatGPT + PowerPoint?", a: "Prompt2Craft generates content and design simultaneously, with layout logic that understands slide structure — not just text. You don't need to copy-paste, format, or design anything. One step, done." },
];

/* ─── Custom hook: animated counter ─────────────────────────────────────────── */
function useCountUp(target, duration = 1800, start = false, decimal = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(decimal ? parseFloat(cur.toFixed(1)) : Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(t);
  }, [start]);
  return val;
}

/* ─── Custom hook: drag-to-reorder ──────────────────────────────────────────── */
function useDragOrder(initial) {
  const [items, setItems] = useState(initial);
  const dragIdx = useRef(null);
  const onDragStart = i => { dragIdx.current = i; };
  const onDragOver  = (e, i) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(i, 0, moved);
      dragIdx.current = i;
      return next;
    });
  };
  const onDragEnd = () => { dragIdx.current = null; };
  return { items, setItems, onDragStart, onDragOver, onDragEnd };
}

/* ─── Navbar ─────────────────────────────────────────────────────────────────── */
const Navbar = memo(function Navbar({ onCTA, theme, setTheme }) {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const h = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener("resize", h, { passive: true });
    return () => window.removeEventListener("resize", h);
  }, []);

  const links = [
    { label: "Features",     href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing",      href: "#pricing" },
    { label: "FAQ",          href: "#faq" },
  ];

  const navBg    = scrolled ? (theme === "dark" ? "rgba(12,12,14,0.92)" : "rgba(255,253,250,0.92)") : "transparent";
  const navBorder = scrolled ? (theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)") : "transparent";
  const linkColor = theme === "dark" ? "rgba(255,255,255,0.6)" : "#4b5563";

  return (
    <header>
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, background: navBg, backdropFilter: scrolled ? "blur(16px)" : "none", borderBottom: `1px solid ${navBorder}`, transition: "all 0.3s ease" }}
      >
        <div className="nav-inner">
          {/* Logo */}
          <a href="/" aria-label="Prompt2Craft home" className="logo-link">
            <div aria-hidden="true" className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                <path d="M3 5h10M3 8h7M3 11h5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="logo-text">Prompt2Craft</span>
          </a>

          {/* Desktop links */}
          <ul role="list" className="nav-links" aria-label="Site sections">
            {links.map(l => (
              <li key={l.label}>
                <a href={l.href} className="nav-link" style={{ color: linkColor }}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="nav-actions">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="theme-btn"
              style={{ color: linkColor }}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.05 1.05M11.85 11.85l1.05 1.05M11.85 4.15l-1.05 1.05M4.15 11.85l-1.05 1.05" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13.5 8.8A5.5 5.5 0 017.2 2.5 5.5 5.5 0 1013.5 8.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              )}
            </button>
            <a href="#signin" className="signin-link" style={{ color: linkColor }}>Sign in</a>
            <button onClick={onCTA} className="cta-btn-nav" aria-label="Start generating presentations for free">
              Try free →
            </button>
            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(m => !m)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              className="hamburger"
              style={{ color: linkColor }}
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            id="mobile-menu"
            role="dialog"
            aria-label="Mobile navigation menu"
            className="mobile-menu"
            style={{ background: theme === "dark" ? "#0c0c0e" : "#fff", borderTop: `1px solid ${navBorder}` }}
          >
            <ul role="list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {links.map(l => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="mobile-link"
                    style={{ color: theme === "dark" ? "rgba(255,255,255,0.75)" : "#374151" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <button onClick={() => { onCTA(); setMobileOpen(false); }} className="mobile-cta">
              Generate presentation →
            </button>
          </div>
        )}
      </nav>
    </header>
  );
});

/* ─── 3D Slide card ──────────────────────────────────────────────────────────── */
const SlideCard3D = memo(function SlideCard3D({ slide, active, onClick, editMode, onEdit, delay }) {
  const ref   = useRef(null);
  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [content, setContent] = useState({ title: slide.title, body: slide.body });
  const prefersReduced = useRef(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  const onMove = useCallback(e => {
    if (editMode || prefersReduced.current) return;
    const r = ref.current.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * -8,
      y: ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) *  8,
    });
  }, [editMode]);

  return (
    <article
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false); }}
      onClick={() => onClick(slide.num)}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onClick(slide.num)}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`Slide ${slide.num}: ${content.title}. ${active ? "Selected." : "Click to select."}`}
      style={{
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${hovered && !editMode ? -4 : 0}px)`,
        transition: "transform 0.15s ease",
        animationDelay: `${delay}ms`,
        cursor: "pointer",
        outline: "none",
      }}
      className="card-enter"
    >
      <div style={{
        borderRadius: 14,
        border: `1.5px solid ${active ? slide.color : "var(--border)"}`,
        background: active ? `color-mix(in srgb, ${slide.color} 6%, var(--card))` : "var(--card)",
        padding: "22px 20px", height: 162, position: "relative", overflow: "hidden",
        boxShadow: active ? `0 0 0 1px ${slide.color}30, 0 16px 36px ${slide.color}18`
                          : hovered ? "0 8px 28px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}>
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: slide.color, borderRadius: "14px 14px 0 0", opacity: active ? 1 : 0.35, transition: "opacity 0.2s" }} />
        <span aria-hidden="true" style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: slide.color, letterSpacing: "0.1em", opacity: 0.7 }}>{slide.num}</span>

        {editMode && active ? (
          <div style={{ marginTop: 6 }}>
            <label htmlFor={`slide-title-${slide.num}`} className="sr-only">Slide title</label>
            <input
              id={`slide-title-${slide.num}`}
              autoFocus
              value={content.title}
              onChange={e => { const v = { ...content, title: e.target.value }; setContent(v); onEdit(slide.num, v); }}
              onClick={e => e.stopPropagation()}
              aria-label="Edit slide title"
              style={{ fontFamily: "var(--font-display)", fontSize: 13.5, fontWeight: 700, color: "var(--fg)", background: "var(--input-bg)", border: `1px solid ${slide.color}60`, borderRadius: 6, padding: "4px 8px", width: "100%", outline: "none", marginBottom: 7 }}
            />
            <label htmlFor={`slide-body-${slide.num}`} className="sr-only">Slide body</label>
            <textarea
              id={`slide-body-${slide.num}`}
              value={content.body}
              onChange={e => { const v = { ...content, body: e.target.value }; setContent(v); onEdit(slide.num, v); }}
              onClick={e => e.stopPropagation()}
              rows={3}
              aria-label="Edit slide body text"
              style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", width: "100%", resize: "none", outline: "none", lineHeight: "1.5" }}
            />
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.025em", lineHeight: "1.3", marginBottom: 8 }}>{content.title}</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--muted)", lineHeight: "1.55" }}>{content.body}</p>
          </div>
        )}
        <div aria-hidden="true" style={{ position: "absolute", bottom: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${slide.color}20, transparent 70%)`, pointerEvents: "none" }} />
      </div>
    </article>
  );
});

/* ─── AI Progress Modal ─────────────────────────────────────────────────────── */
const AIProgressModal = memo(function AIProgressModal({ step, topic }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI is generating your presentation"
      aria-live="polite"
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(15,15,15,0.72)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}
    >
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 420, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", animation: "spin-slow 3s linear infinite", boxShadow: "0 4px 16px rgba(249,115,22,0.35)", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M4 7h14M4 11h10M4 15h7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, color: "#0f0f0f", letterSpacing: "-0.03em" }}>Creating your deck</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#9ca3af", marginTop: 2, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic}</p>
          </div>
        </div>

        <ol role="list" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {AI_STEPS.map((s, i) => {
            const done = i < step, active = i === step;
            return (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", borderRadius: 10, background: active ? "#fff7ed" : "transparent", transition: "background 0.3s" }}
                aria-current={active ? "step" : undefined}
              >
                <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: done ? "#f97316" : active ? "transparent" : "#f3f4f6", border: active ? "2px solid #f97316" : "none", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                  {done   && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", animation: "breathe 1s ease infinite" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: active ? 600 : 400, color: done ? "#9ca3af" : active ? "#0f0f0f" : "#d1d5db", textDecoration: done ? "line-through" : "none", transition: "all 0.3s" }}>{s.label}</p>
                  {active && <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#f97316", marginTop: 1 }}>{s.detail}</p>}
                </div>
                {active && (
                  <div aria-hidden="true" style={{ display: "flex", gap: 3 }}>
                    {[0,1,2].map(d => <div key={d} style={{ width: 4, height: 4, borderRadius: "50%", background: "#f97316", animation: "bounce 1s ease infinite", animationDelay: `${d*0.15}s` }} />)}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div role="progressbar" aria-valuenow={Math.round(((step+1)/AI_STEPS.length)*100)} aria-valuemin={0} aria-valuemax={100} aria-label="Generation progress" style={{ marginTop: 24, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((step+1)/AI_STEPS.length)*100}%`, background: "linear-gradient(90deg,#f97316,#f43f5e)", borderRadius: 99, transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)" }} />
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#d1d5db", textAlign: "right", marginTop: 6 }} aria-live="polite">
          {Math.round(((step+1)/AI_STEPS.length)*100)}% complete
        </p>
      </div>
    </div>
  );
});

/* ─── Stat item ─────────────────────────────────────────────────────────────── */
const StatItem = memo(function StatItem({ stat, trigger }) {
  const val = useCountUp(stat.value, 1600, trigger, stat.decimal);
  return (
    <div style={{ textAlign: "center", padding: "36px 16px" }}>
      <p aria-label={`${stat.value}${stat.suffix}`} style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px,4vw,42px)", fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.05em", lineHeight: 1 }}>
        <span aria-hidden="true">{val}{stat.suffix}</span>
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>{stat.label}</p>
    </div>
  );
});

/* ─── FAQ item ──────────────────────────────────────────────────────────────── */
const FAQItem = memo(function FAQItem({ item, open, onToggle, idx }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`faq-answer-${idx}`}
        id={`faq-question-${idx}`}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "22px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, textAlign: "left" }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(15px,2vw,16.5px)", fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em", lineHeight: 1.3 }}>{item.q}</span>
        <div aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 8, background: open ? "#f97316" : "var(--chip-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M6 2v8M2 6h8" stroke={open ? "white" : "var(--muted)"} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </button>
      <div
        id={`faq-answer-${idx}`}
        role="region"
        aria-labelledby={`faq-question-${idx}`}
        hidden={!open}
      >
        {open && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(13px,1.6vw,14.5px)", color: "var(--muted)", lineHeight: 1.7, paddingBottom: 20, maxWidth: 640 }}>{item.a}</p>
        )}
      </div>
    </div>
  );
});

/* ─── Main App ───────────────────────────────────────────────────────────────── */
export default function App() {
  const [topic,       setTopic]       = useState("");
  const [slideCount,  setSlideCount]  = useState(8);
  const [loading,     setLoading]     = useState(false);
  const [aiStep,      setAiStep]      = useState(0);
  const [activeSlide, setActiveSlide] = useState(null);
  const [editMode,    setEditMode]    = useState(false);
  const [toast,       setToast]       = useState(null);
  const [statsVisible,setStatsVisible]= useState(false);
  const [theme,       setTheme]       = useState("light");
  const [exportMenu,  setExportMenu]  = useState(false);
  const [faqOpen,     setFaqOpen]     = useState(null);

  const inputRef  = useRef(null);
  const statsRef  = useRef(null);
  const exportRef = useRef(null);

  /* Typewriter */
  const [typed, setTyped] = useState(""); const [tIdx, setTIdx] = useState(0);
  const [cIdx,  setCIdx]  = useState(0);  const [del,  setDel]  = useState(false);
  useEffect(() => {
    const cur = SUGGESTIONS[tIdx];
    let t;
    if (!del && cIdx < cur.length) t = setTimeout(() => { setTyped(cur.slice(0,cIdx+1)); setCIdx(c=>c+1); }, 48);
    else if (!del && cIdx === cur.length) t = setTimeout(() => setDel(true), 2200);
    else if (del && cIdx > 0)            t = setTimeout(() => { setTyped(cur.slice(0,cIdx-1)); setCIdx(c=>c-1); }, 22);
    else { setDel(false); setTIdx(t=>(t+1)%SUGGESTIONS.length); }
    return () => clearTimeout(t);
  }, [cIdx, del, tIdx]);

  /* Stats IntersectionObserver */
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  /* AI steps progression */
  useEffect(() => {
    if (!loading) return;
    setAiStep(0);
    const ts = AI_STEPS.map((_,i) => setTimeout(() => setAiStep(i), i*950));
    return () => ts.forEach(clearTimeout);
  }, [loading]);

  /* Close export menu on outside click */
  useEffect(() => {
    if (!exportMenu) return;
    const h = e => { if (!exportRef.current?.contains(e.target)) setExportMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [exportMenu]);

  /* Apply theme class to root */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const { items: orderedSlides, onDragStart, onDragOver, onDragEnd } = useDragOrder(SLIDE_SAMPLES);
  const [slideData, setSlideData] = useState(SLIDE_SAMPLES);
  const handleEditSlide = useCallback((num, v) => setSlideData(p => p.map(s => s.num === num ? { ...s, ...v } : s)), []);

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3800);
  }, []);

  const generate = useCallback(async () => {
    if (!topic.trim()) { inputRef.current?.focus(); return; }
    setLoading(true);
    try {
      const res  = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, slides: slideCount }) });
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href = url; a.download = `${topic}.pptx`; a.click();
      window.URL.revokeObjectURL(url);
      showToast(`${topic}.pptx saved to your downloads`);
    } catch { showToast("Generation failed. Please try again.", false); }
    finally { setLoading(false); }
  }, [topic, slideCount, showToast]);

  return (
    <>
      {/* ── Global styles + responsive breakpoints ───────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&display=swap');

        /* === Reset === */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
        body { font-family: var(--font-body); background: var(--bg); color: var(--fg); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
        img, svg { display: block; max-width: 100%; }
        a { color: inherit; }
        button { font-family: inherit; }
        ul, ol { list-style: none; }

        /* === CSS custom properties (light default) === */
        :root {
          --font-display: 'Cabinet Grotesk', system-ui, sans-serif;
          --font-body:    'Plus Jakarta Sans', system-ui, sans-serif;
          --bg:       #fffcf8;
          --fg:       #0f0f0f;
          --muted:    #6b7280;
          --card:     #ffffff;
          --border:   #e9e9e9;
          --chip-bg:  #f3f4f6;
          --input-bg: #f9f9f9;
          --section-alt: #f9f7f4;
          --nav-link-hover: #0f0f0f;
          --accent: #f97316;
          --accent2: #f43f5e;
        }
        [data-theme="dark"] {
          --bg:       #0c0c0e;
          --fg:       #f5f5f5;
          --muted:    rgba(255,255,255,0.48);
          --card:     rgba(255,255,255,0.04);
          --border:   rgba(255,255,255,0.08);
          --chip-bg:  rgba(255,255,255,0.08);
          --input-bg: rgba(255,255,255,0.06);
          --section-alt: rgba(255,255,255,0.02);
          --nav-link-hover: #fff;
        }

        /* === Animations (respects reduced motion) === */
        @media (prefers-reduced-motion: no-preference) {
          @keyframes breathe     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.6)} }
          @keyframes bounce      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
          @keyframes fadeSlide   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes spin-slow   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          @keyframes fadeIn      { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes fadeMenu    { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        }

        /* Screen-reader only utility */
        .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border-width:0; }

        /* Card entrance */
        .card-enter { animation: fadeIn 0.5s ease both; }

        /* === Focus visible (keyboard nav) === */
        :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }

        /* === Navbar === */
        .nav-inner { max-width:1180px; margin:0 auto; padding:0 28px; height:62px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .logo-link  { display:flex; align-items:center; gap:8px; text-decoration:none; }
        .logo-icon  { width:32px; height:32px; border-radius:9px; background:linear-gradient(135deg,#f97316,#f43f5e); display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(249,115,22,.35); flex-shrink:0; }
        .logo-text  { font-family:var(--font-display); font-weight:800; font-size:17px; color:var(--fg); letter-spacing:-0.04em; }
        .nav-links  { display:flex; gap:28px; align-items:center; padding:0; margin:0; list-style:none; }
        .nav-link   { font-family:var(--font-body); font-size:14px; font-weight:500; text-decoration:none; transition:color .15s; padding:4px 0; }
        .nav-link:hover { color:var(--nav-link-hover) !important; }
        .nav-actions { display:flex; gap:10px; align-items:center; }
        .signin-link { font-family:var(--font-body); font-size:13px; font-weight:500; text-decoration:none; padding:7px 14px; transition:color .15s; }
        .signin-link:hover { color:var(--fg) !important; }
        .theme-btn  { background:none; border:none; cursor:pointer; padding:8px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition:background .15s; }
        .theme-btn:hover { background:var(--chip-bg); }
        .cta-btn-nav { font-family:var(--font-body); font-size:13.5px; font-weight:600; color:#fff; background:#0f0f0f; border:none; border-radius:9px; padding:9px 20px; cursor:pointer; transition:all .18s; letter-spacing:-0.01em; white-space:nowrap; }
        .cta-btn-nav:hover { background:var(--accent); box-shadow:0 6px 20px rgba(249,115,22,.35); transform:translateY(-1px); }
        [data-theme="dark"] .cta-btn-nav { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); }
        [data-theme="dark"] .cta-btn-nav:hover { background:var(--accent); border-color:var(--accent); }
        .hamburger { display:none; background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; }
        .mobile-menu { padding:16px 28px 24px; }
        .mobile-link { display:block; font-family:var(--font-body); font-size:16px; font-weight:500; text-decoration:none; padding:13px 0; border-bottom:1px solid var(--border); transition:color .15s; }
        .mobile-cta  { margin-top:20px; width:100%; font-family:var(--font-body); font-size:15px; font-weight:700; color:#fff; background:linear-gradient(135deg,#f97316,#f43f5e); border:none; border-radius:12px; padding:14px 24px; cursor:pointer; letter-spacing:-0.01em; }

        /* === Section labels === */
        .section-label { display:inline-block; font-family:var(--font-body); font-size:12px; font-weight:600; color:var(--accent); letter-spacing:.08em; text-transform:uppercase; margin-bottom:12px; }
        .section-title { font-family:var(--font-display); font-weight:800; letter-spacing:-0.04em; color:var(--fg); line-height:1.1; }

        /* === Chip button === */
        .chip { font-family:var(--font-body); font-size:12.5px; font-weight:500; color:var(--muted); background:var(--card); border:1px solid var(--border); border-radius:99px; padding:6px 13px; cursor:pointer; transition:all .15s; }
        .chip:hover { border-color:var(--accent); color:var(--accent); background:var(--chip-bg); }

        /* === Hover lift === */
        .hover-lift { transition:transform .18s ease, box-shadow .18s ease; }
        .hover-lift:hover { transform:translateY(-3px); }

        /* === Export menu animation === */
        .export-menu { animation:fadeMenu .15s ease both; }

        /* === Drag card === */
        .drag-card { cursor:grab; }
        .drag-card:active { cursor:grabbing; opacity:.6; }

        /* === Scrollbar === */
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#e5e5e5; border-radius:99px; }

        /* ===================================================
           RESPONSIVE BREAKPOINTS
        =================================================== */

        /* ── Tablet (≤ 1024px) ── */
        @media (max-width: 1024px) {
          .nav-links    { gap: 20px; }
          .signin-link  { display: none; }
          .how-grid     { grid-template-columns: repeat(2,1fr) !important; }
          .how-grid > div:first-child { border-radius: 14px 14px 0 0 !important; }
          .how-grid > div:last-child  { border-radius: 0 0 14px 14px !important; grid-column: span 2; }
          .stats-grid   { grid-template-columns: repeat(2,1fr) !important; }
          .footer-grid  { grid-template-columns: 1fr 1fr !important; }
        }

        /* ── Mobile (≤ 768px) ── */
        @media (max-width: 768px) {
          .nav-links    { display: none; }
          .theme-btn    { display: none; }
          .cta-btn-nav  { display: none; }
          .hamburger    { display: flex !important; }

          /* Hero */
          .hero-section { padding: 100px 20px 64px !important; }
          .hero-h1      { font-size: clamp(36px,10vw,52px) !important; }

          /* Input box */
          .input-bottom-row  { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .slide-counter     { justify-content: flex-start; }
          .gen-btn-wrap      { width: 100%; }
          .gen-btn-wrap > button { width: 100%; justify-content: center; }

          /* Chips */
          .chip-row { justify-content: flex-start !important; overflow-x: auto; flex-wrap: nowrap !important; padding-bottom: 8px; scrollbar-width: none; -ms-overflow-style: none; }
          .chip-row::-webkit-scrollbar { display: none; }

          /* Slide preview */
          .preview-header { flex-direction: column !important; align-items: flex-start !important; }
          .slides-grid    { grid-template-columns: repeat(auto-fill, minmax(160px,1fr)) !important; gap: 8px !important; }

          /* Features */
          .features-grid  { grid-template-columns: 1fr !important; }

          /* How it works */
          .how-grid       { grid-template-columns: 1fr !important; }
          .how-grid > div { border-radius: 14px !important; border: 1px solid var(--border) !important; }
          .how-grid > div:not(:first-child) { border-left: 1px solid var(--border) !important; margin-top: 4px; }

          /* Stats */
          .stats-grid     { grid-template-columns: repeat(2,1fr) !important; }
          .stats-grid > div { border-right: none !important; border-bottom: 1px solid var(--border) !important; }

          /* CTA banner */
          .cta-banner { padding: 40px 28px !important; }

          /* Footer */
          .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .footer-bottom { flex-direction: column !important; gap: 8px !important; text-align: center; }

          /* FAQ sticky col → flat */
          .faq-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
          .faq-sticky { position: static !important; }
        }

        /* ── Small mobile (≤ 480px) ── */
        @media (max-width: 480px) {
          .nav-inner { padding: 0 16px; }
          .hero-section { padding: 96px 16px 56px !important; }
          .section-pad { padding: 56px 16px !important; }
          .stat-num { font-size: 28px !important; }
        }
      `}</style>

      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

        {/* ── HIDDEN SEO METADATA structure (as visible landmark h tags) ── */}
        {/* The page uses proper heading hierarchy: h1 in hero, h2 per section */}

        <Navbar onCTA={() => inputRef.current?.focus()} theme={theme} setTheme={setTheme} />

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <main id="main-content">
          <section
            aria-labelledby="hero-heading"
            className="hero-section"
            style={{ position: "relative", overflow: "hidden", paddingTop: 130, paddingBottom: 80, paddingLeft: 28, paddingRight: 28 }}
          >
            {/* Decorative bg — hidden from AT */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(249,115,22,0.08) 0%, transparent 60%)" }} />
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "80px 80px", opacity: 0.5 }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
              <h1
                id="hero-heading"
                className="hero-h1"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px,7vw,76px)", fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.045em", lineHeight: 1.0, marginBottom: 22 }}
              >
                Your next great presentation,{" "}
                <span
                  aria-label="written by AI"
                  style={{ background: "linear-gradient(135deg,#f97316 0%,#f43f5e 100%)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gradient-shift 4s ease infinite" }}
                >
                  written by AI.
                </span>
              </h1>

              <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px,2.5vw,18px)", color: "var(--muted)", lineHeight: 1.65, maxWidth: 520, margin: "0 auto 48px", fontWeight: 400 }}>
                Describe your topic. Choose your slide count. Download a polished, editable PowerPoint in seconds — no design skills needed.
              </p>

              {/* ── Prompt input ── */}
              <div
                role="search"
                aria-label="Presentation generator"
                style={{ background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 16, padding: 8, boxShadow: "0 4px 32px rgba(0,0,0,0.07)", maxWidth: 660, margin: "0 auto 18px" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", padding: "8px 14px 0", gap: 10 }}>
                  <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginTop: 3, flexShrink: 0 }}>
                    <circle cx="9" cy="9" r="7.5" stroke="var(--accent)" strokeWidth="1.4"/>
                    <path d="M9 6v3l2 2" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <label htmlFor="topic-input" className="sr-only">Describe your presentation topic</label>
                  <textarea
                    id="topic-input"
                    ref={inputRef}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), generate())}
                    placeholder={typed || "Describe your presentation topic…"}
                    rows={2}
                    aria-describedby="topic-hint"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--fg)", lineHeight: 1.6, paddingTop: 1 }}
                  />
                </div>
                <p id="topic-hint" className="sr-only">Press Enter or click Generate to create your presentation</p>

                <div className="input-bottom-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px 8px", marginTop: 4, gap: 10 }}>
                  {/* Slide count */}
                  <div className="slide-counter" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>Slides:</span>
                    <div role="group" aria-label="Number of slides" style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--chip-bg)", borderRadius: 8, padding: "4px 10px", border: "1px solid var(--border)" }}>
                      <button onClick={() => setSlideCount(s => Math.max(3,s-1))} aria-label="Decrease slide count" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1, padding: "0 2px", fontWeight: 600 }}>−</button>
                      <output aria-live="polite" aria-label={`${slideCount} slides`} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--fg)", minWidth: 22, textAlign: "center" }}>{slideCount}</output>
                      <button onClick={() => setSlideCount(s => Math.min(20,s+1))} aria-label="Increase slide count" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1, padding: "0 2px", fontWeight: 600 }}>+</button>
                    </div>
                  </div>

                  {/* Generate button */}
                  <div className="gen-btn-wrap">
                    <button
                      onClick={generate}
                      disabled={loading || !topic.trim()}
                      aria-busy={loading}
                      aria-label={loading ? "Generating presentation, please wait" : "Generate presentation"}
                      style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", padding: "10px 24px", borderRadius: 10, background: loading || !topic.trim() ? "var(--chip-bg)" : "linear-gradient(135deg,#f97316,#f43f5e)", color: loading || !topic.trim() ? "var(--muted)" : "#fff", border: "none", cursor: loading || !topic.trim() ? "not-allowed" : "pointer", transition: "all .18s", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: loading || !topic.trim() ? "none" : "0 4px 16px rgba(249,115,22,.35)", whiteSpace: "nowrap" }}
                      onMouseEnter={e => { if (!loading && topic.trim()) { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(249,115,22,.45)"; }}}
                      onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=loading||!topic.trim()?"none":"0 4px 16px rgba(249,115,22,.35)"; }}
                    >
                      {loading ? (
                        <>
                          <span aria-hidden="true" style={{ width:13, height:13, border:"2px solid rgba(255,255,255,.35)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .65s linear infinite", display:"inline-block" }} />
                          Generating…
                        </>
                      ) : "Generate →"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Chips */}
              <div>
                <p style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--muted)", marginBottom:10, fontWeight:500 }}>
                  Popular topics →
                </p>
                <div className="chip-row" style={{ display:"flex", gap:7, flexWrap:"wrap", justifyContent:"center" }}>
                  {CHIPS.map(c => (
                    <button key={c} className="chip" onClick={() => setTopic(c)} aria-label={`Use topic: ${c}`}>{c}</button>
                  ))}
                </div>
              </div>

              {/* Stats strip */}
              <div role="list" aria-label="Key statistics" style={{ display:"flex", justifyContent:"center", flexWrap:"wrap", gap:0, marginTop:64, paddingTop:40, borderTop:"1px solid var(--border)" }}>
                {[
                  { n:"14,000+", l:"Presentations created" },
                  { n:"< 28s",   l:"Median generation time" },
                  { n:"4.9 / 5",l:"User satisfaction" },
                ].map((s,i) => (
                  <div key={s.l} role="listitem" style={{ padding:"0 28px", textAlign:"center", borderLeft: i>0 ? "1px solid var(--border)" : "none" }}>
                    <p style={{ fontFamily:"var(--font-display)", fontSize:"clamp(22px,4vw,30px)", fontWeight:800, color:"var(--fg)", letterSpacing:"-0.045em" }}>{s.n}</p>
                    <p style={{ fontFamily:"var(--font-body)", fontSize:12.5, color:"var(--muted)", marginTop:4, fontWeight:500 }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── SLIDE PREVIEW ──────────────────────────────────────────────── */}
          <section
            aria-labelledby="preview-heading"
            className="section-pad"
            style={{ padding:"72px 28px", background:"var(--section-alt)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}
          >
            <div style={{ maxWidth:1120, margin:"0 auto" }}>
              <div className="preview-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:36, flexWrap:"wrap", gap:16 }}>
                <div>
                  <span className="section-label">Live preview</span>
                  <h2 id="preview-heading" className="section-title" style={{ fontSize:"clamp(22px,3vw,36px)" }}>What your deck will look like</h2>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--muted)", marginTop:8 }}>Hover to tilt · Click to select · Drag to reorder · Toggle edit mode</p>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  {/* Export menu */}
                  <div ref={exportRef} style={{ position:"relative" }}>
                    <button
                      onClick={() => setExportMenu(m=>!m)}
                      aria-expanded={exportMenu}
                      aria-haspopup="menu"
                      style={{ fontFamily:"var(--font-body)", fontSize:13, fontWeight:600, color:"var(--muted)", background:"var(--card)", border:`1px solid var(--border)`, borderRadius:8, padding:"8px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all .15s" }}
                    >
                      Export ▾
                    </button>
                    {exportMenu && (
                      <ul
                        role="menu"
                        aria-label="Export options"
                        className="export-menu"
                        style={{ position:"absolute", right:0, top:"calc(100% + 6px)", background:"var(--card)", border:`1px solid var(--border)`, borderRadius:10, padding:6, minWidth:180, boxShadow:"0 8px 28px rgba(0,0,0,0.12)", zIndex:100, listStyle:"none" }}
                      >
                        {[".pptx — PowerPoint", ".pdf — PDF Export", "Google Slides"].map(opt => (
                          <li key={opt} role="menuitem">
                            <button
                              onClick={() => { generate(); setExportMenu(false); }}
                              style={{ width:"100%", textAlign:"left", fontFamily:"var(--font-body)", fontSize:13, color:"var(--fg)", padding:"9px 12px", borderRadius:7, cursor:"pointer", background:"none", border:"none", transition:"background .12s" }}
                              onMouseEnter={e => e.currentTarget.style.background="var(--chip-bg)"}
                              onMouseLeave={e => e.currentTarget.style.background="none"}
                            >{opt}</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => setEditMode(m=>!m)}
                    aria-pressed={editMode}
                    style={{ fontFamily:"var(--font-body)", fontSize:13, fontWeight:600, color:editMode?"#f97316":"var(--muted)", background:editMode?"#fff7ed":"var(--card)", border:`1.5px solid ${editMode?"rgba(249,115,22,.35)":"var(--border)"}`, borderRadius:8, padding:"8px 14px", cursor:"pointer", transition:"all .15s" }}
                  >
                    {editMode ? "✏ Editing" : "Edit slides"}
                  </button>
                </div>
              </div>

              {editMode && (
                <div role="status" style={{ marginBottom:20, padding:"10px 16px", background:"#fff7ed", border:"1px solid rgba(249,115,22,.2)", borderRadius:9 }}>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:13, color:"#c2410c" }}>
                    Click any slide to select it, then edit title and content. Drag slides to reorder.
                  </p>
                </div>
              )}

              <div className="slides-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(196px,1fr))", gap:12 }}>
                {orderedSlides.map((slide, i) => (
                  <div
                    key={slide.num}
                    className="drag-card"
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={e => onDragOver(e,i)}
                    onDragEnd={onDragEnd}
                    aria-label={`Drag to reorder slide ${slide.num}`}
                  >
                    <SlideCard3D
                      slide={slideData.find(s=>s.num===slide.num)||slide}
                      active={activeSlide===slide.num}
                      onClick={n => setActiveSlide(activeSlide===n?null:n)}
                      editMode={editMode}
                      onEdit={handleEditSlide}
                      delay={i*50}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FEATURES ─────────────────────────────────────────────────── */}
          <section id="features" aria-labelledby="features-heading" className="section-pad" style={{ padding:"96px 28px", maxWidth:1120, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:64 }}>
              <span className="section-label">Why Prompt2Craft</span>
              <h2 id="features-heading" className="section-title" style={{ fontSize:"clamp(28px,4vw,46px)" }}>
                Built different.<br />Works better.
              </h2>
            </div>

            <ul role="list" className="features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16, padding:0 }}>
              {FEATURES.map((f,i) => (
                <li key={f.title} className="hover-lift"
                  style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:16, padding:"28px 26px", listStyle:"none", transition:"all .2s", boxShadow:"0 2px 8px rgba(0,0,0,.03)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.background="color-mix(in srgb,var(--accent) 4%,var(--card))"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--card)"; }}
                >
                  <div aria-hidden="true" style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#fff7ed,#ffedd5)", border:"1px solid rgba(249,115,22,.15)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
                    {f.visual==="brain" && <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3C7.68 3 5 5.68 5 9c0 2.1 1.05 3.96 2.66 5.1A4 4 0 0011 19a4 4 0 003.34-4.9C15.95 12.96 17 11.1 17 9c0-3.32-2.68-6-6-6z" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round"/></svg>}
                    {f.visual==="bolt"  && <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M13 3L5 13h7l-1 6 8-10h-7l1-6z" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></svg>}
                    {f.visual==="star"  && <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2l2.6 6h6.4l-5.2 4 2 6.4L11 15l-5.8 3.4 2-6.4L2 8h6.4L11 2z" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round"/></svg>}
                    {f.visual==="edit"  && <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M15 5l2 2-10 10H5v-2L15 5z" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 18h14" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  </div>
                  <div aria-label={f.tag} style={{ display:"inline-block", background:"#fff7ed", border:"1px solid rgba(249,115,22,.2)", borderRadius:6, padding:"2px 8px", marginBottom:12 }}>
                    <span style={{ fontFamily:"var(--font-body)", fontSize:11, fontWeight:700, color:"var(--accent)", letterSpacing:"0.06em" }}>{f.tag}</span>
                  </div>
                  <h3 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(15px,2vw,17px)", fontWeight:700, color:"var(--fg)", letterSpacing:"-0.025em", marginBottom:10, lineHeight:1.3 }}>{f.title}</h3>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:13.5, color:"var(--muted)", lineHeight:1.65 }}>{f.desc}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
          <section id="how-it-works" aria-labelledby="how-heading" className="section-pad" style={{ padding:"96px 28px", background:"var(--section-alt)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>
            <div style={{ maxWidth:1120, margin:"0 auto" }}>
              <div style={{ textAlign:"center", marginBottom:64 }}>
                <span className="section-label">How it works</span>
                <h2 id="how-heading" className="section-title" style={{ fontSize:"clamp(28px,4vw,46px)" }}>
                  From prompt to presentation<br />in four steps
                </h2>
              </div>

              <ol role="list" className="how-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4, padding:0 }}>
                {[
                  { n:"1", t:"Write your prompt",   d:"Describe your topic, audience, or purpose. One sentence or a full brief — the AI adapts." },
                  { n:"2", t:"Choose slide count",   d:"Pick 3 to 20 slides. Content depth and structure adjust automatically." },
                  { n:"3", t:"AI builds your deck",  d:"Watch the live progress as AI writes content, applies layout, and designs each slide." },
                  { n:"4", t:"Download & present",   d:"Get a native .pptx file. Edit it, brand it, or present it as-is — it's already polished.", highlight:true },
                ].map((s,i) => (
                  <li key={i} role="listitem"
                    style={{ padding:"36px 28px", background: s.highlight?"linear-gradient(135deg,#f97316,#f43f5e)":"var(--card)", borderRadius: i===0?"14px 0 0 14px": i===3?"0 14px 14px 0":0, border: s.highlight?"none":`1px solid var(--border)`, borderLeft: i>0&&!s.highlight?"none":undefined, position:"relative", transition:"background .2s", listStyle:"none" }}
                    onMouseEnter={e => { if (!s.highlight) e.currentTarget.style.background="color-mix(in srgb,var(--accent) 4%,var(--card))"; }}
                    onMouseLeave={e => { if (!s.highlight) e.currentTarget.style.background="var(--card)"; }}
                  >
                    <div aria-hidden="true" style={{ width:36, height:36, borderRadius:10, background: s.highlight?"rgba(255,255,255,.25)":"#fff7ed", border: s.highlight?"none":"1px solid rgba(249,115,22,.15)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:22 }}>
                      <span style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:16, color: s.highlight?"#fff":"var(--accent)" }}>{s.n}</span>
                    </div>
                    <h3 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(15px,2vw,17px)", fontWeight:700, color: s.highlight?"#fff":"var(--fg)", letterSpacing:"-0.025em", marginBottom:10, lineHeight:1.25 }}>{s.t}</h3>
                    <p style={{ fontFamily:"var(--font-body)", fontSize:13, color: s.highlight?"rgba(255,255,255,.8)":"var(--muted)", lineHeight:1.65 }}>{s.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── STATS ────────────────────────────────────────────────────── */}
          <section ref={statsRef} aria-labelledby="stats-heading" className="section-pad" style={{ padding:"80px 28px" }}>
            <div style={{ maxWidth:900, margin:"0 auto" }}>
              <h2 id="stats-heading" className="sr-only">Product statistics</h2>
              <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", background:"var(--card)", border:"1px solid var(--border)", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,.05)" }}>
                {STATS.map((s,i) => (
                  <div key={s.label}
                    style={{ borderRight: i<3?`1px solid var(--border)`:"none", borderTop:"3px solid transparent", transition:"border-top-color .3s" }}
                    onMouseEnter={e => e.currentTarget.style.borderTopColor="var(--accent)"}
                    onMouseLeave={e => e.currentTarget.style.borderTopColor="transparent"}
                  >
                    <StatItem stat={s} trigger={statsVisible} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ─────────────────────────────────────────────────────── */}
          <section id="faq" aria-labelledby="faq-heading" className="section-pad" style={{ padding:"96px 28px", background:"var(--section-alt)", borderTop:"1px solid var(--border)" }}>
            <div className="faq-layout" style={{ maxWidth:1000, margin:"0 auto", display:"grid", gridTemplateColumns:"280px 1fr", gap:64, alignItems:"start" }}>
              <div className="faq-sticky" style={{ position:"sticky", top:88 }}>
                <span className="section-label">FAQ</span>
                <h2 id="faq-heading" className="section-title" style={{ fontSize:"clamp(26px,3.5vw,38px)", marginBottom:14 }}>
                  Questions we hear a lot
                </h2>
                <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--muted)", lineHeight:1.7 }}>
                  Anything else? Reach out via our contact page.
                </p>
              </div>
              <div>
                <div style={{ borderTop:"1px solid var(--border)" }}>
                  {FAQS.map((item,i) => (
                    <FAQItem key={i} item={item} idx={i} open={faqOpen===i} onToggle={() => setFaqOpen(faqOpen===i?null:i)} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA BANNER ──────────────────────────────────────────────── */}
          <section aria-labelledby="cta-heading" className="section-pad" style={{ padding:"80px 28px", borderTop:"1px solid var(--border)" }}>
            <div style={{ maxWidth:700, margin:"0 auto", textAlign:"center" }}>
              <div className="cta-banner" style={{ background:"linear-gradient(135deg,#f97316,#f43f5e)", borderRadius:24, padding:"56px 40px", position:"relative", overflow:"hidden" }}>
                <div aria-hidden="true" style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", border:"40px solid rgba(255,255,255,.08)", pointerEvents:"none" }} />
                <div aria-hidden="true" style={{ position:"absolute", bottom:-40, left:-40, width:160, height:160, borderRadius:"50%", border:"30px solid rgba(255,255,255,.06)", pointerEvents:"none" }} />
                <h2 id="cta-heading" style={{ fontFamily:"var(--font-display)", fontSize:"clamp(24px,4vw,40px)", fontWeight:800, color:"#fff", letterSpacing:"-0.04em", marginBottom:14, lineHeight:1.1, position:"relative", zIndex:1 }}>
                  Your next deck is one prompt away.
                </h2>
                <p style={{ fontFamily:"var(--font-body)", fontSize:16, color:"rgba(255,255,255,.82)", marginBottom:32, lineHeight:1.6, position:"relative", zIndex:1 }}>
                  No credit card. No design skills. Just your idea.
                </p>
                <button
                  onClick={() => { window.scrollTo({ top:0, behavior:"smooth" }); setTimeout(() => inputRef.current?.focus(), 600); }}
                  aria-label="Go to generator and create your first presentation"
                  style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:800, letterSpacing:"-0.025em", color:"var(--accent)", background:"#fff", border:"none", borderRadius:12, padding:"14px 32px", cursor:"pointer", transition:"all .18s", boxShadow:"0 4px 20px rgba(0,0,0,.15)", position:"relative", zIndex:1 }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 10px 30px rgba(0,0,0,.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.15)"; }}
                >
                  Generate your first deck →
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer role="contentinfo" style={{ borderTop:"1px solid var(--border)", padding:"60px 28px 36px", background:"#0f0f0f" }}>
          <div style={{ maxWidth:1120, margin:"0 auto" }}>
            <div className="footer-grid" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:40, paddingBottom:48, borderBottom:"1px solid rgba(255,255,255,.08)", marginBottom:28 }}>
              <div>
                <a href="/" aria-label="Prompt2Craft home" className="logo-link" style={{ marginBottom:16, display:"inline-flex" }}>
                  <div className="logo-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 5h10M3 8h7M3 11h5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <span style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:16, color:"#fff", letterSpacing:"-0.04em", marginLeft:8 }}>Prompt2Craft</span>
                </a>
                <p style={{ fontFamily:"var(--font-body)", fontSize:13, color:"rgba(255,255,255,.35)", lineHeight:1.7, maxWidth:220 }}>
                  AI-powered presentations for people who have better things to do than format slides.
                </p>
              </div>
              {[
                { title:"Product",   links:["AI Generator","Templates","API","Changelog","Pricing"] },
                { title:"Resources", links:["Documentation","Blog","Examples","Support","Status"] },
                { title:"Company",   links:["About","Careers","Privacy policy","Terms of service","Contact"] },
              ].map(col => (
                <nav key={col.title} aria-label={`${col.title} links`}>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:12, fontWeight:600, color:"rgba(255,255,255,.35)", letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:16 }}>{col.title}</p>
                  <ul role="list" style={{ display:"flex", flexDirection:"column", gap:10, padding:0 }}>
                    {col.links.map(l => (
                      <li key={l}>
                        <a href="#" style={{ fontFamily:"var(--font-body)", fontSize:13.5, color:"rgba(255,255,255,.5)", textDecoration:"none", transition:"color .15s" }}
                          onMouseEnter={e => e.target.style.color="#fff"}
                          onMouseLeave={e => e.target.style.color="rgba(255,255,255,.5)"}
                        >{l}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
            <div className="footer-bottom" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
              <p style={{ fontFamily:"var(--font-body)", fontSize:12.5, color:"rgba(255,255,255,.25)" }}>© 2025 Prompt2Craft, Inc. All rights reserved.</p>
              <p style={{ fontFamily:"var(--font-body)", fontSize:12.5, color:"rgba(255,255,255,.25)" }}>Made for the people who build things.</p>
            </div>
          </div>
        </footer>

        {/* ── AI OVERLAY ──────────────────────────────────────────────────── */}
        {loading && <AIProgressModal step={aiStep} topic={topic} />}

        {/* ── TOAST ─────────────────────────────────────────────────────── */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{ position:"fixed", bottom:24, right:24, zIndex:8000, background:"var(--card)", border:`1px solid ${toast.ok?"rgba(16,185,129,.2)":"rgba(239,68,68,.2)"}`, borderRadius:12, padding:"13px 18px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 16px 40px rgba(0,0,0,.12)", animation:"fadeSlide .25s ease both", maxWidth:360 }}
          >
            <div aria-hidden="true" style={{ width:22, height:22, borderRadius:"50%", background: toast.ok?"#10b981":"#ef4444", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                {toast.ok
                  ? <path d="M2 5l2 2.5 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  : <path d="M3 3l4 4M7 3l-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                }
              </svg>
            </div>
            <p style={{ fontFamily:"var(--font-body)", fontSize:13.5, color:"var(--fg)", fontWeight:500 }}>{toast.msg}</p>
          </div>
        )}
      </div>
    </>
  );
}