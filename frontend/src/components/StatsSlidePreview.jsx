import { SLIDE_THEME } from "./slidePreviewTheme";

function splitStat(value) {
  const text = typeof value === "string" ? value.trim() : "";

  if (text.includes(":")) {
    const [metric, ...rest] = text.split(":");
    return { metric: metric.trim(), label: rest.join(":").trim() };
  }

  if (text.includes(" - ")) {
    const [metric, ...rest] = text.split(" - ");
    return { metric: metric.trim(), label: rest.join(" - ").trim() };
  }

  return { metric: text || "Metric", label: "Supporting proof point" };
}

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
        {stats.slice(0, 4).map((stat, index) => {
          const parsed = splitStat(stat);

          return (
            <div key={`${stat}-${index}`} style={{ borderRadius: 20, border: `1px solid ${SLIDE_THEME.border}`, background: index === 0 ? SLIDE_THEME.accentSoft : "#ffffff", padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 112 }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1.15, letterSpacing: "-0.03em", color: SLIDE_THEME.text }}>
                {parsed.metric}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, lineHeight: 1.5, color: SLIDE_THEME.muted, marginTop: 12 }}>
                {parsed.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
