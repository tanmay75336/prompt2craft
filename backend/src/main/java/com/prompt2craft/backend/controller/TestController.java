package com.prompt2craft.backend.controller;

import org.springframework.web.bind.annotation.*;
import com.prompt2craft.backend.dto.PromptRequest;
import com.prompt2craft.backend.dto.PromptResponse;
import com.prompt2craft.backend.service.PromptService;

@RestController
@RequestMapping("/api")
public class TestController {

    private final PromptService promptService;

    public TestController(PromptService promptService) {
        this.promptService = promptService;
    }

    @PostMapping("/prompt")
    public PromptResponse generate(@RequestBody PromptRequest request) {

        String result = promptService.generateContent(request.getPrompt());

        return new PromptResponse(result);
    }
}