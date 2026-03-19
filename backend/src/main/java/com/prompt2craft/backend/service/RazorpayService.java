package com.prompt2craft.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prompt2craft.backend.dto.PaymentOrderRequest;
import com.prompt2craft.backend.dto.PaymentOrderResponse;
import com.prompt2craft.backend.dto.PaymentVerificationRequest;
import com.prompt2craft.backend.dto.PaymentVerificationResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
public class RazorpayService {

    private static final int SINGLE_DECK_PRICE_PAISE = 1900;
    private static final String CURRENCY = "INR";
    private static final String BUSINESS_NAME = "Prompt2Craft";
    private static final String CHECKOUT_DESCRIPTION = "Single premium PPT generation";

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RazorpayService(WebClient.Builder builder) {
        this.webClient = builder
                .baseUrl("https://api.razorpay.com/v1")
                .build();
    }

    public PaymentOrderResponse createGenerationOrder(PaymentOrderRequest request) {
        ensureConfigured();

        String topic = clean(request == null ? null : request.getTopic(), "Prompt2Craft deck");
        int slides = Math.max(3, request == null ? 3 : request.getSlides());
        String customerEmail = clean(request == null ? null : request.getCustomerEmail(), "");
        String customerName = clean(request == null ? null : request.getCustomerName(), "Prompt2Craft user");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("amount", SINGLE_DECK_PRICE_PAISE);
        payload.put("currency", CURRENCY);
        payload.put("receipt", buildReceipt(topic));

        Map<String, String> notes = new LinkedHashMap<>();
        notes.put("product", "single_deck_generation");
        notes.put("topic", truncate(topic, 80));
        notes.put("slides", String.valueOf(slides));
        if (!customerEmail.isBlank()) {
            notes.put("customer_email", truncate(customerEmail, 80));
        }
        payload.put("notes", notes);

        JsonNode node = executePost("/orders", payload);

        PaymentOrderResponse response = new PaymentOrderResponse();
        response.setOrderId(node.path("id").asText(""));
        response.setKeyId(razorpayKeyId.trim());
        response.setAmount(node.path("amount").asInt(SINGLE_DECK_PRICE_PAISE));
        response.setCurrency(node.path("currency").asText(CURRENCY));
        response.setName(BUSINESS_NAME);
        response.setDescription(CHECKOUT_DESCRIPTION + " for " + truncate(topic, 48));
        response.setCustomerEmail(customerEmail);
        response.setCustomerName(customerName);
        return response;
    }

    public PaymentVerificationResponse verifyPayment(PaymentVerificationRequest request) {
        ensureConfigured();

        String orderId = clean(request == null ? null : request.getOrderId(), "");
        String razorpayOrderId = clean(request == null ? null : request.getRazorpayOrderId(), "");
        String paymentId = clean(request == null ? null : request.getRazorpayPaymentId(), "");
        String signature = clean(request == null ? null : request.getRazorpaySignature(), "");

        if (orderId.isBlank() || paymentId.isBlank() || signature.isBlank()) {
            throw new RuntimeException("Missing Razorpay verification fields.");
        }

        if (!razorpayOrderId.isBlank() && !orderId.equals(razorpayOrderId)) {
            throw new RuntimeException("Razorpay order mismatch.");
        }

        String generatedSignature = hmacHex(orderId + "|" + paymentId, razorpayKeySecret.trim());
        if (!generatedSignature.equals(signature)) {
            throw new RuntimeException("Invalid Razorpay payment signature.");
        }

        JsonNode paymentNode = executeGet("/payments/" + paymentId);
        String paymentStatus = paymentNode.path("status").asText("");
        String paymentOrderId = paymentNode.path("order_id").asText("");

        if (!orderId.equals(paymentOrderId)) {
            throw new RuntimeException("Verified payment does not belong to the expected order.");
        }

        if (!"captured".equalsIgnoreCase(paymentStatus) && !"authorized".equalsIgnoreCase(paymentStatus)) {
            throw new RuntimeException("Payment is not in a successful state yet.");
        }

        PaymentVerificationResponse response = new PaymentVerificationResponse();
        response.setVerified(true);
        response.setOrderId(orderId);
        response.setPaymentId(paymentId);
        response.setPaymentStatus(paymentStatus);
        response.setAmount(paymentNode.path("amount").asInt(SINGLE_DECK_PRICE_PAISE));
        response.setCurrency(paymentNode.path("currency").asText(CURRENCY));
        response.setMessage("Payment verified successfully.");
        return response;
    }

    private JsonNode executePost(String uri, Object payload) {
        try {
            String response = webClient.post()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, basicAuthorizationHeader())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return objectMapper.readTree(response == null ? "{}" : response);
        } catch (WebClientResponseException exception) {
            throw new RuntimeException(
                    "Razorpay API error " + exception.getStatusCode().value() + ": " + exception.getResponseBodyAsString(),
                    exception
            );
        } catch (Exception exception) {
            throw new RuntimeException("Unable to complete Razorpay request.", exception);
        }
    }

    private JsonNode executeGet(String uri) {
        try {
            String response = webClient.get()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, basicAuthorizationHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return objectMapper.readTree(response == null ? "{}" : response);
        } catch (WebClientResponseException exception) {
            throw new RuntimeException(
                    "Razorpay API error " + exception.getStatusCode().value() + ": " + exception.getResponseBodyAsString(),
                    exception
            );
        } catch (Exception exception) {
            throw new RuntimeException("Unable to fetch Razorpay payment details.", exception);
        }
    }

    private void ensureConfigured() {
        if (clean(razorpayKeyId, "").isBlank() || clean(razorpayKeySecret, "").isBlank()) {
            throw new RuntimeException("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }
    }

    private String basicAuthorizationHeader() {
        String raw = razorpayKeyId.trim() + ":" + razorpayKeySecret.trim();
        return "Basic " + Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private String buildReceipt(String topic) {
        String cleanedTopic = topic.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        String suffix = cleanedTopic.isBlank() ? "deck" : truncate(cleanedTopic, 18);
        return "p2c-" + suffix + "-" + Instant.now().toEpochMilli();
    }

    private String hmacHex(String value, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(bytes.length * 2);

            for (byte current : bytes) {
                builder.append(String.format("%02x", current));
            }

            return builder.toString();
        } catch (Exception exception) {
            throw new RuntimeException("Unable to generate Razorpay signature.", exception);
        }
    }

    private String clean(String value, String fallback) {
        if (value == null) {
            return fallback;
        }

        String cleaned = value.trim().replaceAll("\\s+", " ");
        return cleaned.isBlank() ? fallback : cleaned;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, Math.max(0, maxLength));
    }
}
