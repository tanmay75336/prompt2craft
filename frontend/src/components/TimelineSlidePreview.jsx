import { SLIDE_THEME } from "./slidePreviewTheme";

export default function TimelineSlidePreview({ slide }) {
  const points = slide.timelinePoints?.length ? slide.timelinePoints : ["Milestone 1", "Milestone 2", "Milestone 3"];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.04em", color: SLIDE_THEME.text, marginBottom: 26 }}>
        {slide.title}
      </h2>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16, paddingLeft: 18 }}>
        <div style={{ position: "absolute", left: 5, top: 8, bottom: 8, width: 2, background: "#ffd2b2" }} />
        {points.map((point, index) => (
          <div key={`${point}-${index}`} style={{ position: "relative", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: SLIDE_THEME.accent, marginTop: 7, flexShrink: 0, boxShadow: "0 0 0 6px #fff1e8" }} />
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: SLIDE_THEME.accent, textTransform: "uppercase", marginBottom: 6 }}>
                Step {index + 1}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.55, color: SLIDE_THEME.muted }}>{point}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
