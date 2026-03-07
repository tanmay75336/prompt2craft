package com.prompt2craft.backend.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.reactive.function.client.WebClient;

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
            throw new RuntimeException(
                    "Missing or placeholder Groq API key. Set GROQ_API_KEY or update application-local.properties.");
        }

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.7);

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
            String errorBody = e.getResponseBodyAsString();
            throw new RuntimeException("Groq API error " + e.getStatusCode().value() + ": " + errorBody, e);
        }

        if (response == null) {
            throw new RuntimeException("Groq API returned an empty response body.");
        }

        Object choicesObj = response.get("choices");
        if (!(choicesObj instanceof List<?> choices)) {
            throw new RuntimeException("Groq API response did not include choices.");
        }

        if (choices.isEmpty()) {
            throw new RuntimeException("Groq API response did not include choices.");
        }

        Object choiceObj = choices.get(0);
        if (!(choiceObj instanceof Map<?, ?> choice)) {
            throw new RuntimeException("Groq API response choice format was invalid.");
        }

        Object messageObj = choice.get("message");
        if (!(messageObj instanceof Map<?, ?> messageResp)) {
            throw new RuntimeException("Groq API response did not include message.");
        }

        if (messageResp.get("content") == null) {
            throw new RuntimeException("Groq API response did not include message content.");
        }

        return messageResp.get("content").toString();
    }
}
