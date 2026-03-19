import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeStyles } from "./components/ThemeStyles";
import { useAuth } from "./context/authContextShared";
import {
  clampSlideCount,
  createPresentationFilename,
  FREE_GENERATION_LIMIT,
  MAX_PPT_PHOTOS,
  normalizeSlides,
  PAID_GENERATION_PRICE_INR,
} from "./lib/presentation";
import { loadRazorpayCheckout } from "./lib/razorpay";
import { ensureUserUsageRecord, incrementUserUsage } from "./lib/supabaseClient";
import { createPaymentOrder, previewPresentation, verifyPayment } from "./services/api";

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
  "Startup pitch",
  "Business review",
  "Product roadmap",
  "Research report",
  "Marketing strategy",
  "Board meeting",
  "Sales deck",
  "Team onboarding",
];

const AI_STEPS = [
  { label: "Analyzing your topic", detail: "Understanding context and intent" },
  { label: "Building slide outline", detail: "Structuring narrative flow" },
  { label: "Writing slide content", detail: "Crafting compelling copy" },
  { label: "Applying visual design", detail: "Layout, typography and color" },
  { label: "Packaging your file", detail: "Compiling the final PPTX" },
];

const FEATURES = [
  {
    title: "AI that actually understands you",
    desc: "Prompt2Craft builds a real narrative with structure, pacing, and audience-aware flow.",
    tag: "Smart",
    visual: "brain",
  },
  {
    title: "Ready in under 30 seconds",
    desc: "Go from idea to presentation without choosing templates or fixing layout after the fact.",
    tag: "Fast",
    visual: "bolt",
  },
  {
    title: "Looks like a designer made it",
    desc: "Typography, spacing, and hierarchy are handled automatically so every slide feels intentional.",
    tag: "Beautiful",
    visual: "star",
  },
  {
    title: "Preview before you download",
    desc: "Review a presentation preview, then export the PPT only when you are satisfied with it.",
    tag: "Review",
    visual: "edit",
  },
];

const SAAS_FEATURES = [
  {
    title: "Theory-first deck engine",
    desc: "Presentations now bias toward definitions, mechanisms, examples, and takeaways instead of shallow filler.",
  },
  {
    title: "Editable review workspace",
    desc: "Every deck opens in an editor so teams can tune the narrative before exporting the final PPT.",
  },
  {
    title: "Usage-aware billing",
    desc: "Free generations, paid single-deck checkout, and per-user usage tracking are built into the product flow.",
  },
  {
    title: "Real-photo discipline",
    desc: `Each deck is capped at ${MAX_PPT_PHOTOS} real photos so the result stays premium and uncluttered.`,
  },
];

const USE_CASES = [
  {
    title: "Founders and GTM teams",
    desc: "Pitch decks, launch narratives, QBRs, investor updates, and sales enablement slides with stronger story flow.",
    badge: "Revenue",
  },
  {
    title: "Students and educators",
    desc: "Theory-heavy class decks, seminar presentations, explainers, and concept breakdowns with cleaner structure.",
    badge: "Learning",
  },
  {
    title: "Consultants and operators",
    desc: "Strategy decks, research summaries, ops reviews, and decision docs that are faster to present and easier to scan.",
    badge: "Execution",
  },
];

const PLAN_FEATURES = [
  { label: "AI-generated slide structure", free: true, paid: true },
  { label: "Editable preview workspace", free: true, paid: true },
  { label: "Up to 3 free generations", free: true, paid: true },
  { label: `Real-photo capped design (${MAX_PPT_PHOTOS} max)`, free: true, paid: true },
  { label: "Razorpay checkout for extra decks", free: false, paid: true },
  { label: "Per-user usage tracking", free: false, paid: true },
];

const STATS = [
  { value: 14280, suffix: "+", label: "Decks created" },
  { value: 28, suffix: "s", label: "Avg. generation time" },
  { value: 4.9, suffix: "/5", label: "User rating", decimal: true },
  { value: 98, suffix: "%", label: "Would recommend" },
];

const SLIDE_SAMPLES = [
  { title: "The Problem", body: "Current tools require hours of manual work, breaking creative flow.", color: "#f97316", num: "01" },
  { title: "Our Solution", body: "Describe the idea in plain language. Prompt2Craft handles the rest.", color: "#8b5cf6", num: "02" },
  { title: "Market Opportunity", body: "A clear market story with urgency, numbers, and strategic context.", color: "#0ea5e9", num: "03" },
  { title: "Product Demo", body: "Explain the product experience in a concise and presentation-ready way.", color: "#10b981", num: "04" },
  { title: "Business Model", body: "Summarize the model, levers, and monetization structure clearly.", color: "#f43f5e", num: "05" },
  { title: "The Ask", body: "Close with a focused decision, funding ask, or next-step request.", color: "#f59e0b", num: "06" },
];

const FAQS = [
  {
    q: "What kind of topics work best?",
    a: "Business pitches, research reports, lectures, product demos, and company updates all work well. More specific prompts produce stronger results.",
  },
  {
    q: "How long does generation take?",
    a: "Most decks are generated in well under a minute. Shorter decks are typically faster than longer 15 to 20 slide presentations.",
  },
  {
    q: "Can I edit the presentation after downloading?",
    a: "Yes. The output is a standard PPTX file and remains editable in PowerPoint, Keynote, and Google Slides.",
  },
  {
    q: "What is included for free?",
    a: `Each account gets ${FREE_GENERATION_LIMIT} free presentations. After that, each new generation is available for Rs ${PAID_GENERATION_PRICE_INR}.`,
  },
];

