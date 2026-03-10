package com.prompt2craft.backend.dto;

public class PromptRequest {

    private String topic;
    private int slides;

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public int getSlides() {
        return slides;
    }

    public void setSlides(int slides) {
        this.slides = slides;
    }
}