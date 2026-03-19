import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SlidePreview from "../components/SlidePreview";
import { ThemeStyles } from "../components/ThemeStyles";
import {
  createEmptySlide,
  createPresentationFilename,
  EDITOR_LAYOUTS,
  downloadBlob,
  normalizeSlides,
  serializeSlides,
} from "../lib/presentation";
import { generatePresentationFromJson } from "../services/api";

const editorStyles = `
  .editor-shell {
    min-height: 100vh;
    background: #f5f7fa;
  }

  .editor-topbar {
    position: sticky;
    top: 0;
    z-index: 240;
    background: rgba(245,247,250,0.92);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid #e7ebf0;
  }

  .editor-wrap {
    max-width: 1420px;
    margin: 0 auto;
    padding: 28px;
  }

  .editor-layout {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr) 340px;
    gap: 20px;
    align-items: start;
  }

  .editor-panel {
    background: #ffffff;
    border: 1px solid #e7ebf0;
    border-radius: 24px;
    box-shadow: 0 18px 45px rgba(15,23,42,0.08);
  }

  .editor-sidebar,
  .editor-inspector {
    position: sticky;
    top: 94px;
  }

  .editor-slide-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: calc(100vh - 170px);
    overflow: auto;
    padding-right: 4px;
  }

  .editor-slide-item {
    width: 100%;
    text-align: left;
    border: 1px solid #e7ebf0;
    background: #ffffff;
    border-radius: 18px;
    padding: 14px;
    cursor: pointer;
    transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
  }

  .editor-slide-item:hover {
    border-color: rgba(255,115,0,.35);
    transform: translateY(-1px);
  }

  .editor-slide-item.active {
    border-color: #ff7300;
    box-shadow: 0 0 0 4px rgba(255,115,0,.08);
    background: #fffaf6;
  }

  .editor-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .editor-label {
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #ff7300;
  }

  .editor-input,
  .editor-textarea,
  .editor-select {
    width: 100%;
    border: 1px solid #d9e0e7;
    background: #ffffff;
    border-radius: 14px;
    padding: 12px 14px;
    font-family: var(--font-body);
    font-size: 14px;
    color: #1f2937;
    outline: none;
    transition: border-color .16s ease, box-shadow .16s ease;
  }

  .editor-input:focus,
  .editor-textarea:focus,
  .editor-select:focus {
    border-color: rgba(255,115,0,.55);
    box-shadow: 0 0 0 4px rgba(255,115,0,.08);
  }

  .editor-textarea {
    min-height: 116px;
    resize: vertical;
    line-height: 1.55;
  }

  .editor-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .editor-small-button {
    border: 1px solid #e7ebf0;
    background: #ffffff;
    color: #1f2937;
    border-radius: 12px;
    padding: 10px 14px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .editor-small-button:hover {
    border-color: rgba(255,115,0,.35);
    background: #fff7f0;
  }

  .editor-danger {
    color: #c2410c;
  }

  @media (max-width: 1180px) {
    .editor-layout {
      grid-template-columns: 1fr;
    }

    .editor-sidebar,
    .editor-inspector {
      position: static;
    }

    .editor-slide-list {
      max-height: none;
    }
  }

  @media (max-width: 768px) {
    .editor-wrap {
      padding: 20px 16px;
    }
  }
`;

