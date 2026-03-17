package com.prompt2craft.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ImageService {

    private static final String USER_AGENT = "Prompt2Craft/1.0";

    @Value("${unsplash.access.key:}")
    private String accessKey;

    private final ObjectMapper mapper = new ObjectMapper();

    public byte[] fetchImage(String query) {

        String normalizedQuery = normalize(query);

        if (normalizedQuery.isBlank()) {
            return null;
        }

        try {
            byte[] entityImage = fetchWikipediaImage(normalizedQuery);
            if (entityImage != null) {
                return entityImage;
            }

            return fetchUnsplashImage(normalizedQuery);

        } catch (Exception e) {
            System.out.println("Image fetch failed: " + e.getMessage());
            return null;
        }
    }

    private byte[] fetchWikipediaImage(String query) {
        if (!looksLikeEntityQuery(query)) {
            return null;
        }

        try {
            String searchUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&utf8=1&format=json&srlimit=1&srsearch="
                    + encode(query);

            JsonNode searchRoot = readJson(searchUrl);
            JsonNode results = searchRoot.path("query").path("search");

            if (!results.isArray() || results.isEmpty()) {
                return null;
            }

            String title = results.get(0).path("title").asText("");
            if (title.isBlank()) {
                return null;
            }

            String summaryUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/"
                    + encodePath(title.replace(' ', '_'));

            JsonNode summaryRoot = readJson(summaryUrl);
            String imageUrl = summaryRoot.path("originalimage").path("source").asText("");

            if (imageUrl.isBlank()) {
                imageUrl = summaryRoot.path("thumbnail").path("source").asText("");
            }

            return imageUrl.isBlank() ? null : downloadBytes(imageUrl);
        } catch (Exception ignored) {
            return null;
        }
    }

    private byte[] fetchUnsplashImage(String query) {
        String resolvedAccessKey = accessKey == null ? "" : accessKey.trim();

        if (resolvedAccessKey.isBlank()) {
            return null;
        }

        try {
            String enhancedQuery = buildUnsplashQuery(query);

            String apiUrl = "https://api.unsplash.com/search/photos?query="
                    + encode(enhancedQuery)
                    + "&orientation=landscape"
                    + "&content_filter=high"
                    + "&per_page=5"
                    + "&client_id="
                    + encode(resolvedAccessKey);

            JsonNode root = readJson(apiUrl);
            JsonNode results = root.path("results");

            if (!results.isArray() || results.isEmpty()) {
                return null;
            }

            for (JsonNode result : results) {
                String imageUrl = result.path("urls").path("regular").asText("");
                if (!imageUrl.isBlank()) {
                    byte[] image = downloadBytes(imageUrl);
                    if (image != null) {
                        return image;
                    }
                }
            }

            return null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private JsonNode readJson(String url) throws Exception {
        byte[] bytes = downloadBytes(url);
        return bytes == null ? mapper.createObjectNode() : mapper.readTree(bytes);
    }

    private byte[] downloadBytes(String url) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) URI.create(url).toURL().openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("User-Agent", USER_AGENT);
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(12000);

        int status = connection.getResponseCode();
        if (status < 200 || status >= 300) {
            return null;
        }

        try (InputStream inputStream = connection.getInputStream()) {
            return inputStream.readAllBytes();
        }
    }

    private String buildUnsplashQuery(String query) {
        String lower = query.toLowerCase();

        if (lower.contains("cricket") || lower.contains("football") || lower.contains("basketball") || lower.contains("tennis")) {
            return query + " action sports photography";
        }

        if (looksLikeEntityQuery(query)) {
            return query + " portrait editorial photo";
        }

        return query + " professional presentation photo";
    }

    private boolean looksLikeEntityQuery(String query) {
        String[] words = query.trim().split("\\s+");

        if (words.length > 8) {
            return false;
        }

        int capitalizedWords = 0;
        for (String word : words) {
            if (!word.isEmpty() && Character.isUpperCase(word.charAt(0))) {
                capitalizedWords++;
            }
        }

        return capitalizedWords >= 2;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String encodePath(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
