import SlideImageFrame from "./SlideImageFrame";
import { SLIDE_THEME } from "./slidePreviewTheme";

export default function TitleSlidePreview({ slide }) {
  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 24, alignItems: "stretch" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
        <div style={{ width: 74, height: 6, borderRadius: 999, background: SLIDE_THEME.accent }} />
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: SLIDE_THEME.accent }}>
          Premium overview
        </p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.08, letterSpacing: "-0.04em", color: SLIDE_THEME.text, maxWidth: "92%" }}>
          {slide.title}
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.6, color: SLIDE_THEME.muted, maxWidth: "82%" }}>
          {slide.subtitle || "Add a subtitle to introduce the presentation."}
        </p>
      </div>
      <SlideImageFrame slide={slide} label="Hero visual" rounded={26} />
    </div>
  );
}
