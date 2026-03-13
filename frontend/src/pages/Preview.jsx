import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeStyles } from "../components/ThemeStyles";
import { downloadBlob } from "../lib/presentation";

export default function Preview() {
  const navigate = useNavigate();
  const location = useLocation();
  const previewState = location.state;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  if (!previewState?.blob || !previewState?.slides) {
    return (
      <>
        <ThemeStyles />
        <div className="page-shell">
          <div className="page-nav">
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

          <main className="page-content">
            <div className="panel-card" style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
              <span className="section-label">Preview unavailable</span>
              <h1 className="section-title" style={{ fontSize: "clamp(30px,5vw,46px)", marginBottom: 14 }}>
                No generated presentation found
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--muted)", lineHeight: 1.7 }}>
                Generate a new presentation from the landing page first, then review it here before downloading.
              </p>
              <button
                className="primary-button"
                type="button"
                style={{ marginTop: 24, maxWidth: 220, marginInline: "auto" }}
                onClick={() => navigate("/")}
              >
                Back to home
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  const { blob, filename, slides, topic, freeUsed, paidUsed } = previewState;

  return (
    <>
      <ThemeStyles />
      <div className="page-shell">
        <div className="page-nav">
          <div className="nav-inner">
            <Link to="/" className="logo-link" aria-label="Prompt2Craft home">
              <div className="logo-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5h10M3 8h7M3 11h5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span className="logo-text">Prompt2Craft</span>
            </Link>

            <button className="secondary-button" type="button" style={{ width: "auto", paddingInline: 20 }} onClick={() => navigate("/")}>
              Back
            </button>
          </div>
        </div>

        <main className="page-content">
          <div className="page-grid">
            <section className="panel-card">
              <span className="section-label">Presentation preview</span>
              <h1 className="section-title" style={{ fontSize: "clamp(34px,5vw,56px)", marginBottom: 14 }}>
                Review before download
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--muted)", lineHeight: 1.7 }}>
                Prompt2Craft generated this preview for <strong style={{ color: "var(--fg)" }}>{topic}</strong>. Download the PPT when you are ready.
              </p>

              <div className="preview-grid">
                {slides.map((slide) => (
                  <article key={slide.id} className="preview-slide-card">
                    <div className="preview-slide-top" style={{ background: slide.accent }} />
                    <div className="preview-slide-body">
                      <p className="preview-slide-index">SLIDE {String(slide.id).padStart(2, "0")}</p>
                      <h2 className="preview-slide-title">{slide.title}</h2>
                      <div className="preview-bullets">
                        {slide.bullets.map((bullet) => (
                          <div key={bullet} className="preview-bullet">
                            <span className="preview-dot" style={{ background: slide.accent }} aria-hidden="true" />
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="panel-card">
              <span className="inline-badge">
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#f97316,#f43f5e)",
                  }}
                />
                Ready to export
              </span>

              <div className="summary-list">
                <div className="summary-row">
                  <span>Topic</span>
                  <strong>{topic}</strong>
                </div>
                <div className="summary-row">
                  <span>Total slides</span>
                  <strong>{slides.length}</strong>
                </div>
                <div className="summary-row">
                  <span>Free generations used</span>
                  <strong>{freeUsed ?? 0} / 3</strong>
                </div>
                <div className="summary-row">
                  <span>Paid generations</span>
                  <strong>{paidUsed ?? 0}</strong>
                </div>
                <div className="summary-row">
                  <span>File</span>
                  <strong>{filename}</strong>
                </div>
              </div>

              <button
                className="primary-button"
                type="button"
                style={{ marginTop: 24 }}
                onClick={() => downloadBlob(blob, filename)}
              >
                Download PPT
              </button>

              <button
                className="secondary-button"
                type="button"
                style={{ marginTop: 12 }}
                onClick={() => navigate("/")}
              >
                Generate another
              </button>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
