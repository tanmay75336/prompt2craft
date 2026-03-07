package com.prompt2craft.backend.dto;

public class PromptResponse {

    private String result;

    public PromptResponse(String result) {
        this.result = result;
    }

    public String getResult() {
        return result;
    }
}