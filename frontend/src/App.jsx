import { useState, useEffect, useRef } from "react";

const API_URL = "http://localhost:8081/api/generate";

const CHIPS = [
  "Series A pitch deck", "Quarterly business review", "Product strategy 2025",
  "Go-to-market plan", "Board presentation", "UX research findings",
];

const STEPS = [
  "Parsing your topic",
  "Structuring narrative flow",
  "Generating slide content",
  "Applying visual design",
  "Compiling PPTX file",
];

const MOCK_SLIDES = [
  { title: "Executive Summary", sub: "Context, objectives, and key outcomes", idx: 1 },
  { title: "Market Landscape", sub: "Competitive analysis and positioning", idx: 2 },
  { title: "Core Thesis", sub: "Central argument and supporting evidence", idx: 3 },
  { title: "Strategic Roadmap", sub: "Phased execution across 12 months", idx: 4 },
  { title: "Financial Model", sub: "Revenue projections and unit economics", idx: 5 },
  { title: "Team & Capability", sub: "Key personnel and operational strengths", idx: 6 },
];

function CursorGlow() {
  const ref = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (ref.current) {
        ref.current.style.left = e.clientX + "px";
        ref.current.style.top = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 0,
        width: "700px",
        height: "700px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)",
        transform: "translate(-50%, -50%)",
        transition: "left 0.1s ease, top 0.1s ease",
      }}
    />
  );
}

function SlideCard({ slide, active, onSelect, onEdit, editMode, delay }) {
  const ref = useRef(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [content, setContent] = useState({ title: slide.title, sub: slide.sub });

  const onMove = (e) => {
    if (editMode) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientY - r.top - r.height / 2) / r.height) * -10;
    const y = ((e.clientX - r.left - r.width / 2) / r.width) * 10;
    setRot({ x, y });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setRot({ x: 0, y: 0 })}
      onClick={() => onSelect(slide.idx)}
      style={{
        transform: `perspective(900px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        transition: "transform 0.12s ease",
        animationDelay: `${delay}ms`,
        cursor: "pointer",
      }}
      className="sc-enter"
    >
      <div
        style={{
          padding: "24px 22px",
          borderRadius: "10px",
          border: `1px solid ${active ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.06)"}`,
          background: active ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.02)",
          height: "156px",
          position: "relative",
          overflow: "hidden",
          boxShadow: active ? "0 0 0 1px rgba(99,102,241,0.2), 0 16px 36px rgba(99,102,241,0.1)" : "none",
          transition: "all 0.2s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            fontFamily: "'Instrument Mono', monospace",
            fontSize: "9px",
            color: "rgba(255,255,255,0.18)",
            letterSpacing: "0.1em",
          }}
        >
          {String(slide.idx).padStart(2, "0")}
        </span>

        {active && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "2px",
              height: "100%",
              background: "linear-gradient(180deg, #6366f1, #818cf8)",
              borderRadius: "10px 0 0 10px",
            }}
          />
        )}

        {editMode && active ? (
          <div style={{ paddingLeft: "6px", paddingTop: "4px" }}>
            <input
              autoFocus
              value={content.title}
              onChange={(e) => {
                const v = { ...content, title: e.target.value };
                setContent(v);
                onEdit(slide.idx, v);
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#f1f5f9",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(99,102,241,0.35)",
                borderRadius: "5px",
                padding: "4px 8px",
                width: "100%",
                outline: "none",
                marginBottom: "8px",
              }}
            />
            <textarea
              value={content.sub}
              onChange={(e) => {
                const v = { ...content, sub: e.target.value };
                setContent(v);
                onEdit(slide.idx, v);
              }}
              onClick={(e) => e.stopPropagation()}
              rows={2}
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "11.5px",
                color: "rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "5px",
                padding: "4px 8px",
                width: "100%",
                resize: "none",
                outline: "none",
                lineHeight: "1.5",
              }}
            />
          </div>
        ) : (
          <div style={{ paddingLeft: "4px", paddingTop: "4px" }}>
            <p
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "14.5px",
                fontWeight: 600,
                color: "#f1f5f9",
                letterSpacing: "-0.025em",
                lineHeight: "1.25",
                marginBottom: "10px",
              }}
            >
              {content.title}
            </p>
            <p
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "11.5px",
                color: "rgba(255,255,255,0.34)",
                lineHeight: "1.55",
              }}
            >
              {content.sub}
            </p>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: "-24px",
            right: "-24px",
            width: "90px",
            height: "90px",
            background: active
              ? "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

