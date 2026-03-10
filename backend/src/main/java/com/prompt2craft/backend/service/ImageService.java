package com.prompt2craft.backend.service;

import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URL;

@Service
public class ImageService {

    public byte[] fetchImage(String query) {

        try {

            if (query == null || query.isBlank()) {
                query = "technology";
            }

            // Clean the query
            query = query.toLowerCase()
                    .replaceAll("[^a-zA-Z ]", "")
                    .trim()
                    .replace(" ", "");

            // Stable seeded image
            String url = "https://picsum.photos/seed/" + query + "/800/600";

            InputStream in = new URL(url).openStream();

            return in.readAllBytes();

        } catch (Exception e) {

            System.out.println("Image fetch failed for query: " + query);

            return null;
        }
    }
}