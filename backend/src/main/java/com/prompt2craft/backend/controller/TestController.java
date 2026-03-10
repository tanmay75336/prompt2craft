package com.prompt2craft.backend.controller;

import com.prompt2craft.backend.dto.PromptRequest;
import com.prompt2craft.backend.service.PromptService;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class TestController {

    private final PromptService promptService;

    public TestController(PromptService promptService) {
        this.promptService = promptService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Resource> generate(@RequestBody PromptRequest request) {

        String topic = request.getTopic();
        int slides = request.getSlides();

        String fileName = promptService.generateContent(topic, slides);

        File file = new File(fileName);

        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.presentationml.presentation")
                .body(resource);
    }
}