function useCountUp(target, duration = 1800, start = false, decimal = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) {
      return undefined;
    }

    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;

      if (current >= target) {
        setValue(target);
        clearInterval(timer);
        return;
      }

      setValue(decimal ? Number(current.toFixed(1)) : Math.floor(current));
    }, duration / steps);

    return () => clearInterval(timer);
  }, [decimal, duration, start, target]);

  return value;
}

function useDragOrder(initialItems) {
  const [items, setItems] = useState(initialItems);
  const dragIndex = useRef(null);

  const onDragStart = (index) => {
    dragIndex.current = index;
  };

  const onDragOver = (event, index) => {
    event.preventDefault();

    if (dragIndex.current === null || dragIndex.current === index) {
      return;
    }

    setItems((previous) => {
      const next = [...previous];
      const [moved] = next.splice(dragIndex.current, 1);
      next.splice(index, 0, moved);
      dragIndex.current = index;
      return next;
    });
  };

  const onDragEnd = () => {
    dragIndex.current = null;
  };

  return { items, onDragStart, onDragOver, onDragEnd };
}

const Navbar = memo(function Navbar({ onCTA, theme, setTheme, user, onLogout }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const navBackground = scrolled
    ? theme === "dark"
      ? "rgba(12,12,14,0.92)"
      : "rgba(255,253,250,0.92)"
    : "transparent";
  const navBorder = scrolled
    ? theme === "dark"
      ? "rgba(255,255,255,0.07)"
      : "rgba(0,0,0,0.07)"
    : "transparent";
  const linkColor = theme === "dark" ? "rgba(255,255,255,0.6)" : "#4b5563";

  return (
    <header>
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          background: navBackground,
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: `1px solid ${navBorder}`,
          transition: "all 0.3s ease",
        }}
      >
        <div className="nav-inner">
          <a href="/" aria-label="Prompt2Craft home" className="logo-link">
            <div aria-hidden="true" className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 5h10M3 8h7M3 11h5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="logo-text">Prompt2Craft</span>
          </a>

          <ul role="list" className="nav-links" aria-label="Site sections">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="nav-link" style={{ color: linkColor }}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <button
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="theme-btn"
              style={{ color: linkColor }}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.05 1.05M11.85 11.85l1.05 1.05M11.85 4.15l-1.05 1.05M4.15 11.85l-1.05 1.05" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 8.8A5.5 5.5 0 017.2 2.5 5.5 5.5 0 1013.5 8.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {user ? (
              <>
                <span className="signin-link" style={{ color: linkColor, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={user.email ?? ""}>
                  {user.email}
                </span>
                <button type="button" className="cta-btn-nav" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button type="button" className="signin-link" style={{ color: linkColor, background: "none", border: "none", cursor: "pointer" }} onClick={() => navigate("/login")}>
                  Login
                </button>
                <button type="button" className="cta-btn-nav" onClick={() => navigate("/register")}>
                  Sign Up
                </button>
              </>
            )}

            <button onClick={() => setMobileOpen((current) => !current)} aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} className="hamburger" style={{ color: linkColor }}>
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div id="mobile-menu" role="dialog" aria-label="Mobile navigation menu" className="mobile-menu" style={{ background: theme === "dark" ? "#0c0c0e" : "#fff", borderTop: `1px solid ${navBorder}` }}>
            <ul role="list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="mobile-link" style={{ color: theme === "dark" ? "rgba(255,255,255,0.75)" : "#374151" }} onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            {user ? (
              <>
                <p style={{ marginTop: 18, fontFamily: "var(--font-body)", fontSize: 13, color: linkColor }}>{user.email}</p>
                <button className="mobile-cta" type="button" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="mobile-cta" type="button" onClick={() => navigate("/login")}>
                  Login
                </button>
                <button className="secondary-button" type="button" style={{ marginTop: 10 }} onClick={() => navigate("/register")}>
                  Sign Up
                </button>
              </>
            )}
            <button className="secondary-button" type="button" style={{ marginTop: 10 }} onClick={() => { onCTA(); setMobileOpen(false); }}>
              Generate presentation
            </button>
          </div>
        ) : null}
      </nav>
    </header>
  );
});

