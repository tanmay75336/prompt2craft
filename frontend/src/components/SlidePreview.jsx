import ContentSlidePreview from "./ContentSlidePreview";
import ImageSlidePreview from "./ImageSlidePreview";
import StatsSlidePreview from "./StatsSlidePreview";
import TimelineSlidePreview from "./TimelineSlidePreview";
import TitleSlidePreview from "./TitleSlidePreview";
import TwoColumnSlidePreview from "./TwoColumnSlidePreview";

function getPreviewComponent(layout) {
  switch (layout) {
    case "title":
      return TitleSlidePreview;
    case "image":
      return ImageSlidePreview;
    case "timeline":
      return TimelineSlidePreview;
    case "stats":
      return StatsSlidePreview;
    case "two-column":
      return TwoColumnSlidePreview;
    case "content":
    default:
      return ContentSlidePreview;
  }
}

export default function SlidePreview({ slide }) {
  const PreviewComponent = getPreviewComponent(slide?.layout);

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        background: "#ffffff",
        border: "1px solid #e7ebf0",
        borderRadius: 26,
        boxShadow: "0 24px 55px rgba(15,23,42,0.12)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ height: 10, background: "#ff7300" }} />
      <div style={{ padding: 28, height: "calc(100% - 10px)" }}>
        <PreviewComponent slide={slide} />
      </div>
    </div>
  );
}