function textToList(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function moveItem(items, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export default function SlideEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const previewState = location.state;

  const initialSlides = useMemo(
    () => normalizeSlides(previewState?.slides ?? []),
    [previewState?.slides],
  );

  const [slides, setSlides] = useState(initialSlides);
  const [selectedSlideId, setSelectedSlideId] = useState(initialSlides[0]?.id ?? null);
  const [draggedSlideId, setDraggedSlideId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const topic = previewState?.topic ?? "Prompt2Craft Presentation";
  const filename = previewState?.filename ?? createPresentationFilename(topic);
  const deckInsights = useMemo(() => {
    const layoutCounts = slides.reduce((counts, slide) => {
      counts[slide.layout] = (counts[slide.layout] ?? 0) + 1;
      return counts;
    }, {});

    const visualSlides = (layoutCounts.title ?? 0) + (layoutCounts.image ?? 0);
    const proofSlides = (layoutCounts.stats ?? 0) + (layoutCounts.timeline ?? 0);
    const totalNarrativePoints = slides.reduce((total, slide) => total + (slide.points?.length ?? 0), 0);
    const averageNarrativeDensity = slides.length ? (totalNarrativePoints / slides.length).toFixed(1) : "0.0";
    const suggestions = [];

    if (slides.length >= 5 && proofSlides === 0) {
      suggestions.push("Add one proof slide with stats or a timeline to strengthen credibility.");
    }

    if (slides.length >= 4 && (layoutCounts.image ?? 0) === 0) {
      suggestions.push("Add an image-led slide to improve visual pacing.");
    }

    if (Number(averageNarrativeDensity) > 4.2) {
      suggestions.push("A few slides are text-heavy. Trim copy for faster scanning.");
    }

    if (!suggestions.length) {
      suggestions.push("The deck has a healthy mix of narrative, proof, and visual pacing.");
    }

    return {
      visualSlides,
      proofSlides,
      averageNarrativeDensity,
      suggestions,
    };
  }, [slides]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  useEffect(() => {
    if (!slides.length) {
      setSelectedSlideId(null);
      return;
    }

    if (!slides.some((slide) => slide.id === selectedSlideId)) {
      setSelectedSlideId(slides[0].id);
    }
  }, [selectedSlideId, slides]);

  if (!previewState?.slides?.length) {
    return (
      <>
        <ThemeStyles />
        <style>{editorStyles}</style>
        <div className="editor-shell">
          <div className="editor-topbar">
            <div className="nav-inner">
              <Link to="/" className="logo-link" aria-label="Prompt2Craft home">
                <div className="logo-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 5h10M3 8h7M3 11h5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="logo-text">Prompt2Craft</span>
              </Link>
            </div>
          </div>

          <main className="editor-wrap">
            <div className="editor-panel" style={{ maxWidth: 680, margin: "60px auto 0", padding: 28, textAlign: "center" }}>
              <span className="section-label">Preview unavailable</span>
              <h1 className="section-title" style={{ fontSize: "clamp(30px,5vw,46px)", marginBottom: 14 }}>
                No generated slide preview found
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "#667085", lineHeight: 1.7 }}>
                Generate a new presentation from the home page first, then review and edit it here before downloading.
              </p>
              <button className="primary-button" type="button" style={{ marginTop: 24, maxWidth: 220, marginInline: "auto" }} onClick={() => navigate("/")}>
                Back to home
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  const selectedSlide = slides.find((slide) => slide.id === selectedSlideId) ?? slides[0];

  const updateSlide = (slideId, updater) => {
    setSlides((current) =>
      current.map((slide) => {
        if (slide.id !== slideId) {
          return slide;
        }

        return typeof updater === "function" ? updater(slide) : { ...slide, ...updater };
      }),
    );
  };

  const addSlide = () => {
    const nextSlide = createEmptySlide("content", slides.length);
    setSlides((current) => [...current, nextSlide]);
    setSelectedSlideId(nextSlide.id);
  };

  const duplicateSlide = (slideId) => {
    const sourceIndex = slides.findIndex((slide) => slide.id === slideId);
    if (sourceIndex === -1) {
      return;
    }

    const source = slides[sourceIndex];
    const duplicate = {
      ...source,
      id: createEmptySlide(source.layout, sourceIndex + 1).id,
      title: `${source.title} Copy`,
    };

    setSlides((current) => {
      const next = [...current];
      next.splice(sourceIndex + 1, 0, duplicate);
      return next;
    });
    setSelectedSlideId(duplicate.id);
  };

  const deleteSlide = (slideId) => {
    if (slides.length === 1) {
      return;
    }

    setSlides((current) => current.filter((slide) => slide.id !== slideId));
  };

  const handleDrop = (targetId) => {
    if (!draggedSlideId || draggedSlideId === targetId) {
      return;
    }

    setSlides((current) => {
      const fromIndex = current.findIndex((slide) => slide.id === draggedSlideId);
      const toIndex = current.findIndex((slide) => slide.id === targetId);
      return moveItem(current, fromIndex, toIndex);
    });
    setDraggedSlideId(null);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError("");

      const blob = await generatePresentationFromJson(serializeSlides(slides));
      downloadBlob(blob, filename);
    } catch (downloadError) {
      setError(downloadError.message || "Unable to generate the PowerPoint file.");
    } finally {
      setDownloading(false);
    }
  };

  const usageItems = [
    { label: "Topic", value: topic },
    { label: "Slides", value: slides.length },
    { label: "Free used", value: `${previewState?.freeUsed ?? 0} / 3` },
    { label: "Paid generations", value: previewState?.paidUsed ?? 0 },
  ];

  return (
    <>
      <ThemeStyles />
      <style>{editorStyles}</style>
      <div className="editor-shell">
        <div className="editor-topbar">
          <div className="nav-inner" style={{ height: 70 }}>
            <Link to="/" className="logo-link" aria-label="Prompt2Craft home">
              <div className="logo-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5h10M3 8h7M3 11h5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span className="logo-text">Prompt2Craft</span>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button className="secondary-button" type="button" style={{ width: "auto", paddingInline: 18 }} onClick={() => navigate("/")}>
                Generate another
              </button>
              <button className="primary-button" type="button" style={{ width: "auto", paddingInline: 20 }} disabled={downloading} onClick={handleDownload}>
                {downloading ? "Generating PPT..." : "Download PPT"}
              </button>
            </div>
          </div>
        </div>

        <main className="editor-wrap">
          <div style={{ marginBottom: 24 }}>
            <span className="section-label">Editable preview</span>
            <h1 className="section-title" style={{ fontSize: "clamp(30px,4vw,52px)", marginBottom: 12 }}>
              Review the deck before export
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "#667085", lineHeight: 1.7, maxWidth: 820 }}>
              Prompt2Craft generated a structured slide draft for <strong style={{ color: "#1f2937" }}>{topic}</strong>. Edit the content, adjust layouts, reorder slides, and download the PPT only when you are satisfied.
            </p>
          </div>

          {error ? (
            <div className="editor-panel" style={{ padding: 16, marginBottom: 18, borderColor: "rgba(194,65,12,.18)", background: "#fff7ed" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#c2410c", lineHeight: 1.6 }}>{error}</p>
            </div>
          ) : null}

          <div className="editor-layout">
            <aside className="editor-panel editor-sidebar" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#1f2937" }}>Slides</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#667085", marginTop: 4 }}>{slides.length} total</p>
                </div>
                <button className="editor-small-button" type="button" onClick={addSlide}>
                  + Add
                </button>
              </div>

              <div className="editor-slide-list">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    draggable
                    className={`editor-slide-item ${selectedSlide.id === slide.id ? "active" : ""}`}
                    onClick={() => setSelectedSlideId(slide.id)}
                    onDragStart={() => setDraggedSlideId(slide.id)}
                    onDragEnd={() => setDraggedSlideId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(slide.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ff7300", marginBottom: 6 }}>
                          Slide {String(index + 1).padStart(2, "0")}
                        </p>
                        <p style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#1f2937", lineHeight: 1.25 }}>
                          {slide.title}
                        </p>
                      </div>
                      <span style={{ flexShrink: 0, borderRadius: 999, background: "#fff1e8", color: "#ff7300", padding: "5px 9px", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
                        {slide.layout}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#667085" }}>Drag to reorder</span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <section className="editor-panel" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
                <div>
                  <span className="inline-badge" style={{ background: "#fff1e8", borderColor: "rgba(255,115,0,.14)", color: "#c2410c" }}>
                    Center preview
                  </span>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#667085", marginTop: 10 }}>
                    Selected slide: {slides.findIndex((slide) => slide.id === selectedSlide.id) + 1} of {slides.length}
                  </p>
                </div>

                <div className="editor-toolbar">
                  <button className="editor-small-button" type="button" onClick={() => duplicateSlide(selectedSlide.id)}>
                    Duplicate
                  </button>
                  <button className="editor-small-button editor-danger" type="button" onClick={() => deleteSlide(selectedSlide.id)} disabled={slides.length === 1}>
                    Delete
                  </button>
                </div>
              </div>

              <div style={{ maxWidth: 920, margin: "0 auto" }}>
                <SlidePreview slide={selectedSlide} />
              </div>
            </section>

            <aside className="editor-panel editor-inspector" style={{ padding: 20 }}>
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#1f2937" }}>Edit slide</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#667085", marginTop: 4 }}>
                  Update titles, content, and layout-specific details.
                </p>
              </div>

              <div style={{ padding: 16, borderRadius: 18, background: "#fffaf6", border: "1px solid #fde1cc", marginBottom: 18 }}>
                {usageItems.map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #f4dfd0" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "#667085" }}>{item.label}</span>
                    <strong style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "#1f2937", textAlign: "right" }}>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div style={{ padding: 16, borderRadius: 18, background: "#f8fafc", border: "1px solid #e7ebf0", marginBottom: 18 }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "#1f2937", marginBottom: 14 }}>
                  Deck insights
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginBottom: 14 }}>
                  <div style={{ borderRadius: 14, background: "#ffffff", border: "1px solid #e7ebf0", padding: 12 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ff7300", marginBottom: 8 }}>
                      Visuals
                    </p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#1f2937" }}>
                      {deckInsights.visualSlides}
                    </p>
                  </div>
                  <div style={{ borderRadius: 14, background: "#ffffff", border: "1px solid #e7ebf0", padding: 12 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ff7300", marginBottom: 8 }}>
                      Proof
                    </p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#1f2937" }}>
                      {deckInsights.proofSlides}
                    </p>
                  </div>
                  <div style={{ borderRadius: 14, background: "#ffffff", border: "1px solid #e7ebf0", padding: 12 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ff7300", marginBottom: 8 }}>
                      Density
                    </p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#1f2937" }}>
                      {deckInsights.averageNarrativeDensity}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {deckInsights.suggestions.map((suggestion) => (
                    <div key={suggestion} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff7300", marginTop: 7, flexShrink: 0 }} />
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.55, color: "#667085" }}>{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="editor-toolbar" style={{ marginBottom: 16 }}>
                <button className="editor-small-button" type="button" onClick={addSlide}>
                  Add slide
                </button>
                <button className="editor-small-button" type="button" onClick={() => duplicateSlide(selectedSlide.id)}>
                  Duplicate
                </button>
              </div>

              <div className="editor-field">
                <label className="editor-label" htmlFor="slide-layout">Layout</label>
                <select
                  id="slide-layout"
                  className="editor-select"
                  value={selectedSlide.layout}
                  onChange={(event) => updateSlide(selectedSlide.id, { layout: event.target.value })}
                >
                  {EDITOR_LAYOUTS.map((layout) => (
                    <option key={layout} value={layout}>
                      {layout}
                    </option>
                  ))}
                </select>
              </div>

              <div className="editor-field">
                <label className="editor-label" htmlFor="slide-title">Slide title</label>
                <input
                  id="slide-title"
                  className="editor-input"
                  value={selectedSlide.title}
                  onChange={(event) => updateSlide(selectedSlide.id, { title: event.target.value })}
                />
              </div>

              <div className="editor-field">
                <label className="editor-label" htmlFor="slide-subtitle">Subtitle</label>
                <input
                  id="slide-subtitle"
                  className="editor-input"
                  value={selectedSlide.subtitle}
                  onChange={(event) => updateSlide(selectedSlide.id, { subtitle: event.target.value })}
                />
              </div>

              {(selectedSlide.layout === "content" || selectedSlide.layout === "image") ? (
                <div className="editor-field">
                  <label className="editor-label" htmlFor="slide-points">Bullet points</label>
                  <textarea
                    id="slide-points"
                    className="editor-textarea"
                    value={listToText(selectedSlide.points)}
                    onChange={(event) => updateSlide(selectedSlide.id, { points: textToList(event.target.value) })}
                    placeholder="One bullet per line"
                  />
                </div>
              ) : null}

              {selectedSlide.layout === "image" ? (
                <div className="editor-field">
                  <label className="editor-label" htmlFor="slide-image-prompt">Image prompt</label>
                  <input
                    id="slide-image-prompt"
                    className="editor-input"
                    value={selectedSlide.imagePrompt}
                    onChange={(event) => updateSlide(selectedSlide.id, { imagePrompt: event.target.value })}
                  />
                </div>
              ) : null}

              {selectedSlide.layout === "timeline" ? (
                <div className="editor-field">
                  <label className="editor-label" htmlFor="slide-timeline">Timeline points</label>
                  <textarea
                    id="slide-timeline"
                    className="editor-textarea"
                    value={listToText(selectedSlide.timelinePoints)}
                    onChange={(event) => updateSlide(selectedSlide.id, { timelinePoints: textToList(event.target.value) })}
                    placeholder="One timeline point per line"
                  />
                </div>
              ) : null}

              {selectedSlide.layout === "stats" ? (
                <div className="editor-field">
                  <label className="editor-label" htmlFor="slide-stats">Stats text</label>
                  <textarea
                    id="slide-stats"
                    className="editor-textarea"
                    value={listToText(selectedSlide.stats)}
                    onChange={(event) => updateSlide(selectedSlide.id, { stats: textToList(event.target.value) })}
                    placeholder="One stat per line"
                  />
                </div>
              ) : null}

              {selectedSlide.layout === "two-column" ? (
                <>
                  <div className="editor-field">
                    <label className="editor-label" htmlFor="slide-left">Left column</label>
                    <textarea
                      id="slide-left"
                      className="editor-textarea"
                      value={listToText(selectedSlide.left)}
                      onChange={(event) => updateSlide(selectedSlide.id, { left: textToList(event.target.value) })}
                      placeholder="One left-column item per line"
                    />
                  </div>

                  <div className="editor-field">
                    <label className="editor-label" htmlFor="slide-right">Right column</label>
                    <textarea
                      id="slide-right"
                      className="editor-textarea"
                      value={listToText(selectedSlide.right)}
                      onChange={(event) => updateSlide(selectedSlide.id, { right: textToList(event.target.value) })}
                      placeholder="One right-column item per line"
                    />
                  </div>
                </>
              ) : null}

              <button className="primary-button" type="button" disabled={downloading} onClick={handleDownload}>
                {downloading ? "Generating PPT..." : "Download edited PPT"}
              </button>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
