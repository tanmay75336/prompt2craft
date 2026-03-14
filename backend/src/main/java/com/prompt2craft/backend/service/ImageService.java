package com.prompt2craft.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ImageService {

    @Value("${unsplash.access.key}")
    private String accessKey;

    public byte[] fetchImage(String query) {

        try {

            String enhancedQuery = query + " infographic illustration diagram";

            String apiUrl =
                    "https://api.unsplash.com/search/photos?query="
                            + enhancedQuery.replace(" ", "+")
                            + "&orientation=landscape"
                            + "&per_page=1"
                            + "&client_id="
                            + accessKey;

            URL url = new URL(apiUrl);

            HttpURLConnection conn =
                    (HttpURLConnection) url.openConnection();

            conn.setRequestMethod("GET");

            InputStream responseStream = conn.getInputStream();

            Scanner scanner =
                    new Scanner(responseStream).useDelimiter("\\A");

            String json = scanner.hasNext() ? scanner.next() : "";

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);

            String imageUrl =
                    root.get("results")
                            .get(0)
                            .get("urls")
                            .get("regular")
                            .asText();

            URL image = new URL(imageUrl);

            HttpURLConnection imgConn =
                    (HttpURLConnection) image.openConnection();

            imgConn.setRequestMethod("GET");

            InputStream imgStream = imgConn.getInputStream();

            return imgStream.readAllBytes();

        } catch (Exception e) {

            System.out.println("Image fetch failed: " + e.getMessage());
            return null;
        }
    }
}