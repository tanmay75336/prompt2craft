import { SLIDE_THEME } from "./slidePreviewTheme";

export default function ContentSlidePreview({ slide }) {
  const points = slide.points?.length ? slide.points : ["Add supporting points here"];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.04em", color: SLIDE_THEME.text, marginBottom: 24 }}>
        {slide.title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {points.map((point, index) => (
          <div key={`${point}-${index}`} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: SLIDE_THEME.accent, marginTop: 8, flexShrink: 0 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 17, lineHeight: 1.55, color: SLIDE_THEME.muted }}>{point}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
