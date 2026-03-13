export const FREE_GENERATION_LIMIT = 3;

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
