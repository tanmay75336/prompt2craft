export function ThemeStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
      body { font-family: var(--font-body); background: var(--bg); color: var(--fg); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
      img, svg { display: block; max-width: 100%; }
      a { color: inherit; }
      button { font-family: inherit; }
      ul, ol { list-style: none; }

      :root {
        --font-display: 'Cabinet Grotesk', system-ui, sans-serif;
        --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
        --bg: #fffcf8;
        --fg: #0f0f0f;
        --muted: #6b7280;
        --card: #ffffff;
        --border: #e9e9e9;
        --chip-bg: #f3f4f6;
        --input-bg: #f9f9f9;
        --section-alt: #f9f7f4;
        --nav-link-hover: #0f0f0f;
        --accent: #f97316;
        --accent2: #f43f5e;
      }

      [data-theme="dark"] {
        --bg: #0c0c0e;
        --fg: #f5f5f5;
        --muted: rgba(255,255,255,0.48);
        --card: rgba(255,255,255,0.04);
        --border: rgba(255,255,255,0.08);
        --chip-bg: rgba(255,255,255,0.08);
        --input-bg: rgba(255,255,255,0.06);
        --section-alt: rgba(255,255,255,0.02);
        --nav-link-hover: #fff;
      }

      @media (prefers-reduced-motion: no-preference) {
        @keyframes breathe { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .3; transform: scale(.6); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeMenu { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes techFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
      }

      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }
      .card-enter { animation: fadeIn 0.5s ease both; }
      :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }

      .nav-inner { max-width: 1180px; margin: 0 auto; padding: 0 28px; min-height: 62px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .logo-link { display: flex; align-items: center; gap: 8px; text-decoration: none; }
      .logo-icon { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg,#f97316,#f43f5e); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(249,115,22,.35); flex-shrink: 0; }
      .logo-link:hover .logo-icon { animation: techFloat 1.2s ease-in-out; }
      .logo-text { font-family: var(--font-display); font-weight: 800; font-size: 17px; color: var(--fg); letter-spacing: -0.04em; }
      .nav-links { display: flex; gap: 28px; align-items: center; padding: 0; margin: 0; list-style: none; }
      .nav-link { position: relative; font-family: var(--font-body); font-size: 14px; font-weight: 500; text-decoration: none; transition: color .15s; padding: 4px 0; }
      .nav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 2px; border-radius: 999px; background: linear-gradient(90deg,#f97316,#f43f5e); transform: scaleX(0); transform-origin: left; transition: transform .2s ease; }
      .nav-link:hover::after { transform: scaleX(1); }
      .nav-link:hover { color: var(--nav-link-hover) !important; }
      .nav-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
      .signin-link { font-family: var(--font-body); font-size: 13px; font-weight: 500; text-decoration: none; padding: 7px 14px; transition: color .15s; }
      .signin-link:hover { color: var(--fg) !important; }
      .theme-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
      .theme-btn:hover { background: var(--chip-bg); }
      .cta-btn-nav { font-family: var(--font-body); font-size: 13.5px; font-weight: 600; color: #fff; background: #0f0f0f; border: none; border-radius: 9px; padding: 9px 20px; cursor: pointer; transition: all .18s; letter-spacing: -0.01em; white-space: nowrap; }
      .cta-btn-nav:hover { background: var(--accent); box-shadow: 0 6px 20px rgba(249,115,22,.35); transform: translateY(-1px); }
      [data-theme="dark"] .cta-btn-nav { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); }
      [data-theme="dark"] .cta-btn-nav:hover { background: var(--accent); border-color: var(--accent); }
      .hamburger { display: none; background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; }
      .mobile-menu { padding: 16px 28px 24px; animation: fadeMenu .18s ease both; backdrop-filter: blur(14px); }
      .mobile-link { display: block; font-family: var(--font-body); font-size: 16px; font-weight: 500; text-decoration: none; padding: 13px 0; border-bottom: 1px solid var(--border); transition: color .15s; }
      .mobile-cta { margin-top: 20px; width: 100%; font-family: var(--font-body); font-size: 15px; font-weight: 700; color: #fff; background: linear-gradient(135deg,#f97316,#f43f5e); border: none; border-radius: 12px; padding: 14px 24px; cursor: pointer; letter-spacing: -0.01em; }

      .section-label { display: inline-block; font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--accent); letter-spacing: .08em; text-transform: uppercase; margin-bottom: 12px; }
      .section-title { font-family: var(--font-display); font-weight: 800; letter-spacing: -0.04em; color: var(--fg); line-height: 1.1; }
      .chip { font-family: var(--font-body); font-size: 12.5px; font-weight: 500; color: var(--muted); background: var(--card); border: 1px solid var(--border); border-radius: 99px; padding: 6px 13px; cursor: pointer; transition: all .15s; }
      .chip:hover { border-color: var(--accent); color: var(--accent); background: var(--chip-bg); }
      .hover-lift { transform: translateZ(0); transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease; }
      .hover-lift:hover { transform: translateY(-5px); }
      .tech-card { position: relative; overflow: hidden; transition: border-color .22s ease, box-shadow .22s ease; }
      .tech-card::before { content: ""; position: absolute; inset: -1px; border-radius: inherit; background: linear-gradient(135deg, rgba(249,115,22,.12), rgba(244,63,94,.1)); opacity: 0; transition: opacity .22s ease; pointer-events: none; }
      .tech-card:hover { border-color: rgba(249,115,22,.3) !important; box-shadow: 0 18px 36px rgba(15,23,42,.12) !important; }
      .tech-card:hover::before { opacity: 1; }
      .export-menu { animation: fadeMenu .15s ease both; }
      .drag-card { cursor: grab; }
      .drag-card:active { cursor: grabbing; opacity: .6; }
      ::-webkit-scrollbar { width: 5px; }
      ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 99px; }

      .auth-shell { min-height: 100vh; background: var(--bg); position: relative; overflow: hidden; }
      .auth-shell::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(249,115,22,0.08) 0%, transparent 60%); pointer-events: none; }
      .auth-shell::after { content: ""; position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px); background-size: 80px 80px; opacity: 0.5; pointer-events: none; }
      .auth-wrap { position: relative; z-index: 1; max-width: 1180px; margin: 0 auto; padding: 28px; }
      .auth-nav-row { min-height: 62px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .auth-nav-button { width: auto; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 700; }
      .auth-card-wrap { min-height: calc(100vh - 56px); display: grid; place-items: center; padding: 80px 0 48px; }
      .auth-card { width: 100%; max-width: 460px; background: var(--card); border: 1.5px solid var(--border); border-radius: 24px; padding: 32px; box-shadow: 0 20px 60px rgba(15,15,15,0.08); backdrop-filter: blur(8px); }
      .auth-heading { font-family: var(--font-display); font-size: clamp(30px,5vw,44px); font-weight: 800; letter-spacing: -0.05em; color: var(--fg); line-height: 1; margin-bottom: 14px; }
      .auth-copy { font-family: var(--font-body); font-size: 14px; line-height: 1.7; color: var(--muted); margin-bottom: 26px; }
      .auth-form { display: flex; flex-direction: column; gap: 16px; }
      .field-label { display: flex; flex-direction: column; gap: 8px; font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--fg); }
      .field-input { width: 100%; border: 1.5px solid var(--border); background: var(--input-bg); color: var(--fg); border-radius: 14px; padding: 14px 16px; font-family: var(--font-body); font-size: 14px; outline: none; transition: border-color .15s, box-shadow .15s, background .15s; }
      .field-input:focus { border-color: rgba(249,115,22,.6); box-shadow: 0 0 0 4px rgba(249,115,22,.08); background: var(--card); }
      .primary-button { width: 100%; border: none; border-radius: 14px; padding: 14px 18px; font-family: var(--font-display); font-size: 15px; font-weight: 800; letter-spacing: -0.02em; color: #fff; background: linear-gradient(135deg,#f97316,#f43f5e); cursor: pointer; box-shadow: 0 10px 24px rgba(249,115,22,.28); transition: transform .18s, box-shadow .18s, opacity .18s; }
      .primary-button:hover { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(249,115,22,.34); }
      .primary-button:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: none; }
      .secondary-button { width: 100%; border: 1px solid var(--border); border-radius: 14px; padding: 14px 18px; font-family: var(--font-body); font-size: 14px; font-weight: 600; color: var(--fg); background: var(--card); cursor: pointer; transition: border-color .15s, background .15s; }
      .secondary-button:hover { border-color: rgba(249,115,22,.35); background: #fff7ed; }
      [data-theme="dark"] .secondary-button:hover { border-color: rgba(249,115,22,.45); background: rgba(249,115,22,.14); }
      .status-banner { margin-bottom: 18px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(249,115,22,.18); background: #fff7ed; font-family: var(--font-body); font-size: 13px; line-height: 1.6; color: #c2410c; }
      .error-banner { border-color: rgba(239,68,68,.18); background: #fef2f2; color: #b91c1c; }
      .helper-row { display: flex; justify-content: center; gap: 6px; font-family: var(--font-body); font-size: 13px; color: var(--muted); margin-top: 18px; }
      .helper-link { color: var(--accent); font-weight: 700; text-decoration: none; }

      .page-shell { min-height: 100vh; background: var(--bg); }
      .page-nav { position: sticky; top: 0; z-index: 300; backdrop-filter: blur(16px); background: rgba(255,253,250,0.92); border-bottom: 1px solid rgba(0,0,0,0.07); }
      .page-content { max-width: 1180px; margin: 0 auto; padding: 110px 28px 56px; }
      .page-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(320px, .8fr); gap: 22px; align-items: start; }
      .panel-card { background: var(--card); border: 1.5px solid var(--border); border-radius: 24px; padding: 26px; box-shadow: 0 10px 32px rgba(15,15,15,0.06); }
      .preview-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap: 14px; margin-top: 24px; }
      .preview-slide-card { border-radius: 18px; border: 1.5px solid var(--border); background: var(--card); overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,.05); }
      .preview-slide-top { height: 6px; }
      .preview-slide-body { padding: 18px 18px 20px; }
      .preview-slide-index { font-family: monospace; font-size: 11px; font-weight: 700; letter-spacing: .08em; color: var(--muted); margin-bottom: 14px; }
      .preview-slide-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; letter-spacing: -0.03em; color: var(--fg); line-height: 1.2; margin-bottom: 14px; }
      .preview-bullets { display: flex; flex-direction: column; gap: 10px; }
      .preview-bullet { display: flex; gap: 10px; font-family: var(--font-body); font-size: 13.5px; line-height: 1.6; color: var(--muted); }
      .preview-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 7px; }
      .summary-list { display: flex; flex-direction: column; gap: 14px; margin-top: 22px; }
      .summary-row { display: flex; justify-content: space-between; gap: 18px; padding-bottom: 12px; border-bottom: 1px solid var(--border); font-family: var(--font-body); font-size: 13px; color: var(--muted); }
      .summary-row strong { color: var(--fg); font-weight: 700; }
      .inline-badge { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 999px; background: #fff7ed; border: 1px solid rgba(249,115,22,.16); font-family: var(--font-body); font-size: 12px; font-weight: 700; color: #c2410c; }
      [data-theme="dark"] .inline-badge { background: rgba(249,115,22,.14); border-color: rgba(249,115,22,.34); color: #fdba74; }
      .panel-card-soft { background: linear-gradient(135deg,#fff7ed,#fff); }
      .panel-card-accent { background: linear-gradient(135deg,#fff7ed,#fff1f2); }
      [data-theme="dark"] .panel-card-soft {
        background: linear-gradient(135deg, rgba(249,115,22,.11), rgba(255,255,255,.03));
        border-color: rgba(249,115,22,.22);
      }
      [data-theme="dark"] .panel-card-accent {
        background: linear-gradient(135deg, rgba(249,115,22,.18), rgba(244,63,94,.17));
        border-color: rgba(249,115,22,.28);
        box-shadow: 0 14px 34px rgba(0,0,0,.22);
      }
      .hero-stats-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); column-gap: 24px; row-gap: 20px; margin-top: 64px; padding-top: 40px; border-top: 1px solid var(--border); }
      .hero-stat-card { min-height: 132px; display: flex; flex-direction: column; justify-content: center; background: var(--card); border: 1px solid var(--border); border-radius: 16px; text-align: center; padding: 22px 16px; box-shadow: 0 2px 10px rgba(15,23,42,.05); animation: fadeSlide .4s ease both; }
      .preview-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
      .slides-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; }
      .features-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }
      .how-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 14px; }
      .how-step-card { min-height: 300px; }
      .how-step-highlight { box-shadow: 0 18px 36px rgba(244,63,94,.24); }
      .saas-layout { grid-template-columns: minmax(0,0.9fr) minmax(0,1.1fr); }
      .saas-feature-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }

      @media (max-width: 1200px) {
        .hero-stats-grid { grid-template-columns: repeat(2,minmax(0,1fr)); column-gap: 24px; row-gap: 34px; max-width: 760px; margin-inline: auto; }
      }

      @media (max-width: 1280px) {
        .how-grid { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
        .how-step-card { min-height: 260px; }
      }

      @media (max-width: 1024px) {
        .nav-inner { padding: 0 20px; }
        .nav-links { gap: 20px; }
        .signin-link { display: none; }
        .hero-stats-grid { grid-template-columns: repeat(2,minmax(0,1fr)); row-gap: 28px; }
        .slides-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
        .how-step-card { min-height: 240px; }
        .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        .footer-grid { grid-template-columns: 1fr 1fr !important; }
        .page-grid { grid-template-columns: 1fr; }
        .saas-layout { grid-template-columns: 1fr !important; }
      }

      @media (max-width: 768px) {
        .nav-links { display: none; }
        .theme-btn { display: none; }
        .cta-btn-nav { display: none; }
        .hamburger { display: flex !important; }
        .hero-section { padding: 100px 20px 64px !important; }
        .hero-h1 { font-size: clamp(36px,10vw,52px) !important; }
        .input-bottom-row { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
        .slide-counter { justify-content: flex-start; }
        .gen-btn-wrap { width: 100%; }
        .gen-btn-wrap > button { width: 100%; justify-content: center; }
        .chip-row { justify-content: flex-start !important; overflow-x: auto; flex-wrap: nowrap !important; padding-bottom: 8px; scrollbar-width: none; -ms-overflow-style: none; }
        .chip-row::-webkit-scrollbar { display: none; }
        .preview-header { flex-direction: column !important; align-items: flex-start !important; }
        .hero-stats-grid { grid-template-columns: repeat(2,minmax(0,1fr)); column-gap: 12px; row-gap: 18px; margin-top: 48px; padding-top: 28px; }
        .preview-actions { width: 100%; justify-content: flex-start; }
        .preview-actions > * { flex: 1 1 220px; }
        .slides-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; gap: 10px !important; }
        .features-grid { grid-template-columns: 1fr !important; }
        .how-heading { margin-bottom: 44px !important; }
        .how-title { font-size: clamp(26px,7vw,40px) !important; }
        .how-grid { grid-template-columns: 1fr !important; }
        .how-step-card { min-height: auto; padding: 28px 22px !important; }
        .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        .stats-grid > * { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
        .cta-banner { padding: 40px 28px !important; }
        .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        .footer-bottom { flex-direction: column !important; gap: 8px !important; text-align: center; }
        .faq-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
        .faq-sticky { position: static !important; }
        .page-content { padding: 96px 20px 40px; }
        .auth-wrap { padding: 20px; }
        .auth-nav-button { padding: 8px 14px; font-size: 12.5px; }
        .auth-card { padding: 24px; border-radius: 20px; }
        .saas-feature-grid { grid-template-columns: 1fr !important; }
      }

      @media (max-width: 480px) {
        .nav-inner { padding: 0 16px; }
        .hero-stats-grid { grid-template-columns: 1fr; }
        .preview-actions > * { flex-basis: 100%; }
        .slides-grid { grid-template-columns: 1fr !important; }
        .hero-section { padding: 96px 16px 56px !important; }
        .section-pad { padding: 56px 16px !important; }
        .auth-card-wrap { padding-top: 64px; }
        .page-content { padding: 88px 16px 32px; }
      }
    `}</style>
  );
}
