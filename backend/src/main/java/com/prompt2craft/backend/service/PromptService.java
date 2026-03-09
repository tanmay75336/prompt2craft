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

    public String generateContent(String prompt) {

        try {

            // 1️⃣ Get AI response
            String aiContent = groqClient.generate(prompt);

            System.out.println("===== AI JSON RESPONSE =====");
            System.out.println(aiContent);

            // 2️⃣ Convert JSON → Java object
            ObjectMapper mapper = new ObjectMapper();
            SlideResponse response = mapper.readValue(aiContent, SlideResponse.class);

            // 3️⃣ Generate PPT from structured slides
            return pptGenerator.generate(response);

        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }
}