package com.prompt2craft.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prompt2craft.backend.ai.GroqClient;
import com.prompt2craft.backend.document.PptGenerator;
import com.prompt2craft.backend.dto.SlideResponse;
import org.springframework.stereotype.Service;

@Service
public class PromptService {

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

            return response;

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
                5. Keep bullets concise, concrete, and presentation-ready.
                6. Image slides must include imagePrompt and 2 to 4 supporting bullet points.
                7. Timeline slides must include timelinePoints with 3 to 5 entries.
                8. Stats slides must include stats with 3 to 4 concise data callouts.
                9. Two-column slides must include left and right arrays.
                10. Content slides should use points with 3 to 5 bullets.
                11. For famous people, companies, countries, or places, imagePrompt must name the real subject explicitly.
                12. Image prompts must describe real photography, not illustrations, icons, infographics, collages, logos, or text-heavy posters.
                13. When the topic is a biography or public figure, include at least 2 image-driven slides and 1 stats slide.
                14. Avoid filler phrases like "Conclusion" unless it is genuinely useful.
                15. Put the strongest takeaway first in the points array because the renderer highlights the first point.
                16. For stats slides, format each stat as "Value: Meaning" when possible, for example "264: Highest ODI score".
                17. Prefer crisp numbers, milestones, comparisons, and named achievements over vague language.
                18. Make the deck feel clean, modern, informative, editorial, and polished like a premium presentation product.
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
}
