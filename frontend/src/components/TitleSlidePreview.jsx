import { SLIDE_THEME } from "./slidePreviewTheme";

export default function TitleSlidePreview({ slide }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
      <div style={{ width: 74, height: 6, borderRadius: 999, background: SLIDE_THEME.accent }} />
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.08, letterSpacing: "-0.04em", color: SLIDE_THEME.text, maxWidth: "82%" }}>
        {slide.title}
      </h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.6, color: SLIDE_THEME.muted, maxWidth: "72%" }}>
        {slide.subtitle || "Add a subtitle to introduce the presentation."}
      </p>
    </div>
  );
}
