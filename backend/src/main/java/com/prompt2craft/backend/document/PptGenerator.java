package com.prompt2craft.backend.document;

import com.prompt2craft.backend.dto.Slide;
import com.prompt2craft.backend.dto.SlideResponse;
import com.prompt2craft.backend.service.ImageService;

import org.apache.poi.sl.usermodel.PictureData;
import org.apache.poi.sl.usermodel.TextParagraph;
import org.apache.poi.sl.usermodel.VerticalAlignment;
import org.apache.poi.xslf.usermodel.*;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Rectangle;
import java.io.FileOutputStream;
import java.util.Collections;
import java.util.List;

@Component
public class PptGenerator {

    private final ImageService imageService;

    public PptGenerator(ImageService imageService) {
        this.imageService = imageService;
    }

    private static final int MAX_BULLETS_PER_SLIDE = 3;

    public String generate(SlideResponse response, String fileName) {

        try {

            XMLSlideShow ppt = new XMLSlideShow();

            Dimension pageSize = ppt.getPageSize();
            int slideWidth = pageSize.width;
            int slideHeight = pageSize.height;

            for (Slide slideData : response.getSlides()) {

                String layout = slideData.getLayout();

                if (layout == null) {
                    layout = "content";
                }

                XSLFSlide slide = ppt.createSlide();

                // ---------- BACKGROUND ----------
                slide.getBackground().setFillColor(new Color(245, 247, 250));

                // ---------- TITLE SLIDE ----------
                if (layout.equalsIgnoreCase("title")) {

                    XSLFTextBox titleBox = slide.createTextBox();

                    titleBox.setAnchor(new Rectangle(
                            100,
                            slideHeight / 2 - 80,
                            slideWidth - 200,
                            160));

                    titleBox.setVerticalAlignment(VerticalAlignment.MIDDLE);

                    XSLFTextParagraph para = titleBox.addNewTextParagraph();
                    para.setTextAlign(TextParagraph.TextAlign.CENTER);

                    XSLFTextRun run = para.addNewTextRun();
                    run.setText(clean(slideData.getTitle()));
                    run.setFontSize(48.0);
                    run.setBold(true);
                    run.setFontColor(new Color(0, 102, 204));

                    continue;
                }

                // ---------- SLIDE TITLE ----------
                XSLFTextBox titleBox = slide.createTextBox();

                titleBox.setAnchor(new Rectangle(
                        40,
                        30,
                        slideWidth - 80,
                        70));

                titleBox.setVerticalAlignment(VerticalAlignment.MIDDLE);

                XSLFTextParagraph titlePara = titleBox.addNewTextParagraph();
                titlePara.setTextAlign(TextParagraph.TextAlign.CENTER);

                XSLFTextRun titleRun = titlePara.addNewTextRun();
                titleRun.setText(clean(slideData.getTitle()));
                titleRun.setFontSize(36.0);
                titleRun.setBold(true);
                titleRun.setFontColor(new Color(0, 102, 204));

                // ---------- IMAGE SLIDE ----------
                if (layout.equalsIgnoreCase("image")) {

                    String imageQuery = slideData.getImagePrompt();

                    if (imageQuery == null || imageQuery.isBlank()) {
                        imageQuery = slideData.getTitle() + " sport";
                    }

                    if (imageQuery == null || imageQuery.isBlank()) {
                        imageQuery = slideData.getTitle();
                    }

                    byte[] imageBytes = imageService.fetchImage(imageQuery);

                    if (imageBytes != null) {

                        XSLFPictureData pictureData = ppt.addPicture(imageBytes, PictureData.PictureType.JPEG);

                        XSLFPictureShape picture = slide.createPicture(pictureData);

                        picture.setAnchor(new Rectangle(
                                60,
                                140,
                                slideWidth / 2 - 100,
                                slideHeight - 220));
                    }

                    XSLFTextBox bodyBox = slide.createTextBox();

                    bodyBox.setAnchor(new Rectangle(
                            slideWidth / 2,
                            140,
                            slideWidth / 2 - 80,
                            slideHeight - 200));

                    List<String> points = slideData.getPoints() == null
                            ? Collections.emptyList()
                            : slideData.getPoints()
                                    .stream()
                                    .limit(MAX_BULLETS_PER_SLIDE)
                                    .toList();

                    for (String point : points) {

                        XSLFTextParagraph paragraph = bodyBox.addNewTextParagraph();

                        paragraph.setBullet(true);

                        XSLFTextRun run = paragraph.addNewTextRun();
                        run.setText(trim(clean(point)));
                        run.setFontSize(22.0);
                        run.setFontColor(Color.DARK_GRAY);
                    }

                    continue;
                }

                // ---------- CONTENT SLIDE ----------
                XSLFTextBox bodyBox = slide.createTextBox();

                bodyBox.setAnchor(new Rectangle(
                        80,
                        130,
                        slideWidth - 160,
                        slideHeight - 200));

                bodyBox.setVerticalAlignment(VerticalAlignment.TOP);

                List<String> points = slideData.getPoints() == null
                        ? Collections.emptyList()
                        : slideData.getPoints()
                                .stream()
                                .limit(MAX_BULLETS_PER_SLIDE)
                                .toList();

                for (String point : points) {

                    XSLFTextParagraph paragraph = bodyBox.addNewTextParagraph();

                    paragraph.setBullet(true);
                    paragraph.setLeftMargin(30.0);
                    paragraph.setIndent(-10.0);

                    XSLFTextRun run = paragraph.addNewTextRun();
                    run.setText(trim(clean(point)));
                    run.setFontSize(24.0);
                    run.setFontColor(Color.DARK_GRAY);
                }
            }

            try (FileOutputStream out = new FileOutputStream(fileName)) {
                ppt.write(out);
            }

            return fileName;

        } catch (Exception e) {

            e.printStackTrace();
            return "error";
        }
    }

    private String trim(String text) {

        if (text == null)
            return "";

        if (text.length() > 140) {
            return text.substring(0, 140).trim() + "...";
        }

        return text;
    }

    private String clean(String text) {

        if (text == null)
            return "";

        return text
                .replaceFirst("^[\\-\\u2022\\*\\s]+", "")
                .replaceAll("\\s+", " ")
                .trim();
    }
}