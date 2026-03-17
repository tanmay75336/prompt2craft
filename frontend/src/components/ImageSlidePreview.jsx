import { SLIDE_THEME } from "./slidePreviewTheme";

export default function ImageSlidePreview({ slide }) {
  const points = slide.points?.length ? slide.points : ["Describe the supporting narrative for this image slide."];

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 24, alignItems: "stretch" }}>
      <div style={{ borderRadius: 22, background: "linear-gradient(180deg,#fff6ed 0%,#ffe7d4 100%)", border: `1px solid ${SLIDE_THEME.border}`, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 0 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "#ffffff", border: `1px solid ${SLIDE_THEME.border}`, display: "grid", placeItems: "center" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 17l4.5-5.5 3.5 4 2.5-3 3.5 4.5M6.5 8.5h.01M5 4h12a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke={SLIDE_THEME.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: SLIDE_THEME.accent, marginBottom: 12 }}>Image Prompt</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.35, letterSpacing: "-0.03em", color: SLIDE_THEME.text }}>
            {slide.imagePrompt || slide.title || "Relevant visual prompt"}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 1.12, letterSpacing: "-0.04em", color: SLIDE_THEME.text, marginBottom: 18 }}>
          {slide.title}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {points.map((point, index) => (
            <div key={`${point}-${index}`} style={{ display: "flex", gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: SLIDE_THEME.accent, marginTop: 8, flexShrink: 0 }} />
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.55, color: SLIDE_THEME.muted }}>{point}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