const SlideCard3D = memo(function SlideCard3D({ slide, active, onClick, editMode, onEdit, delay }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [content, setContent] = useState({ title: slide.title, body: slide.body });
  const prefersReducedMotion = useRef(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  const onMove = useCallback(
    (event) => {
      if (editMode || prefersReducedMotion.current || !ref.current) {
        return;
      }

      const bounds = ref.current.getBoundingClientRect();
      setTilt({
        x: ((event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2)) * -8,
        y: ((event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2)) * 8,
      });
    },
    [editMode],
  );

  return (
    <article
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setTilt({ x: 0, y: 0 });
        setHovered(false);
      }}
      onClick={() => onClick(slide.num)}
      onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onClick(slide.num)}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`Slide ${slide.num}: ${content.title}`}
      style={{
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${hovered && !editMode ? -4 : 0}px)`,
        transition: "transform 0.15s ease",
        animationDelay: `${delay}ms`,
        cursor: "pointer",
        outline: "none",
      }}
      className="card-enter"
    >
      <div
        style={{
          borderRadius: 14,
          border: `1.5px solid ${active ? slide.color : "var(--border)"}`,
          background: active ? `color-mix(in srgb, ${slide.color} 6%, var(--card))` : "var(--card)",
          padding: "22px 20px",
          height: 162,
          position: "relative",
          overflow: "hidden",
          boxShadow: active
            ? `0 0 0 1px ${slide.color}30, 0 16px 36px ${slide.color}18`
            : hovered
              ? "0 8px 28px rgba(0,0,0,0.08)"
              : "0 2px 8px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.2s, border-color 0.2s",
        }}
      >
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: slide.color, borderRadius: "14px 14px 0 0", opacity: active ? 1 : 0.35 }} />
        <span aria-hidden="true" style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: slide.color, letterSpacing: "0.1em", opacity: 0.7 }}>
          {slide.num}
        </span>

        {editMode && active ? (
          <div style={{ marginTop: 6 }}>
            <input
              value={content.title}
              onChange={(event) => {
                const value = { ...content, title: event.target.value };
                setContent(value);
                onEdit(slide.num, value);
              }}
              onClick={(event) => event.stopPropagation()}
              aria-label="Edit slide title"
              style={{ fontFamily: "var(--font-display)", fontSize: 13.5, fontWeight: 700, color: "var(--fg)", background: "var(--input-bg)", border: `1px solid ${slide.color}60`, borderRadius: 6, padding: "4px 8px", width: "100%", outline: "none", marginBottom: 7 }}
            />
            <textarea
              value={content.body}
              onChange={(event) => {
                const value = { ...content, body: event.target.value };
                setContent(value);
                onEdit(slide.num, value);
              }}
              onClick={(event) => event.stopPropagation()}
              rows={3}
              aria-label="Edit slide body text"
              style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", width: "100%", resize: "none", outline: "none", lineHeight: "1.5" }}
            />
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.025em", lineHeight: "1.3", marginBottom: 8 }}>
              {content.title}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--muted)", lineHeight: "1.55" }}>{content.body}</p>
          </div>
        )}
      </div>
    </article>
  );
});

const AIProgressModal = memo(function AIProgressModal({ step, topic }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="AI is generating your presentation" style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(15,15,15,0.72)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 420, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", animation: "spin-slow 3s linear infinite", boxShadow: "0 4px 16px rgba(249,115,22,0.35)", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 7h14M4 11h10M4 15h7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, color: "#0f0f0f", letterSpacing: "-0.03em" }}>Creating your deck</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#9ca3af", marginTop: 2, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic}</p>
          </div>
        </div>

        <ol role="list" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {AI_STEPS.map((item, index) => {
            const done = index < step;
            const active = index === step;

            return (
              <li key={item.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", borderRadius: 10, background: active ? "#fff7ed" : "transparent" }}>
                <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: done ? "#f97316" : active ? "transparent" : "#f3f4f6", border: active ? "2px solid #f97316" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5 4-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : active ? (
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", animation: "breathe 1s ease infinite" }} />
                  ) : null}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: active ? 600 : 400, color: done ? "#9ca3af" : active ? "#0f0f0f" : "#d1d5db" }}>{item.label}</p>
                  {active ? <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#f97316", marginTop: 1 }}>{item.detail}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>

        <div role="progressbar" aria-valuenow={Math.round(((step + 1) / AI_STEPS.length) * 100)} aria-valuemin={0} aria-valuemax={100} style={{ marginTop: 24, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((step + 1) / AI_STEPS.length) * 100}%`, background: "linear-gradient(90deg,#f97316,#f43f5e)", borderRadius: 99, transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)" }} />
        </div>
      </div>
    </div>
  );
});

const StatItem = memo(function StatItem({ stat, trigger }) {
  const value = useCountUp(stat.value, 1600, trigger, stat.decimal);

  return (
    <div style={{ textAlign: "center", padding: "36px 16px" }}>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px,4vw,42px)", fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.05em", lineHeight: 1 }}>
        {value}
        {stat.suffix}
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>{stat.label}</p>
    </div>
  );
});

const FAQItem = memo(function FAQItem({ item, open, onToggle, idx }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button onClick={onToggle} aria-expanded={open} aria-controls={`faq-answer-${idx}`} id={`faq-question-${idx}`} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "22px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, textAlign: "left" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(15px,2vw,16.5px)", fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em", lineHeight: 1.3 }}>{item.q}</span>
        <div aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 8, background: open ? "#f97316" : "var(--chip-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M6 2v8M2 6h8" stroke={open ? "white" : "var(--muted)"} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
      </button>
      <div id={`faq-answer-${idx}`} role="region" aria-labelledby={`faq-question-${idx}`} hidden={!open}>
        {open ? <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(13px,1.6vw,14.5px)", color: "var(--muted)", lineHeight: 1.7, paddingBottom: 20, maxWidth: 640 }}>{item.a}</p> : null}
      </div>
    </div>
  );
});

