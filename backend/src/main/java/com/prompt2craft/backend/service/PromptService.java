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

            // Free tier rule
            if (slideCount < 10) {
                slideCount = 10;
            }

            // -------- AI PROMPT WITH LAYOUT ENGINE --------
            String prompt =
                    "Create a PowerPoint presentation about '" + topic + "' with exactly "
                            + slideCount + " slides. "

                            + "Return ONLY valid JSON in this format: "

                            + "{ \"slides\": [ "
                            + "{ \"layout\":\"title\", \"title\":\"Presentation Title\" }, "
                            + "{ \"layout\":\"content\", \"title\":\"Topic\", \"points\":[\"point1\",\"point2\",\"point3\"] }, "
                            + "{ \"layout\":\"image\", \"title\":\"Topic\", \"points\":[\"point1\",\"point2\",\"point3\"], \"imagePrompt\":\"image description\" } "
                            + "] } "

                            + "Rules: "
                            + "First slide must always be layout 'title'. "
                            + "Other slides can be 'content' or 'image'. "
                            + "Each slide must have a short title and max 3 bullet points.";

            // 1️⃣ Call Groq
            String aiContent = groqClient.generate(prompt);

            System.out.println("===== AI JSON RESPONSE =====");
            System.out.println(aiContent);

            // 2️⃣ Convert JSON → Java Object
            ObjectMapper mapper = new ObjectMapper();
            SlideResponse response = mapper.readValue(aiContent, SlideResponse.class);

            // 3️⃣ Clean filename from topic
            String fileName = topic.replaceAll("[^a-zA-Z0-9]", "_")
                    .toLowerCase() + ".pptx";

            // 4️⃣ Generate PPT
            return pptGenerator.generate(response, fileName);

        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }
}