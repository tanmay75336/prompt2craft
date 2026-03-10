package com.prompt2craft.backend.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.*;

@Component
public class GroqClient {

    private final WebClient webClient;

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.model:llama-3.1-8b-instant}")
    private String model;

    public GroqClient(WebClient.Builder builder) {
        this.webClient = builder
                .baseUrl("https://api.groq.com/openai/v1")
                .build();
    }

    public String generate(String prompt) {

        String resolvedApiKey = apiKey == null ? "" : apiKey.trim();

        if (resolvedApiKey.isEmpty() || resolvedApiKey.contains("replace_with_your_groq_api_key")) {
            throw new RuntimeException("Missing Groq API key. Set GROQ_API_KEY in backend/.env or in your environment variables.");
        }

        /*
         IMPORTANT PROMPT
         Forces AI to produce concise bullet points that define concepts.
        */
        String systemPrompt = """
You are an AI presentation generator.

Return ONLY valid JSON in this format:

{
  "slides":[
    {
      "title":"Slide title",
      "points":[
        "bullet point",
        "bullet point",
        "bullet point"
      ]
    }
  ]
}

Rules:
- Generate 6 slides
- Each slide must have 3 bullet points
- Each bullet point MAX 18 words
- Write each bullet as a concise definition or explanation
- Prefer complete sentence fragments that answer "what is it?" or "why does it matter?"
- Do NOT include markdown
- Return ONLY JSON
""";

        List<Map<String, String>> messages = new ArrayList<>();

        Map<String, String> system = new HashMap<>();
        system.put("role", "system");
        system.put("content", systemPrompt);

        Map<String, String> user = new HashMap<>();
        user.put("role", "user");
        user.put("content", prompt);

        messages.add(system);
        messages.add(user);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.4);

        Map<String, Object> response;

        try {
            response = webClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + resolvedApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

        } catch (WebClientResponseException e) {
            throw new RuntimeException(
                    "Groq API error " + e.getStatusCode().value() + ": " + e.getResponseBodyAsString(), e);
        }

        if (response == null) {
            throw new RuntimeException("Groq API returned empty response.");
        }

        List<?> choices = (List<?>) response.get("choices");

        if (choices == null || choices.isEmpty()) {
            throw new RuntimeException("Groq API returned no choices.");
        }

        Map<?, ?> choice = (Map<?, ?>) choices.get(0);
        Map<?, ?> message = (Map<?, ?>) choice.get("message");

        if (message == null || message.get("content") == null) {
            throw new RuntimeException("Groq API response missing content.");
        }

        String content = message.get("content").toString();

        /*
         Some models sometimes add text before JSON.
         This safely extracts only the JSON part.
        */
        int jsonStart = content.indexOf("{");

        if (jsonStart != -1) {
            content = content.substring(jsonStart);
        }

        return content;
    }
}
