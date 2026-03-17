package com.prompt2craft.backend.controller;

import com.prompt2craft.backend.dto.PromptRequest;
import com.prompt2craft.backend.dto.SlideResponse;
import com.prompt2craft.backend.service.PromptService;
import java.io.File;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class TestController {

    private final PromptService promptService;

    public TestController(PromptService promptService) {
        this.promptService = promptService;
    }

    @PostMapping("/preview")
    public ResponseEntity<SlideResponse> preview(@RequestBody PromptRequest request) {
        SlideResponse response = promptService.previewContent(request.getTopic(), request.getSlides());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate")
    public ResponseEntity<Resource> generate(@RequestBody PromptRequest request) {
        String fileName = promptService.generateContent(request.getTopic(), request.getSlides());
        return buildFileResponse(fileName);
    }

    @PostMapping("/generate-from-json")
    public ResponseEntity<Resource> generateFromJson(@RequestBody SlideResponse request) {
        String fileName = promptService.generateFromSlides(request);
        return buildFileResponse(fileName);
    }

    private ResponseEntity<Resource> buildFileResponse(String fileName) {
        if (fileName == null || "error".equals(fileName)) {
            return ResponseEntity.internalServerError().build();
        }

        File file = new File(fileName);

        if (!file.exists()) {
            return ResponseEntity.internalServerError().build();
        }

        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + file.getName())
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.presentationml.presentation")
                .body(resource);
    }
}
