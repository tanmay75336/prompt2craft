import { SLIDE_THEME } from "./slidePreviewTheme";

function ColumnList({ title, items }) {
  return (
    <div style={{ borderRadius: 20, border: `1px solid ${SLIDE_THEME.border}`, background: "#ffffff", padding: 18 }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: SLIDE_THEME.accent, marginBottom: 14 }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item, index) => (
          <div key={`${item}-${index}`} style={{ display: "flex", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: SLIDE_THEME.accent, marginTop: 8, flexShrink: 0 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.55, color: SLIDE_THEME.muted }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TwoColumnSlidePreview({ slide }) {
  const left = slide.left?.length ? slide.left : ["Left side point 1", "Left side point 2"];
  const right = slide.right?.length ? slide.right : ["Right side point 1", "Right side point 2"];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.04em", color: SLIDE_THEME.text, marginBottom: 22 }}>
        {slide.title}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16, flex: 1 }}>
        <ColumnList title="Column One" items={left} />
        <ColumnList title="Column Two" items={right} />
      </div>
    </div>
  );
}
