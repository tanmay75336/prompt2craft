import { SLIDE_THEME } from "./slidePreviewTheme";

export default function StatsSlidePreview({ slide }) {
  const stats = slide.stats?.length ? slide.stats : ["Metric", "Growth", "Reach", "Outcome"];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.04em", color: SLIDE_THEME.text, marginBottom: 10 }}>
        {slide.title}
      </h2>
      {slide.subtitle ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.6, color: SLIDE_THEME.muted, marginBottom: 22 }}>
          {slide.subtitle}
        </p>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16, flex: 1 }}>
        {stats.slice(0, 4).map((stat, index) => (
          <div key={`${stat}-${index}`} style={{ borderRadius: 20, border: `1px solid ${SLIDE_THEME.border}`, background: index === 0 ? SLIDE_THEME.accentSoft : "#ffffff", padding: 18, display: "flex", alignItems: "flex-end", minHeight: 112 }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.03em", color: SLIDE_THEME.text }}>
              {stat}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
