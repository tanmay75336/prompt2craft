package com.prompt2craft.backend.dto;

import java.util.List;

public class Slide {

    private String title;
    private List<String> points;

    public String getTitle() {
        return title;
    }

    public List<String> getPoints() {
        return points;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setPoints(List<String> points) {
        this.points = points;
    }
}