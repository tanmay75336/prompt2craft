package com.prompt2craft.backend.dto;

import java.util.List;

public class Slide {

    private String layout;
    private String title;
    private String subtitle;
    private List<String> points;
    private List<String> left;
    private List<String> right;
    private String imagePrompt;

    public Slide(){}

    public String getLayout(){
        return layout;
    }

    public void setLayout(String layout){
        this.layout = layout;
    }

    public String getTitle(){
        return title;
    }

    public void setTitle(String title){
        this.title = title;
    }

    public String getSubtitle(){
        return subtitle;
    }

    public void setSubtitle(String subtitle){
        this.subtitle = subtitle;
    }

    public List<String> getPoints(){
        return points;
    }

    public void setPoints(List<String> points){
        this.points = points;
    }

    public List<String> getLeft(){
        return left;
    }

    public void setLeft(List<String> left){
        this.left = left;
    }

    public List<String> getRight(){
        return right;
    }

    public void setRight(List<String> right){
        this.right = right;
    }

    public String getImagePrompt(){
        return imagePrompt;
    }

    public void setImagePrompt(String imagePrompt){
        this.imagePrompt = imagePrompt;
    }
}