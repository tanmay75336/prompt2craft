import SlideImageFrame from "./SlideImageFrame";
import { SLIDE_THEME } from "./slidePreviewTheme";

export default function ImageSlidePreview({ slide }) {
  const points = slide.points?.length ? slide.points : ["Describe the supporting narrative for this image slide."];

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 24, alignItems: "stretch" }}>
      <SlideImageFrame slide={slide} label="Visual narrative" rounded={22} />

      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: SLIDE_THEME.accent, marginBottom: 10 }}>
          Supporting narrative
        </p>
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
