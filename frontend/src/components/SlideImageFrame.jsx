import { useEffect, useState } from "react";
import { buildPreviewImageUrl, resolveSlideImageQuery } from "../lib/presentation";
import { SLIDE_THEME } from "./slidePreviewTheme";

export default function SlideImageFrame({ slide, label = "Visual", height = "100%", rounded = 24 }) {
  const src = slide?.previewImageUrl || buildPreviewImageUrl(slide);
  const query = resolveSlideImageQuery(slide);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        style={{
          height,
          borderRadius: rounded,
          background: "linear-gradient(180deg,#fff6ed 0%,#ffe4d0 100%)",
          border: `1px solid ${SLIDE_THEME.border}`,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            background: "#ffffff",
            border: `1px solid ${SLIDE_THEME.border}`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M4 17l4.5-5.5 3.5 4 2.5-3 3.5 4.5M6.5 8.5h.01M5 4h12a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"
              stroke={SLIDE_THEME.accent}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: SLIDE_THEME.accent,
              marginBottom: 12,
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              lineHeight: 1.35,
              letterSpacing: "-0.03em",
              color: SLIDE_THEME.text,
            }}
          >
            {query || "Relevant visual prompt"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height,
        borderRadius: rounded,
        border: `1px solid ${SLIDE_THEME.border}`,
        overflow: "hidden",
        position: "relative",
        background: "#f7f8fb",
      }}
    >
      <img
        src={src}
        alt={query || slide?.title || "Presentation visual"}
        onError={() => setHasError(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div
        style={{
          position: "absolute",
          insetInline: 16,
          bottom: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          width: "fit-content",
          maxWidth: "calc(100% - 32px)",
          borderRadius: 999,
          background: "rgba(15,23,42,0.68)",
          color: "#ffffff",
          padding: "9px 12px",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#fb923c",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {query || "Editorial visual"}
        </span>
      </div>
    </div>
  );
}
