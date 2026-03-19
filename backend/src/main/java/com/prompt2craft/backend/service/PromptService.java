package com.prompt2craft.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prompt2craft.backend.ai.GroqClient;
import com.prompt2craft.backend.document.PptGenerator;
import com.prompt2craft.backend.dto.Slide;
import com.prompt2craft.backend.dto.SlideResponse;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PromptService {

    private static final int MAX_PHOTO_SLIDES = 3;

    private final GroqClient groqClient;
    private final PptGenerator pptGenerator;
    private final ObjectMapper mapper = new ObjectMapper();

    public PromptService(GroqClient groqClient, PptGenerator pptGenerator) {
        this.groqClient = groqClient;
        this.pptGenerator = pptGenerator;
    }

    public SlideResponse previewContent(String topic, int slideCount) {

        try {
            String normalizedTopic = topic == null || topic.isBlank()
                    ? "Prompt2Craft Presentation"
                    : topic.trim();

            int normalizedSlideCount = Math.max(1, slideCount);
            String prompt = buildPrompt(normalizedTopic, normalizedSlideCount);

            String aiContent = groqClient.generate(prompt);

            System.out.println("===== AI JSON RESPONSE =====");
            System.out.println(aiContent);

            SlideResponse response = mapper.readValue(aiContent, SlideResponse.class);

            if (response == null || response.getSlides() == null || response.getSlides().isEmpty()) {
                throw new RuntimeException("AI returned an empty slide deck.");
            }

            return polishResponse(response, normalizedTopic, normalizedSlideCount);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Unable to build presentation preview.", e);
        }
    }

    public String generateContent(String topic, int slideCount) {

        try {
            SlideResponse response = previewContent(topic, slideCount);
            return generateFromSlides(response, topic);
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }

    public String generateFromSlides(SlideResponse response) {
        return generateFromSlides(response, extractTopicFromSlides(response));
    }

    public String generateFromSlides(SlideResponse response, String topic) {

        try {
            String fileName = buildFileName(topic);
            return pptGenerator.generate(response, fileName);
        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }

    private String buildPrompt(String topic, int slideCount) {
        return """
                You are a professional presentation designer.
                Create a visually balanced, premium PowerPoint presentation about the topic "%s".
                The presentation must feel theory-rich, educational, and structured like a polished premium SaaS presentation product.
                Generate exactly %d slides.

                Return ONLY valid JSON with no explanations, markdown, or code fences.

                The JSON must follow this structure:
                {
                  "slides": [
                    {
                      "layout": "title|content|image|timeline|stats|two-column",
                      "title": "Slide title",
                      "subtitle": "Optional subtitle",
                      "points": ["Bullet 1", "Bullet 2", "Bullet 3"],
                      "imagePrompt": "Specific real-photo search phrase",
                      "timelinePoints": ["Point 1", "Point 2", "Point 3"],
                      "stats": ["Stat 1", "Stat 2", "Stat 3", "Stat 4"],
                      "left": ["Left column point 1", "Left column point 2"],
                      "right": ["Right column point 1", "Right column point 2"]
                    }
                  ]
                }

                Slide rules:
                1. The first slide must use the "title" layout.
                2. The title slide should include a strong subtitle and, when visually appropriate, an imagePrompt for a hero image.
                3. The remaining slides should use a thoughtful mix of content, image, timeline, stats, and two-column layouts.
                4. Use short, clear slide titles and one-line subtitles when they improve hierarchy.
                5. Keep bullets concise, concrete, theory-aware, and presentation-ready.
                6. Image slides must include imagePrompt and 2 to 3 supporting bullet points.
                7. Timeline slides must include timelinePoints with 3 to 5 entries.
                8. Stats slides must include stats with 3 to 4 concise data callouts.
                9. Two-column slides must include left and right arrays.
                10. Content slides should use points with 4 to 5 bullets.
                11. For famous people, companies, countries, or places, imagePrompt must name the real subject explicitly.
                12. Image prompts must describe real photography, not illustrations, icons, infographics, collages, logos, or text-heavy posters.
                13. Use at most 3 photo-driven slides in the entire deck, including the title slide if it has a hero image.
                14. Avoid filler phrases like "Conclusion" unless it is genuinely useful.
                15. Put the strongest takeaway first in the points array because the renderer highlights the first point.
                16. For stats slides, format each stat as "Value: Meaning" when possible, for example "264: Highest ODI score".
                17. Prefer crisp numbers, milestones, comparisons, and named achievements over vague language.
                18. Make the deck feel clean, modern, informative, editorial, and polished like a premium presentation product.
                19. Build a clear story arc with a strong opener, useful context, proof, momentum, and next steps when the topic allows.
                20. Keep each slide focused on one dominant message instead of repeating the same point across the deck.
                21. Favor scannable, modular content blocks that feel like premium AI presentation software, not dense classroom notes.
                22. Use image slides for visual pacing, stats slides for proof, timeline slides for momentum, and two-column slides for comparison or tradeoffs.
                23. Subtitles should add meaning and framing, not simply repeat the title.
                24. Avoid generic bullets; prefer named examples, specific outcomes, concrete claims, and audience-ready phrasing.
                25. Make the middle of the deck theory-heavy: define the concept, explain how it works, show why it matters, and include one concrete application or example.
                26. For educational or conceptual topics, dedicate at least 2 slides to fundamentals, frameworks, mechanisms, or first-principles explanations.
                27. For business topics, include operating logic, market reasoning, and execution implications instead of only high-level marketing bullets.
                28. For two-column slides, use one column for theory, drivers, or principles and the other for application, examples, or tradeoffs whenever relevant.
                29. For content slides, sequence points as: core idea, definition or principle, mechanism or reasoning, evidence or example, implication or takeaway.
                30. Keep the deck strong on substance while remaining concise enough for a real presentation.
                """.formatted(topic, slideCount);
    }

    private String buildFileName(String topic) {
        String safeTopic = topic == null || topic.isBlank()
                ? "prompt2craft_presentation"
                : topic.replaceAll("[^a-zA-Z0-9]", "_").toLowerCase();

        return safeTopic + ".pptx";
    }

    private String extractTopicFromSlides(SlideResponse response) {
        if (response == null || response.getSlides() == null || response.getSlides().isEmpty()) {
            return "prompt2craft_presentation";
        }

        String title = response.getSlides().get(0).getTitle();
        return title == null || title.isBlank() ? "prompt2craft_presentation" : title;
    }

    private SlideResponse polishResponse(SlideResponse response, String topic, int requestedSlideCount) {
        List<Slide> originalSlides = response == null || response.getSlides() == null
                ? Collections.emptyList()
                : response.getSlides();

        List<Slide> polishedSlides = new ArrayList<>();
        int limit = Math.min(originalSlides.size(), Math.max(1, requestedSlideCount));

        int photoSlidesUsed = 0;

        for (int index = 0; index < limit; index++) {
            Slide polishedSlide = polishSlide(originalSlides.get(index), index, topic);

            if (usesPhoto(polishedSlide)) {
                if (photoSlidesUsed >= MAX_PHOTO_SLIDES) {
                    polishedSlide = downgradePhotoSlide(polishedSlide, topic, index);
                } else {
                    photoSlidesUsed++;
                }
            }

            polishedSlides.add(polishedSlide);
        }

        if (polishedSlides.isEmpty()) {
            throw new RuntimeException("Unable to build presentation preview.");
        }

        response.setSlides(polishedSlides);
        return response;
    }

    private Slide polishSlide(Slide slide, int index, String topic) {
        Slide polished = new Slide();
        String layout = index == 0 ? "title" : normalizeLayout(slide == null ? null : slide.getLayout());

        polished.setLayout(layout);
        polished.setTitle(cleanText(slide == null ? null : slide.getTitle(), defaultTitle(layout, topic, index)));
        polished.setSubtitle(cleanText(slide == null ? null : slide.getSubtitle(), defaultSubtitle(layout, topic)));
        polished.setImagePrompt(cleanText(slide == null ? null : slide.getImagePrompt(), ""));
        polished.setPoints(limitList(cleanList(slide == null ? null : slide.getPoints()), "image".equals(layout) ? 3 : 5));
        polished.setTimelinePoints(limitList(cleanList(slide == null ? null : slide.getTimelinePoints()), 5));
        polished.setStats(limitList(cleanList(slide == null ? null : slide.getStats()), 4));
        polished.setLeft(cleanList(slide == null ? null : slide.getLeft()));
        polished.setRight(cleanList(slide == null ? null : slide.getRight()));

        if ("title".equals(layout)) {
            polished.setSubtitle(cleanText(polished.getSubtitle(), "A premium, presentation-ready overview of " + topic));
            polished.setPoints(Collections.emptyList());
            if (polished.getImagePrompt().isBlank()) {
                polished.setImagePrompt(polished.getTitle());
            }
        }

        if ("content".equals(layout) && polished.getPoints().isEmpty()) {
            polished.setPoints(defaultPoints(polished.getTitle(), 3));
        }

        if ("image".equals(layout)) {
            if (polished.getPoints().isEmpty()) {
                polished.setPoints(defaultImagePoints(polished.getTitle()));
            }
            if (polished.getImagePrompt().isBlank()) {
                polished.setImagePrompt(polished.getTitle());
            }
        }

        if ("timeline".equals(layout) && polished.getTimelinePoints().isEmpty()) {
            List<String> fallbackTimeline = polished.getPoints().isEmpty()
                    ? defaultTimelinePoints(polished.getTitle())
                    : polished.getPoints();
            polished.setTimelinePoints(limitList(fallbackTimeline, 5));
        }

        if ("stats".equals(layout) && polished.getStats().isEmpty()) {
            List<String> fallbackStats = polished.getPoints().isEmpty()
                    ? defaultStats(polished.getTitle())
                    : polished.getPoints();
            polished.setStats(limitList(fallbackStats, 4));
        }

        if ("two-column".equals(layout)) {
            if (polished.getLeft().isEmpty() && polished.getRight().isEmpty()) {
                List<String> points = polished.getPoints().isEmpty()
                        ? defaultPoints(polished.getTitle(), 4)
                        : polished.getPoints();
                int midpoint = Math.max((points.size() + 1) / 2, 1);
                polished.setLeft(new ArrayList<>(points.subList(0, Math.min(midpoint, points.size()))));
                polished.setRight(new ArrayList<>(points.subList(Math.min(midpoint, points.size()), points.size())));
            }

            if (polished.getLeft().isEmpty()) {
                polished.setLeft(defaultColumnPoints("Left"));
            }
            if (polished.getRight().isEmpty()) {
                polished.setRight(defaultColumnPoints("Right"));
            }
        }

        enrichSlideForTheory(polished, topic);

        return polished;
    }

    private String normalizeLayout(String layout) {
        if (layout == null || layout.isBlank()) {
            return "content";
        }

        String normalized = layout.trim();
        return switch (normalized) {
            case "title", "content", "image", "timeline", "stats", "two-column" -> normalized;
            default -> "content";
        };
    }

    private List<String> cleanList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> cleaned = new ArrayList<>();

        for (String value : values) {
            String sanitized = cleanText(value, "");
            if (!sanitized.isBlank()) {
                cleaned.add(sanitized);
            }
        }

        return cleaned;
    }

    private List<String> limitList(List<String> values, int limit) {
        if (values == null || values.isEmpty()) {
            return Collections.emptyList();
        }

        int safeLimit = Math.max(1, limit);
        return new ArrayList<>(values.subList(0, Math.min(values.size(), safeLimit)));
    }

    private String cleanText(String value, String fallback) {
        if (value == null) {
            return fallback;
        }

        String cleaned = value.trim().replaceAll("\\s+", " ");
        return cleaned.isBlank() ? fallback : cleaned;
    }

    private String defaultTitle(String layout, String topic, int index) {
        if ("title".equals(layout)) {
            return topic;
        }
        if ("timeline".equals(layout)) {
            return "Roadmap";
        }
        if ("stats".equals(layout)) {
            return "Key Numbers";
        }
        if ("image".equals(layout)) {
            return "Visual Snapshot";
        }
        if ("two-column".equals(layout)) {
            return "Comparison";
        }
        return "Insight " + (index + 1);
    }

    private String defaultSubtitle(String layout, String topic) {
        if ("title".equals(layout)) {
            return "A premium, presentation-ready overview of " + topic;
        }
        if ("stats".equals(layout)) {
            return "Proof points that strengthen the story.";
        }
        if ("timeline".equals(layout)) {
            return "The momentum and sequence behind the topic.";
        }
        return "";
    }

    private List<String> defaultPoints(String title, int count) {
        List<String> points = new ArrayList<>();
        points.add(title + " should land as a clear, high-value takeaway.");
        points.add("Define the idea in simple, audience-ready language.");
        points.add("Explain the mechanism, driver, or reasoning behind it.");
        points.add("Anchor the concept with one specific example or proof point.");
        points.add("Close with the implication or recommended action.");
        return points;
    }

    private List<String> defaultImagePoints(String title) {
        List<String> points = new ArrayList<>();
        points.add(title + " should be introduced with a strong visual anchor.");
        points.add("Use the image to reinforce context, credibility, or real-world relevance.");
        points.add("Pair the visual with one takeaway the audience should retain.");
        return points;
    }

    private List<String> defaultTimelinePoints(String title) {
        List<String> points = new ArrayList<>();
        points.add("Set the starting point for " + title + ".");
        points.add("Show the core shift or milestone.");
        points.add("Close with the next stage or outcome.");
        return points;
    }

    private List<String> defaultStats(String title) {
        List<String> stats = new ArrayList<>();
        stats.add("3: Key proof points for " + title);
        stats.add("1: Clear message the audience should retain");
        stats.add("24/7: Always-on clarity for stakeholders");
        return stats;
    }

    private List<String> defaultColumnPoints(String side) {
        List<String> values = new ArrayList<>();
        if ("Left".equals(side)) {
            values.add("Core principle or framework");
            values.add("Key driver behind the idea");
        } else {
            values.add("Application, example, or tradeoff");
            values.add("Practical implication for the audience");
        }
        return values;
    }

    private boolean usesPhoto(Slide slide) {
        if (slide == null) {
            return false;
        }

        return ("title".equals(slide.getLayout()) || "image".equals(slide.getLayout()))
                && slide.getImagePrompt() != null
                && !slide.getImagePrompt().isBlank();
    }

    private Slide downgradePhotoSlide(Slide slide, String topic, int index) {
        slide.setLayout("content");
        slide.setImagePrompt("");
        if (slide.getPoints() == null || slide.getPoints().isEmpty()) {
            slide.setPoints(defaultPoints(slide.getTitle(), 5));
        }
        enrichSlideForTheory(slide, topic);
        slide.setSubtitle(cleanText(slide.getSubtitle(), "Structured explanation and takeaway."));
        if (slide.getTitle() == null || slide.getTitle().isBlank()) {
            slide.setTitle(defaultTitle("content", topic, index));
        }
        return slide;
    }

    private void enrichSlideForTheory(Slide slide, String topic) {
        if (slide == null) {
            return;
        }

        if ("content".equals(slide.getLayout())) {
            slide.setPoints(fillTheoryPoints(slide.getPoints(), slide.getTitle(), topic, 5));
        }

        if ("image".equals(slide.getLayout())) {
            slide.setPoints(limitList(fillTheoryPoints(slide.getPoints(), slide.getTitle(), topic, 3), 3));
        }

        if ("two-column".equals(slide.getLayout())) {
            slide.setLeft(fillColumn(slide.getLeft(), true, slide.getTitle(), topic));
            slide.setRight(fillColumn(slide.getRight(), false, slide.getTitle(), topic));
        }

        if ("stats".equals(slide.getLayout()) && (slide.getSubtitle() == null || slide.getSubtitle().isBlank())) {
            slide.setSubtitle("Numbers that give the narrative weight and context.");
        }

        if ("timeline".equals(slide.getLayout()) && (slide.getSubtitle() == null || slide.getSubtitle().isBlank())) {
            slide.setSubtitle("How the story unfolds across stages, shifts, or milestones.");
        }
    }

    private List<String> fillTheoryPoints(List<String> current, String title, String topic, int limit) {
        List<String> next = new ArrayList<>(cleanList(current));

        List<String> scaffolding = theoryScaffolding(title, topic);
        int scaffoldIndex = 0;

        while (next.size() < limit && scaffoldIndex < scaffolding.size()) {
            String candidate = scaffolding.get(scaffoldIndex++);
            if (!next.contains(candidate)) {
                next.add(candidate);
            }
        }

        return limitList(next, limit);
    }

    private List<String> fillColumn(List<String> current, boolean theoryColumn, String title, String topic) {
        List<String> next = new ArrayList<>(cleanList(current));
        List<String> fallback = theoryColumn
                ? List.of(
                        "Define the core concept behind " + title + ".",
                        "Explain the driver, mechanism, or first principle.",
                        "Show what the audience should understand before moving on."
                )
                : List.of(
                        "Connect " + title + " to a real example or scenario.",
                        "Highlight the practical implication for teams or users.",
                        "Surface the decision, tradeoff, or outcome that follows."
                );

        for (String item : fallback) {
            if (next.size() >= 3) {
                break;
            }
            if (!next.contains(item)) {
                next.add(item);
            }
        }

        return limitList(next, 3);
    }

    private List<String> theoryScaffolding(String title, String topic) {
        String subject = cleanText(title, cleanText(topic, "the topic"));

        return List.of(
                subject + " should land as the main idea the audience remembers.",
                "Define " + subject.toLowerCase() + " in simple, concrete terms.",
                "Explain the mechanism, driver, or logic that makes it work.",
                "Use one specific example, signal, or proof point to make it tangible.",
                "Close with the implication, decision, or takeaway for the audience."
        );
    }
}
