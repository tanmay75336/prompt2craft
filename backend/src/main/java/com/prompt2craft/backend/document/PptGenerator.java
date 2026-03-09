package com.prompt2craft.backend.document;

import com.prompt2craft.backend.dto.Slide;
import com.prompt2craft.backend.dto.SlideResponse;

import org.apache.poi.sl.usermodel.TextParagraph;
import org.apache.poi.sl.usermodel.VerticalAlignment;
import org.apache.poi.xslf.usermodel.*;
import org.springframework.stereotype.Component;

import java.awt.Dimension;
import java.awt.Rectangle;
import java.io.FileOutputStream;
import java.util.Collections;
import java.util.List;

@Component
public class PptGenerator {
    private static final int MAX_BULLETS_PER_SLIDE = 3;

    public String generate(SlideResponse response) {

        try {

            XMLSlideShow ppt = new XMLSlideShow();
            Dimension pageSize = ppt.getPageSize();
            int slideWidth = pageSize.width;
            int slideHeight = pageSize.height;

            for (Slide slideData : response.getSlides()) {

                XSLFSlide slide = ppt.createSlide();

                // TITLE
                XSLFTextBox titleBox = slide.createTextBox();
                int titleMarginX = 32;
                int titleTop = 24;
                int titleHeight = 70;
                titleBox.setAnchor(new Rectangle(
                        titleMarginX,
                        titleTop,
                        slideWidth - (titleMarginX * 2),
                        titleHeight
                ));
                titleBox.setWordWrap(true);
                titleBox.setVerticalAlignment(VerticalAlignment.MIDDLE);

                XSLFTextParagraph titlePara = titleBox.addNewTextParagraph();
                titlePara.setTextAlign(TextParagraph.TextAlign.CENTER);

                XSLFTextRun titleRun = titlePara.addNewTextRun();
                titleRun.setText(slideData.getTitle());
                titleRun.setFontSize(34.0);
                titleRun.setBold(true);

                // BODY
                XSLFTextBox bodyBox = slide.createTextBox();
                int bodyMarginX = 60;
                int bodyTop = 120;
                int bodyBottomMargin = 50;
                bodyBox.setAnchor(new Rectangle(
                        bodyMarginX,
                        bodyTop,
                        slideWidth - (bodyMarginX * 2),
                        slideHeight - bodyTop - bodyBottomMargin
                ));
                bodyBox.setWordWrap(true);
                bodyBox.setVerticalAlignment(VerticalAlignment.TOP);
                bodyBox.setLeftInset(10.0);
                bodyBox.setRightInset(10.0);

                List<String> points = slideData.getPoints() == null
                        ? Collections.emptyList()
                        : slideData.getPoints().stream().limit(MAX_BULLETS_PER_SLIDE).toList();

                for (String point : points) {

                    XSLFTextParagraph paragraph = bodyBox.addNewTextParagraph();
                    paragraph.setBullet(true);
                    paragraph.setTextAlign(TextParagraph.TextAlign.LEFT);
                    paragraph.setLeftMargin(30.0);
                    paragraph.setIndent(-12.0);
                    paragraph.setLineSpacing(110.0);
                    paragraph.setSpaceAfter(10.0);

                    XSLFTextRun run = paragraph.addNewTextRun();
                    run.setText(trim(clean(point)));
                    run.setFontSize(24.0);
                }
            }

            String filePath = "presentation.pptx";

            FileOutputStream out = new FileOutputStream(filePath);
            ppt.write(out);
            out.close();

            return filePath;

        } catch (Exception e) {
            e.printStackTrace();
            return "error";
        }
    }

    // Trim very long AI text
    private String trim(String text) {

        if (text == null) return "";

        if (text.length() > 140) {
            return text.substring(0, 140).trim() + "...";
        }

        return text;
    }

    private String clean(String text) {
        if (text == null) return "";
        return text.replaceFirst("^[\\-\\u2022\\*\\s]+", "").trim();
    }
}