function PaymentModal({ onCancel, onPay, processing, topic, slides }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Payment required" style={{ position: "fixed", inset: 0, zIndex: 9500, background: "rgba(15,15,15,0.68)", backdropFilter: "blur(10px)", display: "grid", placeItems: "center", padding: 16 }}>
      <div className="auth-card" style={{ maxWidth: 420 }}>
        <span className="section-label">Free limit reached</span>
        <h2 className="section-title" style={{ fontSize: "clamp(28px,4vw,38px)", marginBottom: 14 }}>Generate this presentation for Rs {PAID_GENERATION_PRICE_INR}</h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 24 }}>
          You have used all {FREE_GENERATION_LIMIT} free presentations. Continue with a one-time paid generation and unlock the preview plus download flow.
        </p>
        <div style={{ padding: 14, borderRadius: 16, background: "#fff7ed", border: "1px solid rgba(249,115,22,.16)", marginBottom: 18 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#9a3412", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Order summary
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.3 }}>
            {topic || "Prompt2Craft deck"}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "#6b7280", marginTop: 8, lineHeight: 1.6 }}>
            {slides} slides, premium PPTX export, editable preview, and up to {MAX_PPT_PHOTOS} real photos in the deck.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          {["Razorpay checkout", "One-time charge", "Instant preview access"].map((item) => (
            <span key={item} className="inline-badge" style={{ marginBottom: 0 }}>
              {item}
            </span>
          ))}
        </div>
        <button className="primary-button" type="button" onClick={onPay} disabled={processing}>
          {processing ? "Opening checkout..." : `Pay Rs ${PAID_GENERATION_PRICE_INR}`}
        </button>
        <button className="secondary-button" type="button" style={{ marginTop: 12 }} onClick={onCancel} disabled={processing}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [activeSlide, setActiveSlide] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [theme, setTheme] = useState("light");
  const [exportMenu, setExportMenu] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [usage, setUsage] = useState({ free_generations_used: 0, paid_generations: 0 });
  const [usageLoading, setUsageLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState(null);

  const inputRef = useRef(null);
  const statsRef = useRef(null);
  const exportRef = useRef(null);

  const [typed, setTyped] = useState("");
  const [typeIndex, setTypeIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const { items: orderedSlides, onDragStart, onDragOver, onDragEnd } = useDragOrder(SLIDE_SAMPLES);
  const [slideData, setSlideData] = useState(SLIDE_SAMPLES);

  const showToast = useCallback((message, ok = true) => {
    setToast({ message, ok });
    window.setTimeout(() => setToast(null), 3800);
  }, []);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage({ free_generations_used: 0, paid_generations: 0 });
      return { free_generations_used: 0, paid_generations: 0 };
    }

    setUsageLoading(true);

    try {
      const nextUsage = await ensureUserUsageRecord(user.id);
      setUsage(nextUsage);
      return nextUsage;
    } finally {
      setUsageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const currentSuggestion = SUGGESTIONS[typeIndex];
    let timer;

    if (!deleting && charIndex < currentSuggestion.length) {
      timer = window.setTimeout(() => {
        setTyped(currentSuggestion.slice(0, charIndex + 1));
        setCharIndex((current) => current + 1);
      }, 48);
    } else if (!deleting && charIndex === currentSuggestion.length) {
      timer = window.setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && charIndex > 0) {
      timer = window.setTimeout(() => {
        setTyped(currentSuggestion.slice(0, charIndex - 1));
        setCharIndex((current) => current - 1);
      }, 22);
    } else {
      setDeleting(false);
      setTypeIndex((current) => (current + 1) % SUGGESTIONS.length);
    }

    return () => window.clearTimeout(timer);
  }, [charIndex, deleting, typeIndex]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStatsVisible(true);
      }
    }, { threshold: 0.3 });

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!loading) {
      return undefined;
    }

    setAiStep(0);
    const timers = AI_STEPS.map((_, index) => window.setTimeout(() => setAiStep(index), index * 950));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [loading]);

  useEffect(() => {
    if (!exportMenu) {
      return undefined;
    }

    const handleMouseDown = (event) => {
      if (!exportRef.current?.contains(event.target)) {
        setExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [exportMenu]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    fetchUsage().catch(() => {
      if (user) {
        showToast("Unable to load usage details from Supabase.", false);
      }
    });
  }, [fetchUsage, showToast, user]);

  const handleEditSlide = useCallback((num, value) => {
    setSlideData((previous) => previous.map((slide) => (slide.num === num ? { ...slide, ...value } : slide)));
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Logged out successfully.");
    } catch {
      showToast("Unable to logout right now.", false);
    }
  };

  const incrementUsage = useCallback(
    async (mode) => {
      if (!user) {
        return usage;
      }

      const nextUsage = await incrementUserUsage(user.id, mode);
      setUsage(nextUsage);
      return nextUsage;
    },
    [usage, user],
  );

  const runGeneration = useCallback(
    async ({ paid = false, nextTopic, nextSlideCount } = {}) => {
      const resolvedTopic = (nextTopic ?? topic).trim();

      if (!resolvedTopic) {
        inputRef.current?.focus();
        return;
      }

      const exactSlideCount = clampSlideCount(nextSlideCount ?? slideCount);
      if (nextSlideCount == null && exactSlideCount !== slideCount) {
        setSlideCount(exactSlideCount);
      }

      setLoading(true);

      try {
        const preview = await previewPresentation(resolvedTopic, exactSlideCount);

        if (!preview?.slides?.length) {
          throw new Error("Preview response did not include slides");
        }

        const updatedUsage = await incrementUsage(paid ? "paid" : "free");

        navigate("/preview", {
          state: {
            topic: resolvedTopic,
            slides: normalizeSlides(preview?.slides ?? []),
            filename: createPresentationFilename(resolvedTopic),
            freeUsed: updatedUsage.free_generations_used,
            paidUsed: updatedUsage.paid_generations,
          },
        });
      } catch {
        showToast("Generation failed. Please try again.", false);
      } finally {
        setLoading(false);
      }
    },
    [incrementUsage, navigate, showToast, slideCount, topic],
  );

  const generate = useCallback(async () => {
    if (!topic.trim()) {
      inputRef.current?.focus();
      return;
    }

    if (!user) {
      navigate("/login", {
        state: { message: "Please login to generate presentations" },
      });
      return;
    }

    try {
      const currentUsage = await fetchUsage();
      const exactSlideCount = clampSlideCount(slideCount);

      if (currentUsage.free_generations_used < FREE_GENERATION_LIMIT) {
        await runGeneration({ paid: false });
        return;
      }

      setPendingGeneration({ topic: topic.trim(), slideCount: exactSlideCount });
      setShowPaymentModal(true);
    } catch {
      showToast("Unable to verify your generation limit.", false);
    }
  }, [fetchUsage, navigate, runGeneration, showToast, slideCount, topic, user]);

  const handlePayment = async () => {
    if (!pendingGeneration) {
      return;
    }

    setPaymentProcessing(true);

    try {
      await loadRazorpayCheckout();

      const order = await createPaymentOrder({
        topic: pendingGeneration.topic,
        slides: pendingGeneration.slideCount,
        customerEmail: user?.email ?? "",
        customerName: user?.user_metadata?.full_name ?? user?.email ?? "Prompt2Craft user",
      });

      await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: order.name,
          description: order.description,
          order_id: order.orderId,
          prefill: {
            email: order.customerEmail || user?.email || "",
            name: order.customerName || user?.user_metadata?.full_name || "",
          },
          theme: {
            color: "#f97316",
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
          handler: async (response) => {
            try {
              const verification = await verifyPayment({
                orderId: order.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (!verification?.verified) {
                reject(new Error("Payment verification failed."));
                return;
              }

              resolve(verification);
            } catch (error) {
              reject(error);
            }
          },
        });

        razorpay.open();
      });

      setShowPaymentModal(false);
      await runGeneration({
        paid: true,
        nextTopic: pendingGeneration.topic,
        nextSlideCount: pendingGeneration.slideCount,
      });
      showToast("Payment verified. Building your presentation now.");
      setPendingGeneration(null);
    } catch (error) {
      showToast(error?.message || "Payment could not be completed.", false);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const freeRemaining = Math.max(FREE_GENERATION_LIMIT - (usage.free_generations_used ?? 0), 0);

  return (
    <>
      <ThemeStyles />
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <Navbar onCTA={() => inputRef.current?.focus()} theme={theme} setTheme={setTheme} user={user} onLogout={handleLogout} />
        <main id="main-content">
          <section className="hero-section" style={{ position: "relative", overflow: "hidden", paddingTop: 130, paddingBottom: 80, paddingLeft: 28, paddingRight: 28 }}>
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(249,115,22,0.08) 0%, transparent 60%)" }} />
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "80px 80px", opacity: 0.5 }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
              <h1 className="hero-h1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px,7vw,76px)", fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.045em", lineHeight: 1, marginBottom: 22 }}>
                Your next great presentation,{" "}
                <span style={{ background: "linear-gradient(135deg,#f97316 0%,#f43f5e 100%)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gradient-shift 4s ease infinite" }}>
                  written by AI.
                </span>
              </h1>

              <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px,2.5vw,18px)", color: "var(--muted)", lineHeight: 1.65, maxWidth: 560, margin: "0 auto 48px", fontWeight: 400 }}>
                Describe your topic. Choose your slide count. Generate a theory-first deck with cleaner structure, disciplined visuals, editable preview, and a polished PowerPoint export only when you are ready.
              </p>

              <div role="search" aria-label="Presentation generator" style={{ background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 16, padding: 8, boxShadow: "0 4px 32px rgba(0,0,0,0.07)", maxWidth: 660, margin: "0 auto 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", padding: "8px 14px 0", gap: 10 }}>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginTop: 3, flexShrink: 0 }}>
                    <circle cx="9" cy="9" r="7.5" stroke="var(--accent)" strokeWidth="1.4" />
                    <path d="M9 6v3l2 2" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <textarea id="topic-input" ref={inputRef} value={topic} onChange={(event) => setTopic(event.target.value)} onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && (event.preventDefault(), generate())} placeholder={typed || "Describe your presentation topic..."} rows={2} style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--fg)", lineHeight: 1.6, paddingTop: 1 }} />
                </div>

                <div className="input-bottom-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px 8px", marginTop: 4, gap: 10 }}>
                  <div className="slide-counter" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>Slides:</span>
                    <div role="group" aria-label="Number of slides" style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--chip-bg)", borderRadius: 8, padding: "4px 10px", border: "1px solid var(--border)" }}>
                      <button onClick={() => setSlideCount((current) => clampSlideCount(current - 1))} aria-label="Decrease slide count" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1, padding: "0 2px", fontWeight: 600 }}>
                        -
                      </button>
                      <output aria-live="polite" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--fg)", minWidth: 22, textAlign: "center" }}>
                        {clampSlideCount(slideCount)}
                      </output>
                      <button onClick={() => setSlideCount((current) => clampSlideCount(current + 1))} aria-label="Increase slide count" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1, padding: "0 2px", fontWeight: 600 }}>
                        +
                      </button>
                    </div>
                  </div>

                  <div className="gen-btn-wrap">
                    <button onClick={generate} disabled={loading || !topic.trim()} aria-busy={loading} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", padding: "10px 24px", borderRadius: 10, background: loading || !topic.trim() ? "var(--chip-bg)" : "linear-gradient(135deg,#f97316,#f43f5e)", color: loading || !topic.trim() ? "var(--muted)" : "#fff", border: "none", cursor: loading || !topic.trim() ? "not-allowed" : "pointer", transition: "all .18s", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: loading || !topic.trim() ? "none" : "0 4px 16px rgba(249,115,22,.35)", whiteSpace: "nowrap" }}>
                      {loading ? (
                        <>
                          <span aria-hidden="true" style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .65s linear infinite", display: "inline-block" }} />
                          Generating...
                        </>
                      ) : (
                        "Generate ->"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                {user ? (
                  <span className="inline-badge">{usageLoading ? "Loading usage..." : `${freeRemaining} free generations left`}</span>
                ) : (
                  <span className="inline-badge">Login required before generation</span>
                )}
                <span className="inline-badge">Paid generations use Razorpay checkout at Rs {PAID_GENERATION_PRICE_INR}</span>
              </div>

              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", marginBottom: 10, fontWeight: 500 }}>Popular topics -&gt;</p>
                <div className="chip-row" style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center" }}>
                  {CHIPS.map((chip) => (
                    <button key={chip} className="chip" onClick={() => setTopic(chip)} aria-label={`Use topic ${chip}`}>
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div role="list" aria-label="Key statistics" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0, marginTop: 64, paddingTop: 40, borderTop: "1px solid var(--border)" }}>
                {[
                  { n: "14,000+", l: "Presentations created" },
                  { n: `< ${STATS[1].value}${STATS[1].suffix}`, l: "Median generation time" },
                  { n: `${MAX_PPT_PHOTOS} photos max`, l: "Cleaner visual pacing" },
                  { n: "Preview first", l: "Download only when ready" },
                ].map((stat, index) => (
                  <div key={stat.l} role="listitem" style={{ padding: "0 28px", textAlign: "center", borderLeft: index > 0 ? "1px solid var(--border)" : "none" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,4vw,30px)", fontWeight: 800, color: "var(--fg)", letterSpacing: "-0.045em" }}>{stat.n}</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--muted)", marginTop: 4, fontWeight: 500 }}>{stat.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section-pad" style={{ padding: "72px 28px", background: "var(--section-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>
              <div className="preview-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
                <div>
                  <span className="section-label">Live preview</span>
                  <h2 className="section-title" style={{ fontSize: "clamp(22px,3vw,36px)" }}>What your deck will look like</h2>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
                    Hover to tilt, click to select, drag to reorder, and preview before downloading.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div ref={exportRef} style={{ position: "relative" }}>
                    <button onClick={() => setExportMenu((current) => !current)} aria-expanded={exportMenu} aria-haspopup="menu" style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--muted)", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      Export options v
                    </button>
                    {exportMenu ? (
                      <ul role="menu" aria-label="Export options" className="export-menu" style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 6, minWidth: 180, boxShadow: "0 8px 28px rgba(0,0,0,0.12)", zIndex: 100 }}>
                        {["PPTX - PowerPoint", "PDF - Export", "Google Slides"].map((option) => (
                          <li key={option} role="menuitem">
                            <button onClick={() => { generate(); setExportMenu(false); }} style={{ width: "100%", textAlign: "left", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg)", padding: "9px 12px", borderRadius: 7, cursor: "pointer", background: "none", border: "none" }}>
                              {option}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <button onClick={() => setEditMode((current) => !current)} aria-pressed={editMode} style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: editMode ? "#f97316" : "var(--muted)", background: editMode ? "#fff7ed" : "var(--card)", border: `1.5px solid ${editMode ? "rgba(249,115,22,.35)" : "var(--border)"}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                    {editMode ? "Editing" : "Edit slides"}
                  </button>
                </div>
              </div>

              {editMode ? (
                <div role="status" style={{ marginBottom: 20, padding: "10px 16px", background: "#fff7ed", border: "1px solid rgba(249,115,22,.2)", borderRadius: 9 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#c2410c" }}>Click any slide to select it, then edit title and content. Drag slides to reorder.</p>
                </div>
              ) : null}

              <div className="slides-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(196px,1fr))", gap: 12 }}>
                {orderedSlides.map((slide, index) => (
                  <div key={slide.num} className="drag-card" draggable onDragStart={() => onDragStart(index)} onDragOver={(event) => onDragOver(event, index)} onDragEnd={onDragEnd}>
                    <SlideCard3D slide={slideData.find((item) => item.num === slide.num) || slide} active={activeSlide === slide.num} onClick={(num) => setActiveSlide(activeSlide === num ? null : num)} editMode={editMode} onEdit={handleEditSlide} delay={index * 50} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="features" className="section-pad" style={{ padding: "96px 28px", maxWidth: 1120, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span className="section-label">Why Prompt2Craft</span>
              <h2 className="section-title" style={{ fontSize: "clamp(28px,4vw,46px)" }}>
                Built different.
                <br />
                Works better.
              </h2>
            </div>

            <ul className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16, padding: 0 }}>
              {FEATURES.map((feature) => (
                <li key={feature.title} className="hover-lift" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 26px", boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}>
                  <div aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#fff7ed,#ffedd5)", border: "1px solid rgba(249,115,22,.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      {feature.visual === "brain" ? <path d="M11 3C7.68 3 5 5.68 5 9c0 2.1 1.05 3.96 2.66 5.1A4 4 0 0011 19a4 4 0 003.34-4.9C15.95 12.96 17 11.1 17 9c0-3.32-2.68-6-6-6z" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round" /> : null}
                      {feature.visual === "bolt" ? <path d="M13 3L5 13h7l-1 6 8-10h-7l1-6z" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" /> : null}
                      {feature.visual === "star" ? <path d="M11 2l2.6 6h6.4l-5.2 4 2 6.4L11 15l-5.8 3.4 2-6.4L2 8h6.4L11 2z" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round" /> : null}
                      {feature.visual === "edit" ? <path d="M15 5l2 2-10 10H5v-2L15 5 M4 18h14" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
                    </svg>
                  </div>
                  <div style={{ display: "inline-block", background: "#fff7ed", border: "1px solid rgba(249,115,22,.2)", borderRadius: 6, padding: "2px 8px", marginBottom: 12 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.06em" }}>{feature.tag}</span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(15px,2vw,17px)", fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.025em", marginBottom: 10, lineHeight: 1.3 }}>{feature.title}</h3>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65 }}>{feature.desc}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="how-it-works" className="section-pad" style={{ padding: "96px 28px", background: "var(--section-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 64 }}>
                <span className="section-label">How it works</span>
                <h2 className="section-title" style={{ fontSize: "clamp(28px,4vw,46px)" }}>
                  From prompt to presentation
                  <br />
                  in four steps
                </h2>
              </div>

              <ol className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, padding: 0 }}>
                {[
                  { n: "1", t: "Write your prompt", d: "Describe your topic, audience, or objective in a sentence or a fuller brief." },
                  { n: "2", t: "Choose slide count", d: "Pick exactly 3 to 20 slides. The request sent to the backend uses that exact number." },
                  { n: "3", t: "AI builds your deck", d: "The backend returns a PPTX while Prompt2Craft prepares a reviewable preview." },
                  { n: "4", t: "Preview and download", d: "Review slide titles and bullets, then download the PPT only when you are ready.", highlight: true },
                ].map((step, index) => (
                  <li key={step.n} style={{ padding: "36px 28px", background: step.highlight ? "linear-gradient(135deg,#f97316,#f43f5e)" : "var(--card)", borderRadius: index === 0 ? "14px 0 0 14px" : index === 3 ? "0 14px 14px 0" : 0, border: step.highlight ? "none" : "1px solid var(--border)", borderLeft: index > 0 && !step.highlight ? "none" : undefined }}>
                    <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 10, background: step.highlight ? "rgba(255,255,255,.25)" : "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: step.highlight ? "#fff" : "var(--accent)" }}>{step.n}</span>
                    </div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(15px,2vw,17px)", fontWeight: 700, color: step.highlight ? "#fff" : "var(--fg)", letterSpacing: "-0.025em", marginBottom: 10, lineHeight: 1.25 }}>{step.t}</h3>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: step.highlight ? "rgba(255,255,255,.8)" : "var(--muted)", lineHeight: 1.65 }}>{step.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="section-pad" style={{ padding: "96px 28px", maxWidth: 1120, margin: "0 auto" }}>
            <div className="saas-layout" style={{ display: "grid", gap: 22, alignItems: "start" }}>
              <div>
                <span className="section-label">SaaS model</span>
                <h2 className="section-title" style={{ fontSize: "clamp(28px,4vw,46px)", marginBottom: 16 }}>
                  Built like a product,
                  <br />
                  not just a demo screen
                </h2>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--muted)", lineHeight: 1.75, maxWidth: 500 }}>
                  Prompt2Craft now behaves more like a usable AI SaaS workflow: login, free usage tracking, paid unlocks, editable preview, and a cleaner deck-generation system that stays structured instead of noisy.
                </p>
              </div>

              <div className="saas-feature-grid" style={{ display: "grid", gap: 14 }}>
                {SAAS_FEATURES.map((feature, index) => (
                  <div key={feature.title} className="panel-card hover-lift" style={{ padding: 22, background: index % 2 === 0 ? "var(--card)" : "linear-gradient(135deg,#fff7ed,#fff)" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#f97316,#fb7185)", color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 800, marginBottom: 16 }}>
                      0{index + 1}
                    </div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em", marginBottom: 10 }}>
                      {feature.title}
                    </h3>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65 }}>
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section-pad" style={{ padding: "96px 28px", background: "var(--section-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <span className="section-label">Use cases</span>
                <h2 className="section-title" style={{ fontSize: "clamp(28px,4vw,46px)" }}>
                  Fits the way real teams
                  <br />
                  and learners work
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                {USE_CASES.map((item) => (
                  <div key={item.title} className="panel-card hover-lift" style={{ padding: 24 }}>
                    <span className="inline-badge">{item.badge}</span>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.035em", marginTop: 16, marginBottom: 12 }}>
                      {item.title}
                    </h3>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted)", lineHeight: 1.75 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="pricing" className="section-pad" style={{ padding: "96px 28px", maxWidth: 1120, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="section-label">Pricing</span>
              <h2 className="section-title" style={{ fontSize: "clamp(28px,4vw,46px)" }}>Start free, pay only when you need more</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
              <div className="panel-card">
                <span className="inline-badge">Free tier</span>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--fg)", marginTop: 18, letterSpacing: "-0.04em" }}>3 free decks</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginTop: 12 }}>
                  Sign up, login, and generate up to 3 presentations before any payment is required.
                </p>
              </div>

              <div className="panel-card" style={{ background: "linear-gradient(135deg,#fff7ed,#fff1f2)" }}>
                <span className="inline-badge">Pay as you go</span>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--fg)", marginTop: 18, letterSpacing: "-0.04em" }}>Rs {PAID_GENERATION_PRICE_INR} per extra deck</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginTop: 12 }}>
                  When your free limit is exhausted, launch Razorpay checkout and continue generating presentations one at a time.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
                  {["One-time payment", "No subscription required", "Checkout before generation"].map((item) => (
                    <span key={item} className="inline-badge">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel-card" style={{ marginTop: 20, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", background: "var(--section-alt)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ padding: "16px 22px", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Feature
                </div>
                <div style={{ padding: "16px 22px", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Free
                </div>
                <div style={{ padding: "16px 22px", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Paid
                </div>
              </div>
              {PLAN_FEATURES.map((row) => (
                <div key={row.label} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ padding: "16px 22px", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg)" }}>{row.label}</div>
                  <div style={{ padding: "16px 22px", fontFamily: "var(--font-body)", fontSize: 14, color: row.free ? "#059669" : "var(--muted)" }}>{row.free ? "Included" : "-"}</div>
                  <div style={{ padding: "16px 22px", fontFamily: "var(--font-body)", fontSize: 14, color: row.paid ? "#059669" : "var(--muted)" }}>{row.paid ? "Included" : "-"}</div>
                </div>
              ))}
            </div>
          </section>

          <section ref={statsRef} className="section-pad" style={{ padding: "80px 28px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.05)" }}>
                {STATS.map((stat, index) => (
                  <div key={stat.label} style={{ borderRight: index < 3 ? "1px solid var(--border)" : "none", borderTop: "3px solid transparent" }}>
                    <StatItem stat={stat} trigger={statsVisible} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="faq" className="section-pad" style={{ padding: "96px 28px", background: "var(--section-alt)", borderTop: "1px solid var(--border)" }}>
            <div className="faq-layout" style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "280px 1fr", gap: 64, alignItems: "start" }}>
              <div className="faq-sticky" style={{ position: "sticky", top: 88 }}>
                <span className="section-label">FAQ</span>
                <h2 className="section-title" style={{ fontSize: "clamp(26px,3.5vw,38px)", marginBottom: 14 }}>Questions we hear a lot</h2>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
                  Everything new in the product flow still fits the same Prompt2Craft experience.
                </p>
              </div>
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {FAQS.map((item, index) => (
                  <FAQItem key={item.q} item={item} idx={index} open={faqOpen === index} onToggle={() => setFaqOpen(faqOpen === index ? null : index)} />
                ))}
              </div>
            </div>
          </section>

          <section className="section-pad" style={{ padding: "80px 28px", borderTop: "1px solid var(--border)" }}>
            <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
              <div className="cta-banner" style={{ background: "linear-gradient(135deg,#f97316,#f43f5e)", borderRadius: 24, padding: "56px 40px", position: "relative", overflow: "hidden" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", marginBottom: 14, lineHeight: 1.1 }}>
                  Your next deck is one prompt away.
                </h2>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "rgba(255,255,255,.82)", marginBottom: 32, lineHeight: 1.6 }}>
                  Login once. Use your free generations. Preview first. Download when ready.
                </p>
                <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); window.setTimeout(() => inputRef.current?.focus(), 600); }} style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, letterSpacing: "-0.025em", color: "var(--accent)", background: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,.15)" }}>
                  Generate your first deck -&gt;
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer style={{ borderTop: "1px solid var(--border)", padding: "60px 28px 36px", background: "#0f0f0f" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, paddingBottom: 48, borderBottom: "1px solid rgba(255,255,255,.08)", marginBottom: 28 }}>
              <div>
                <Link to="/" aria-label="Prompt2Craft home" className="logo-link" style={{ marginBottom: 16, display: "inline-flex" }}>
                  <div className="logo-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 5h10M3 8h7M3 11h5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: "-0.04em", marginLeft: 8 }}>Prompt2Craft</span>
                </Link>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.7, maxWidth: 220 }}>
                  AI-powered presentations for people who have better things to do than format slides.
                </p>
              </div>
              {[
                { title: "Product", links: ["AI Generator", "Preview Flow", "Usage Limits", "Pricing"] },
                { title: "Resources", links: ["Documentation", "Support", "Examples", "Status"] },
                { title: "Company", links: ["About", "Privacy policy", "Terms of service", "Contact"] },
              ].map((column) => (
                <nav key={column.title}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.35)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 16 }}>{column.title}</p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {column.links.map((link) => (
                      <li key={link}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "rgba(255,255,255,.5)" }}>{link}</span>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
            <div className="footer-bottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "rgba(255,255,255,.25)" }}>Copyright 2026 Prompt2Craft, Inc. All rights reserved.</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "rgba(255,255,255,.25)" }}>Made for the people who build things.</p>
            </div>
          </div>
        </footer>

        {loading ? <AIProgressModal step={aiStep} topic={topic} /> : null}
        {showPaymentModal ? (
          <PaymentModal
            onCancel={() => {
              setShowPaymentModal(false);
              setPendingGeneration(null);
            }}
            onPay={handlePayment}
            processing={paymentProcessing}
            topic={pendingGeneration?.topic}
            slides={pendingGeneration?.slideCount ?? clampSlideCount(slideCount)}
          />
        ) : null}

        {toast ? (
          <div role="status" aria-live="polite" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 8000, background: "var(--card)", border: `1px solid ${toast.ok ? "rgba(16,185,129,.2)" : "rgba(239,68,68,.2)"}`, borderRadius: 12, padding: "13px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 16px 40px rgba(0,0,0,.12)", animation: "fadeSlide .25s ease both", maxWidth: 360 }}>
            <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: toast.ok ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                {toast.ok ? (
                  <path d="M2 5l2 2.5 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M3 3l4 4M7 3l-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                )}
              </svg>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--fg)", fontWeight: 500 }}>{toast.message}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
