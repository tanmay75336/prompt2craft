export const FREE_GENERATION_LIMIT = 3;
export const EDITOR_LAYOUTS = ["title", "content", "image", "timeline", "stats", "two-column"];

const PREVIEW_ACCENTS = [
  "#f97316",
  "#f43f5e",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
];

export function clampSlideCount(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 3;
  }

  return Math.min(20, Math.max(3, Math.round(parsed)));
}

export function createPresentationFilename(topic) {
  const safeTopic = topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeTopic || "prompt2craft-presentation"}.pptx`;
}

export function createEmptySlide(layout = "content", index = 0) {
  const normalizedLayout = EDITOR_LAYOUTS.includes(layout) ? layout : "content";
  const position = index + 1;

  return {
    id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${position}`,
    layout: normalizedLayout,
    title: normalizedLayout === "title" ? "Presentation Title" : `New Slide ${position}`,
    subtitle: normalizedLayout === "title" ? "Add a subtitle" : "",
    points: normalizedLayout === "title" ? [] : ["Add your first point", "Add your second point", "Add your third point"],
    imagePrompt: "",
    timelinePoints: ["Phase 1", "Phase 2", "Phase 3"],
    stats: ["Key stat", "Another metric", "Insight", "Result"],
    left: ["Left column point 1", "Left column point 2"],
    right: ["Right column point 1", "Right column point 2"],
  };
}

function toArray(value, fallback = []) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : fallback;
}

export function normalizeSlide(slide = {}, index = 0) {
  const fallback = createEmptySlide(index === 0 ? "title" : "content", index);
  const layout = EDITOR_LAYOUTS.includes(slide.layout) ? slide.layout : fallback.layout;

  return {
    id: slide.id ?? fallback.id,
    layout,
    title: typeof slide.title === "string" && slide.title.trim() ? slide.title : fallback.title,
    subtitle: typeof slide.subtitle === "string" ? slide.subtitle : fallback.subtitle,
    points: toArray(slide.points, fallback.points),
    imagePrompt: typeof slide.imagePrompt === "string" ? slide.imagePrompt : fallback.imagePrompt,
    timelinePoints: toArray(slide.timelinePoints, fallback.timelinePoints),
    stats: toArray(slide.stats, fallback.stats),
    left: toArray(slide.left, fallback.left),
    right: toArray(slide.right, fallback.right),
  };
}

export function normalizeSlides(slides = []) {
  return slides.map((slide, index) => normalizeSlide(slide, index));
}

export function serializeSlides(slides = []) {
  return slides.map(({ id, ...slide }) => slide);
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  window.URL.revokeObjectURL(url);
}

function sentenceCase(text) {
  const cleaned = text.trim();
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : "Presentation";
}

function toTitleWords(topic) {
  return topic
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildPreviewSlides(topic, slideCount) {
  const totalSlides = clampSlideCount(slideCount);
  const titleTopic = sentenceCase(topic);
  const shortTopic = toTitleWords(titleTopic);

  const starterSlides = [
    {
      title: `${shortTopic} Overview`,
      bullets: [
        `Set the context for ${titleTopic}.`,
        "Define the audience, objective, and desired outcome.",
        "Frame the story the presentation will tell.",
      ],
    },
    {
      title: "Why This Matters",
      bullets: [
        `Explain why ${titleTopic.toLowerCase()} matters right now.`,
        "Highlight urgency, scale, and opportunity.",
        "Anchor the conversation around measurable value.",
      ],
    },
    {
      title: "Current Challenges",
      bullets: [
        "Summarize the primary friction points or risks.",
        `Show what blocks progress on ${titleTopic.toLowerCase()}.`,
        "Connect the problem to business or audience impact.",
      ],
    },
    {
      title: "Core Insight",
      bullets: [
        "Present the key idea that unlocks momentum.",
        "Support the point with evidence, patterns, or examples.",
        "Translate findings into a clear narrative step.",
      ],
    },
    {
      title: "Recommended Approach",
      bullets: [
        "Outline the proposed strategy or solution.",
        "Break the approach into a few concrete actions.",
        "Show how the recommendation addresses the challenge.",
      ],
    },
    {
      title: "Execution Plan",
      bullets: [
        "Map the work into practical phases.",
        "Clarify ownership, timeline, and delivery checkpoints.",
        "Keep the plan realistic and easy to follow.",
      ],
    },
    {
      title: "Expected Outcomes",
      bullets: [
        "Describe the results this approach should produce.",
        "Call out success metrics and business impact.",
        "Keep the benefits tied to the original objective.",
      ],
    },
    {
      title: "Risks and Mitigations",
      bullets: [
        "Identify likely objections or delivery risks.",
        "Pair each risk with a mitigation path.",
        "Reinforce confidence in the plan.",
      ],
    },
    {
      title: "Resource Needs",
      bullets: [
        "Estimate the people, budget, or tools required.",
        "Show which inputs are essential versus optional.",
        "Prepare stakeholders for decision-making.",
      ],
    },
    {
      title: "Call to Action",
      bullets: [
        "Close with the next decision or action needed.",
        "Restate the upside of moving forward now.",
        "Leave the audience with a crisp final message.",
      ],
    },
  ];

  const slides = Array.from({ length: totalSlides }, (_, index) => {
    const seed =
      starterSlides[index] ?? {
        title: `Supporting Detail ${index + 1}`,
        bullets: [
          `Add another layer of detail for ${titleTopic.toLowerCase()}.`,
          "Use this section for examples, evidence, or validation.",
          "Keep the structure concise and presentation-ready.",
        ],
      };

    return {
      id: index + 1,
      accent: PREVIEW_ACCENTS[index % PREVIEW_ACCENTS.length],
      title: seed.title,
      bullets: seed.bullets,
    };
  });

  return slides;
}
