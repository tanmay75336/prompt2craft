package com.prompt2craft.backend.ai;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

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

        String systemPrompt = """
                You are an AI presentation generator.
                Always return valid JSON only.
                Do not include markdown, code fences, commentary, or extra text.
                Match the exact schema requested by the user prompt.
                Omit fields that are not needed for a given slide layout.
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
        int jsonStart = content.indexOf("{");
        int jsonEnd = content.lastIndexOf("}");

        if (jsonStart != -1 && jsonEnd >= jsonStart) {
            content = content.substring(jsonStart, jsonEnd + 1);
        }

        return content;
    }
}