function AIOverlay({ step }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(7,7,12,0.9)",
        backdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9000,
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px", padding: "52px 44px" }}>
        <div style={{ marginBottom: "44px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#6366f1",
                animation: "breathe 1.8s ease infinite",
              }}
            />
            <span
              style={{
                fontFamily: "'Instrument Mono', monospace",
                fontSize: "10px",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Processing
            </span>
          </div>
          <h3
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "28px",
              fontWeight: 700,
              color: "#f1f5f9",
              letterSpacing: "-0.04em",
              lineHeight: "1.1",
            }}
          >
            Building your<br />presentation
          </h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "13px 0",
                  borderBottom: i < STEPS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  opacity: i > step ? 0.2 : 1,
                  transition: "opacity 0.5s ease",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: done ? "#6366f1" : active ? "transparent" : "rgba(255,255,255,0.08)",
                    border: active ? "1.5px solid #6366f1" : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  {done ? (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l2 2 3-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : active ? (
                    <div
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: "#6366f1",
                        animation: "breathe 1s ease infinite",
                      }}
                    />
                  ) : null}
                </div>

                <span
                  style={{
                    flex: 1,
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: "13.5px",
                    fontWeight: active ? 500 : 400,
                    color: done ? "rgba(255,255,255,0.3)" : active ? "#f1f5f9" : "rgba(255,255,255,0.22)",
                    textDecoration: done ? "line-through" : "none",
                    transition: "all 0.3s ease",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {s}
                </span>

                {active && (
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    {[0, 1, 2].map((d) => (
                      <div
                        key={d}
                        style={{
                          width: "3px",
                          height: "3px",
                          borderRadius: "50%",
                          background: "#6366f1",
                          animation: "dotbounce 1.1s ease infinite",
                          animationDelay: `${d * 0.18}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "36px" }}>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "1px",
                width: `${((step + 1) / STEPS.length) * 100}%`,
                background: "linear-gradient(90deg, #6366f1, #a5b4fc)",
                transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ fontFamily: "'Instrument Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em" }}>
              STEP {step + 1} / {STEPS.length}
            </span>
            <span style={{ fontFamily: "'Instrument Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em" }}>
              {Math.round(((step + 1) / STEPS.length) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQSection() {
  const [open, setOpen] = useState(null);
  const items = [
    { q: "How does the AI structure slides?", a: "The model analyzes your topic, identifies a logical narrative arc — problem, insight, solution, evidence, next steps — and maps each beat to a slide with appropriate content density and visual weight." },
    { q: "What file formats does it export?", a: "Presentations export as standard .pptx files fully compatible with Microsoft PowerPoint, Apple Keynote, and Google Slides. Every element — text, layout, font — is editable after download." },
    { q: "Can I customize the visual theme?", a: "Yes. Pro accounts can select from curated design themes before generation. All accounts can edit typography, colors, and layouts after downloading the PPTX." },
    { q: "Is there a generation limit?", a: "Free accounts include 5 presentations per month. Pro plans offer unlimited generation, priority processing, and advanced chart and data slide types." },
    { q: "How accurate is the generated content?", a: "The AI produces well-structured, well-reasoned content calibrated to your topic. For specialized domains — finance, medicine, legal — we recommend a domain expert review before use." },
  ];

  return (
    <div>
      {items.map((item, i) => (
        <div
          key={i}
          onClick={() => setOpen(open === i ? null : i)}
          style={{
            borderTop: "1px solid rgba(255,255,255,0.055)",
            padding: "22px 0",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px" }}>
            <span
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "16px",
                fontWeight: 500,
                color: "#f1f5f9",
                letterSpacing: "-0.02em",
                lineHeight: "1.35",
              }}
            >
              {item.q}
            </span>
            <span
              style={{
                fontFamily: "'Instrument Mono', monospace",
                fontSize: "16px",
                color: "rgba(255,255,255,0.25)",
                transform: open === i ? "rotate(45deg)" : "none",
                transition: "transform 0.2s ease",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              +
            </span>
          </div>
          {open === i && (
            <p
              style={{
                marginTop: "12px",
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "13.5px",
                color: "rgba(255,255,255,0.38)",
                lineHeight: "1.75",
                maxWidth: "580px",
                animation: "fadeUp 0.2s ease both",
              }}
            >
              {item.a}
            </p>
          )}
        </div>
      ))}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.055)" }} />
    </div>
  );
}

export default function App() {
  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState(8);
  const [loading, setLoading] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [activeSlide, setActiveSlide] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [slideData, setSlideData] = useState(MOCK_SLIDES);
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  const [typed, setTyped] = useState("");
  const [tIdx, setTIdx] = useState(0);
  const [cIdx, setCIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const cur = CHIPS[tIdx];
    let t;
    if (!deleting && cIdx < cur.length) {
      t = setTimeout(() => { setTyped(cur.slice(0, cIdx + 1)); setCIdx(c => c + 1); }, 52);
    } else if (!deleting && cIdx === cur.length) {
      t = setTimeout(() => setDeleting(true), 2100);
    } else if (deleting && cIdx > 0) {
      t = setTimeout(() => { setTyped(cur.slice(0, cIdx - 1)); setCIdx(c => c - 1); }, 26);
    } else {
      setDeleting(false);
      setTIdx(t => (t + 1) % CHIPS.length);
    }
    return () => clearTimeout(t);
  }, [cIdx, deleting, tIdx]);

  useEffect(() => {
    if (!loading) return;
    setAiStep(0);
    const timers = STEPS.map((_, i) => setTimeout(() => setAiStep(i), i * 1000));
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const generate = async () => {
    if (!topic.trim()) { inputRef.current?.focus(); return; }
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slides }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic}.pptx`;
      a.click();
      setToast({ msg: `${topic}.pptx downloaded`, ok: true });
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      setToast({ msg: "Generation failed — please try again", ok: false });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (idx, v) => setSlideData(p => p.map(s => s.idx === idx ? { ...s, ...v } : s));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Instrument+Sans:wght@400;500;600&family=Instrument+Mono&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Instrument Sans', sans-serif; background: #07070c; color: #f1f5f9; -webkit-font-smoothing: antialiased; }
        @keyframes breathe { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.65)} }
        @keyframes dotbounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .sc-enter { animation: fadeUp 0.45s ease both; }
        .na { font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:500; color:rgba(255,255,255,0.4); text-decoration:none; letter-spacing:-0.01em; transition:color 0.15s; }
        .na:hover { color:rgba(255,255,255,0.85); }
        .chip { font-family:'Instrument Mono',monospace; font-size:10.5px; color:rgba(255,255,255,0.35); background:none; border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:5px 10px; cursor:pointer; letter-spacing:0.02em; transition:all 0.15s; white-space:nowrap; }
        .chip:hover { color:rgba(255,255,255,0.8); border-color:rgba(255,255,255,0.2); background:rgba(255,255,255,0.04); }
        .ghost { font-family:'Instrument Sans',sans-serif; font-size:12.5px; font-weight:500; color:rgba(255,255,255,0.38); background:none; border:1px solid rgba(255,255,255,0.09); border-radius:6px; padding:7px 14px; cursor:pointer; letter-spacing:-0.01em; transition:all 0.15s; }
        .ghost:hover { color:rgba(255,255,255,0.8); border-color:rgba(255,255,255,0.2); }
        .ghost.on { border-color:rgba(99,102,241,0.45); color:#a5b4fc; background:rgba(99,102,241,0.07); }
        input::placeholder { color:rgba(255,255,255,0.18); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:99px; }
      `}</style>

      <div style={{ background: "#07070c", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
        <CursorGlow />

        {/* grid texture */}
        <div
          style={{
            position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        {/* ── NAV ── */}
        <nav
          style={{
            position: "sticky", top: 0, zIndex: 200,
            borderBottom: "1px solid rgba(255,255,255,0.055)",
            background: "rgba(7,7,12,0.8)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div
            style={{
              maxWidth: "1120px", margin: "0 auto", padding: "0 32px",
              height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect width="20" height="20" rx="5" fill="#6366f1" />
                <path d="M5.5 10h9M10 5.5l4.5 4.5-4.5 4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "15px", letterSpacing: "-0.04em", color: "#f1f5f9" }}>
                Prompt2Craft
              </span>
            </div>

            <div style={{ display: "flex", gap: "28px" }}>
              <a href="#preview" className="na">Preview</a>
              <a href="#capabilities" className="na">Capabilities</a>
              <a href="#process" className="na">Process</a>
              <a href="#faq" className="na">FAQ</a>
            </div>

            <button
              onClick={() => inputRef.current?.focus()}
              style={{
                fontFamily: "'Instrument Sans',sans-serif",
                fontSize: "12.5px", fontWeight: 600,
                color: "#f1f5f9",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px", padding: "7px 16px",
                cursor: "pointer", letterSpacing: "-0.01em",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            >
              Start free
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ position: "relative", zIndex: 1, maxWidth: "1120px", margin: "0 auto", padding: "116px 32px 96px" }}>
          {/* ambient glow */}
          <div
            style={{
              position: "absolute", top: "20px", left: "50%",
              transform: "translateX(-50%)",
              width: "800px", height: "420px",
              background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ textAlign: "center", animation: "fadeUp 0.65s ease both", position: "relative" }}>
            {/* eyebrow */}
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                marginBottom: "36px", padding: "5px 13px",
                border: "1px solid rgba(99,102,241,0.28)",
                borderRadius: "4px", background: "rgba(99,102,241,0.07)",
              }}
            >
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6366f1", animation: "breathe 2s ease infinite" }} />
              <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "10px", color: "#818cf8", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                AI Presentation Builder
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Fraunces',serif",
                fontSize: "clamp(50px,7vw,84px)",
                fontWeight: 800, color: "#f1f5f9",
                letterSpacing: "-0.045em", lineHeight: "0.98",
                marginBottom: "26px",
              }}
            >
              Describe it.<br />
              <span style={{ background: "linear-gradient(135deg,#6366f1 0%,#a5b4fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Present it.
              </span>
            </h1>

            <p
              style={{
                fontFamily: "'Instrument Sans',sans-serif",
                fontSize: "16.5px", color: "rgba(255,255,255,0.4)",
                lineHeight: "1.7", maxWidth: "420px",
                margin: "0 auto 52px", letterSpacing: "-0.01em",
              }}
            >
              Type a topic. Set your slide count. Download a fully designed, editable PowerPoint in under 30 seconds.
            </p>

            {/* INPUT */}
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex", alignItems: "center",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "9px",
                  padding: "5px 5px 5px 18px",
                  gap: "10px", marginBottom: "14px",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generate()}
                  placeholder={typed || "Your topic..."}
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    fontFamily: "'Instrument Sans',sans-serif",
                    fontSize: "14.5px", color: "#f1f5f9", letterSpacing: "-0.01em",
                  }}
                />

                <div
                  style={{
                    display: "flex", alignItems: "center", gap: "9px",
                    borderLeft: "1px solid rgba(255,255,255,0.07)",
                    paddingLeft: "12px", flexShrink: 0,
                  }}
                >
                  {["-", "+"].map((sym, si) => (
                    <button
                      key={sym}
                      onClick={() => setSlides(s => sym === "-" ? Math.max(3, s - 1) : Math.min(20, s + 1))}
                      style={{
                        width: "22px", height: "22px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "5px", color: "rgba(255,255,255,0.45)",
                        cursor: "pointer", fontSize: "13px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      {sym}
                    </button>
                  ))}
                  <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "11px", color: "rgba(255,255,255,0.38)", minWidth: "48px", textAlign: "center", letterSpacing: "0.04em" }}>
                    {slides} slides
                  </span>
                </div>

                <button
                  onClick={generate}
                  disabled={loading || !topic.trim()}
                  style={{
                    fontFamily: "'Instrument Sans',sans-serif",
                    fontSize: "13.5px", fontWeight: 600,
                    height: "40px", padding: "0 20px",
                    background: "#6366f1", color: "#fff",
                    border: "none", borderRadius: "7px",
                    cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
                    opacity: loading || !topic.trim() ? 0.45 : 1,
                    display: "flex", alignItems: "center", gap: "8px",
                    transition: "all 0.18s ease",
                    letterSpacing: "-0.01em", whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { if (!loading && topic.trim()) { e.currentTarget.style.background = "#818cf8"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 24px rgba(99,102,241,0.3)"; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: "12px", height: "12px", border: "1.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                      Working
                    </>
                  ) : "Generate"}
                </button>
              </div>

              {/* chips */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
                {CHIPS.map((c) => (
                  <button key={c} className="chip" onClick={() => setTopic(c)}>{c}</button>
                ))}
              </div>
            </div>

            {/* stats */}
            <div
              style={{
                display: "flex", justifyContent: "center",
                marginTop: "64px", paddingTop: "40px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {[
                { n: "14,000+", l: "Presentations generated" },
                { n: "< 28s", l: "Median generation time" },
                { n: "4.9 / 5", l: "User satisfaction" },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0 40px",
                    textAlign: "center",
                    borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <p style={{ fontFamily: "'Fraunces',serif", fontSize: "30px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.045em" }}>
                    {s.n}
                  </p>
                  <p style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "9.5px", color: "rgba(255,255,255,0.25)", marginTop: "5px", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PREVIEW ── */}
        <section
          id="preview"
          style={{
            position: "relative", zIndex: 1,
            borderTop: "1px solid rgba(255,255,255,0.055)",
            padding: "80px 32px",
            background: "rgba(255,255,255,0.008)",
          }}
        >
          <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px" }}>
              <div>
                <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "9.5px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "9px" }}>
                  Sample output
                </span>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(22px,3vw,34px)", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.04em" }}>
                  What you will receive
                </h2>
              </div>
              <button
                className={`ghost${editMode ? " on" : ""}`}
                onClick={() => setEditMode(e => !e)}
              >
                {editMode ? "Done editing" : "Edit slides"}
              </button>
            </div>

            {editMode && (
              <div
                style={{
                  marginBottom: "20px", padding: "11px 16px",
                  border: "1px solid rgba(99,102,241,0.18)",
                  borderRadius: "7px", background: "rgba(99,102,241,0.055)",
                }}
              >
                <p style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: "12.5px", color: "rgba(255,255,255,0.42)", letterSpacing: "-0.01em" }}>
                  Select a slide, then edit its title and description directly.
                </p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(215px,1fr))", gap: "10px" }}>
              {slideData.map((slide, i) => (
                <SlideCard
                  key={slide.idx} slide={slide}
                  active={activeSlide === slide.idx}
                  onSelect={(idx) => setActiveSlide(activeSlide === idx ? null : idx)}
                  onEdit={handleEdit} editMode={editMode} delay={i * 55}
                />
              ))}
            </div>

            <p style={{ marginTop: "16px", fontFamily: "'Instrument Mono',monospace", fontSize: "9px", color: "rgba(255,255,255,0.15)", letterSpacing: "0.08em", textAlign: "right" }}>
              HOVER — 3D TILT · CLICK — SELECT · EDIT MODE — INLINE EDITING
            </p>
          </div>
        </section>

        {/* ── CAPABILITIES ── */}
        <section id="capabilities" style={{ position: "relative", zIndex: 1, padding: "96px 32px", maxWidth: "1120px", margin: "0 auto" }}>
          <div style={{ marginBottom: "52px" }}>
            <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "9.5px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
              Capabilities
            </span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(22px,3vw,34px)", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.04em", maxWidth: "360px", lineHeight: "1.15" }}>
              Built for work that matters
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { n: "01", t: "Narrative Intelligence", d: "Identifies logical story arc — problem, insight, solution, evidence — and maps each beat to a slide with appropriate content density.", tag: "Content" },
              { n: "02", t: "Professional Visual Design", d: "Applies typographic hierarchy, spatial rhythm, and layout conventions from real design systems — not generic stock templates.", tag: "Design" },
              { n: "03", t: "Instant Slide Editing", d: "Adjust, rename, and rewrite individual slides before exporting. The preview responds in real time as you work.", tag: "Editing" },
              { n: "04", t: "Universal File Compatibility", d: "Output is a standard .pptx — fully editable in Microsoft PowerPoint, Apple Keynote, and Google Slides.", tag: "Export" },
              { n: "05", t: "Speed at Scale", d: "A 15-slide deck with data callouts and speaker notes generates in under 30 seconds. Pro queue unlocks sub-10-second priority.", tag: "Performance" },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  display: "grid", gridTemplateColumns: "52px 1fr 1fr 100px",
                  gap: "32px", alignItems: "center",
                  padding: "26px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.045)",
                  borderRadius: "6px",
                  transition: "background 0.15s, padding-left 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.016)"; e.currentTarget.style.paddingLeft = "20px"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.paddingLeft = "12px"; }}
              >
                <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "10px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em" }}>{f.n}</span>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: "16.5px", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.025em" }}>{f.t}</span>
                <span style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.36)", lineHeight: "1.6", letterSpacing: "-0.01em" }}>{f.d}</span>
                <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "9px", color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", border: "1px solid rgba(99,102,241,0.22)", borderRadius: "4px", background: "rgba(99,102,241,0.07)", textAlign: "center" }}>
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROCESS ── */}
        <section
          id="process"
          style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.055)", padding: "96px 32px" }}
        >
          <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
            <div style={{ marginBottom: "52px" }}>
              <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "9.5px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                Process
              </span>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(22px,3vw,34px)", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.04em" }}>
                From idea to deck in four steps
              </h2>
            </div>

            <div
              style={{
                display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                gap: "1px", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.055)",
                borderRadius: "10px", overflow: "hidden",
              }}
            >
              {[
                { n: "01", t: "Enter your topic", d: "A sentence is enough. The AI infers structure, depth, and tone from your input alone." },
                { n: "02", t: "Set slide count", d: "Choose 3 to 20 slides. Content density adjusts automatically to your chosen format." },
                { n: "03", t: "Watch it build", d: "A live progress readout tracks each stage — outline, writing, design, packaging." },
                { n: "04", t: "Download PPTX", d: "One click saves a fully designed, editable PowerPoint to your device.", accent: true },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "36px 28px",
                    background: s.accent ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)",
                    borderRight: i < 3 ? "1px solid rgba(255,255,255,0.045)" : "none",
                    position: "relative", overflow: "hidden",
                    transition: "background 0.18s",
                  }}
                  onMouseEnter={(e) => { if (!s.accent) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { if (!s.accent) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                >
                  {s.accent && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1.5px", background: "linear-gradient(90deg,#6366f1,#a5b4fc)" }} />
                  )}
                  <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "9.5px", color: s.accent ? "#818cf8" : "rgba(255,255,255,0.18)", letterSpacing: "0.1em", display: "block", marginBottom: "28px" }}>
                    {s.n}
                  </span>
                  <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: "16px", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.025em", lineHeight: "1.25", marginBottom: "12px" }}>
                    {s.t}
                  </h3>
                  <p style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: "12.5px", color: "rgba(255,255,255,0.35)", lineHeight: "1.65" }}>
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.055)", padding: "96px 32px" }}>
          <div
            style={{
              maxWidth: "1120px", margin: "0 auto",
              display: "grid", gridTemplateColumns: "300px 1fr",
              gap: "80px", alignItems: "start",
            }}
          >
            <div style={{ position: "sticky", top: "80px" }}>
              <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "9.5px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                FAQ
              </span>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "34px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.04em", lineHeight: "1.1", marginBottom: "18px" }}>
                Common questions
              </h2>
              <p style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.3)", lineHeight: "1.7" }}>
                Anything not answered here? Reach out via the contact page.
              </p>
            </div>
            <FAQSection />
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.055)", padding: "52px 32px 36px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
            <div
              style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "48px", paddingBottom: "48px",
                borderBottom: "1px solid rgba(255,255,255,0.045)", marginBottom: "28px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect width="20" height="20" rx="5" fill="#6366f1" />
                    <path d="M5.5 10h9M10 5.5l4.5 4.5-4.5 4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "14.5px", color: "#f1f5f9", letterSpacing: "-0.04em" }}>Prompt2Craft</span>
                </div>
                <p style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: "12.5px", color: "rgba(255,255,255,0.28)", lineHeight: "1.7", maxWidth: "200px" }}>
                  AI-generated presentations for professionals. Built with precision, exported in seconds.
                </p>
              </div>
              {[
                { t: "Product", l: ["Generator", "Templates", "API", "Changelog"] },
                { t: "Resources", l: ["Documentation", "Blog", "Status", "Support"] },
                { t: "Company", l: ["About", "Careers", "Privacy", "Terms"] },
              ].map((col) => (
                <div key={col.t}>
                  <p style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "9.5px", color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
                    {col.t}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {col.l.map((l) => (
                      <a key={l} href="#" className="na" style={{ fontSize: "12.5px" }}>{l}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "9px", color: "rgba(255,255,255,0.16)", letterSpacing: "0.06em" }}>© 2025 PROMPT2CRAFT</span>
              <span style={{ fontFamily: "'Instrument Mono',monospace", fontSize: "9px", color: "rgba(255,255,255,0.16)", letterSpacing: "0.06em" }}>BUILT FOR PROFESSIONALS</span>
            </div>
          </div>
        </footer>

        {loading && <AIOverlay step={aiStep} />}

        {toast && (
          <div
            style={{
              position: "fixed", bottom: "24px", right: "24px",
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "9px", padding: "13px 17px",
              display: "flex", alignItems: "center", gap: "10px",
              boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
              animation: "fadeUp 0.2s ease both", zIndex: 8000,
            }}
          >
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: toast.ok ? "#4ade80" : "#f87171", flexShrink: 0 }} />
            <span style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.75)", letterSpacing: "-0.01em" }}>
              {toast.msg}
            </span>
          </div>
        )}
      </div>
    </>
  );
}