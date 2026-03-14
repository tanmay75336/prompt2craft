package com.prompt2craft.backend.service;

import com.prompt2craft.backend.ai.GroqClient;
import com.prompt2craft.backend.document.PptGenerator;
import com.prompt2craft.backend.dto.SlideResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;

@Service
public class PromptService {

    private final GroqClient groqClient;
    private final PptGenerator pptGenerator;

    public PromptService(GroqClient groqClient, PptGenerator pptGenerator) {
        this.groqClient = groqClient;
        this.pptGenerator = pptGenerator;
    }

    public String generateContent(String topic, int slideCount) {

        try {

            // Minimum slides rule
            if (slideCount < 10) {
                slideCount = 10;
            }

            // -------- PROFESSIONAL AI PROMPT ENGINE --------
            String prompt =
                    "You are a professional presentation designer. "

                            + "Create a visually balanced PowerPoint presentation about the topic: '"
                            + topic + "'. "

                            + "Generate exactly " + slideCount + " slides. "

                            + "Return ONLY valid JSON with no explanations. "

                            + "JSON structure must follow this format exactly: "

                            + "{ \"slides\": [ "
                            + "{ \"layout\":\"title\", \"title\":\"Presentation Title\", \"subtitle\":\"Short subtitle\" }, "
                            + "{ \"layout\":\"content\", \"title\":\"Slide title\", \"points\":[\"point1\",\"point2\",\"point3\"] }, "
                            + "{ \"layout\":\"image\", \"title\":\"Slide title\", \"points\":[\"point1\",\"point2\",\"point3\"], \"imagePrompt\":\"clear search phrase for a relevant presentation image\" } "
                            + "] } "

                            + "Slide design rules: "

                            + "1. First slide MUST be layout 'title'. "
                            + "2. Other slides should mix 'content' and 'image' layouts. "
                            + "3. Each slide title must be short and clear. "
                            + "4. Each slide must contain maximum 3 bullet points. "
                            + "5. Bullet points must be concise (under 12 words). "
                            + "6. Image slides must contain a highly relevant 'imagePrompt'. "
                            + "7. Avoid generic phrases like 'In conclusion' or 'Overview'. "
                            + "8. Slides should feel educational, professional, and informative. ";

            // 1️⃣ Call Groq AI
            String aiContent = groqClient.generate(prompt);

            System.out.println("===== AI JSON RESPONSE =====");
            System.out.println(aiContent);

            // 2️⃣ Convert JSON → Java Object
            ObjectMapper mapper = new ObjectMapper();
            SlideResponse response = mapper.readValue(aiContent, SlideResponse.class);

            // 3️⃣ Create safe filename
            String fileName = topic
                    .replaceAll("[^a-zA-Z0-9]", "_")
                    .toLowerCase() + ".pptx";

            // 4️⃣ Generate PPT
            return pptGenerator.generate(response, fileName);

        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }
}