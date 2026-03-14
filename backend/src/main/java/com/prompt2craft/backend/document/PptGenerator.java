package com.prompt2craft.backend.document;

import com.prompt2craft.backend.dto.Slide;
import com.prompt2craft.backend.dto.SlideResponse;
import com.prompt2craft.backend.service.ImageService;

import org.apache.poi.sl.usermodel.PictureData;
import org.apache.poi.sl.usermodel.ShapeType;
import org.apache.poi.sl.usermodel.TextParagraph;
import org.apache.poi.xslf.usermodel.*;
import org.springframework.stereotype.Component;

import java.awt.*;
import java.io.FileOutputStream;
import java.util.Collections;
import java.util.List;

@Component
public class PptGenerator {

    private final ImageService imageService;

    public PptGenerator(ImageService imageService) {
        this.imageService = imageService;
    }

    private static final Color PRIMARY = new Color(255,115,0);
    private static final Color BACKGROUND = new Color(246,248,252);
    private static final Color TEXT = new Color(40,40,40);

    public String generate(SlideResponse response,String fileName){

        try{

            XMLSlideShow ppt = new XMLSlideShow();
            Dimension size = ppt.getPageSize();

            int width = size.width;
            int height = size.height;

            for(Slide slideData : response.getSlides()){

                XSLFSlide slide = ppt.createSlide();

                slide.getBackground().setFillColor(BACKGROUND);

                createHeader(slide,width);

                String layout = slideData.getLayout();

                if(layout == null) layout="content";

                if(layout.equals("title")){

                    createTitleSlide(slide,slideData,width,height);

                }else if(layout.equals("image")){

                    createImageSlide(slide,slideData,ppt,width,height);

                }else{

                    createContentSlide(slide,slideData,width,height);

                }

                addFooter(slide,width,height);
            }

            try(FileOutputStream out = new FileOutputStream(fileName)){
                ppt.write(out);
            }

            return fileName;

        }catch(Exception e){

            e.printStackTrace();
            return "error";
        }
    }

    private void createHeader(XSLFSlide slide,int width){

        XSLFAutoShape bar = slide.createAutoShape();
        bar.setShapeType(ShapeType.RECT);
        bar.setAnchor(new Rectangle(0,0,width,18));
        bar.setFillColor(PRIMARY);
        bar.setLineColor(null);
    }

    private void createTitleSlide(XSLFSlide slide,Slide data,int width,int height){

        XSLFTextBox title = slide.createTextBox();

        title.setAnchor(new Rectangle(
                100,
                height/2-120,
                width-200,
                200
        ));

        XSLFTextParagraph p = title.addNewTextParagraph();
        p.setTextAlign(TextParagraph.TextAlign.CENTER);

        XSLFTextRun r = p.addNewTextRun();
        r.setText(data.getTitle());
        r.setFontSize(56.0);
        r.setBold(true);
        r.setFontColor(PRIMARY);
    }

    private void createContentSlide(XSLFSlide slide,Slide data,int width,int height){

        createTitle(slide,data.getTitle(),width);

        XSLFTextBox body = slide.createTextBox();

        body.setAnchor(new Rectangle(
                140,
                180,
                width-280,
                height-260
        ));

        List<String> points = data.getPoints()==null
                ? Collections.emptyList()
                : data.getPoints();

        for(String point:points){

            XSLFTextParagraph p = body.addNewTextParagraph();

            p.setBullet(true);
            p.setLeftMargin(30.0);
            p.setSpaceAfter(14.0);

            XSLFTextRun r = p.addNewTextRun();
            r.setText(point);
            r.setFontSize(28.0);
            r.setFontColor(TEXT);
        }
    }

    private void createImageSlide(XSLFSlide slide,Slide data,XMLSlideShow ppt,int width,int height){

        createTitle(slide,data.getTitle(),width);

        String query = data.getImagePrompt();

        if(query==null || query.isBlank()){
            query = data.getTitle();
        }

        byte[] image = imageService.fetchImage(query);

        if(image!=null){

            XSLFPictureData pd = ppt.addPicture(image,PictureData.PictureType.JPEG);

            XSLFPictureShape picture = slide.createPicture(pd);

            picture.setAnchor(new Rectangle(
                    120,
                    200,
                    width/2-160,
                    height-300
            ));
        }

        XSLFTextBox body = slide.createTextBox();

        body.setAnchor(new Rectangle(
                width/2+40,
                200,
                width/2-160,
                height-300
        ));

        List<String> points = data.getPoints()==null
                ? Collections.emptyList()
                : data.getPoints();

        for(String point:points){

            XSLFTextParagraph p = body.addNewTextParagraph();

            p.setBullet(true);
            p.setSpaceAfter(12.0);

            XSLFTextRun r = p.addNewTextRun();
            r.setText(point);
            r.setFontSize(26.0);
            r.setFontColor(TEXT);
        }
    }

    private void createTitle(XSLFSlide slide,String title,int width){

        XSLFTextBox titleBox = slide.createTextBox();

        titleBox.setAnchor(new Rectangle(
                100,
                50,
                width-200,
                80
        ));

        XSLFTextParagraph p = titleBox.addNewTextParagraph();

        XSLFTextRun r = p.addNewTextRun();
        r.setText(title);
        r.setFontSize(40.0);
        r.setBold(true);
        r.setFontColor(TEXT);
    }

    private void addFooter(XSLFSlide slide,int width,int height){

        XSLFTextBox footer = slide.createTextBox();

        footer.setAnchor(new Rectangle(
                width-240,
                height-40,
                220,
                30
        ));

        XSLFTextParagraph p = footer.addNewTextParagraph();

        XSLFTextRun r = p.addNewTextRun();
        r.setText("Generated by Prompt2Craft");
        r.setFontSize(12.0);
        r.setFontColor(new Color(120,120,120));
    }
}