package com.prompt2craft.backend.service;

import org.springframework.stereotype.Service;
import com.prompt2craft.backend.ai.GroqClient;

@Service
public class PromptService {

    private final GroqClient groqClient;

    public PromptService(GroqClient groqClient) {
        this.groqClient = groqClient;
    }

    public String generateContent(String prompt){

        String enhancedPrompt =
        "Create a structured presentation with slide titles and bullet points about: "
        + prompt;

        return groqClient.generate(enhancedPrompt);
    }
}