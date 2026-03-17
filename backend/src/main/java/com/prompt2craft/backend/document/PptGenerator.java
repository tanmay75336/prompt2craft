package com.prompt2craft.backend.document;

import com.prompt2craft.backend.dto.Slide;
import com.prompt2craft.backend.dto.SlideResponse;
import com.prompt2craft.backend.service.ImageService;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.imageio.ImageIO;
import org.apache.poi.sl.usermodel.PictureData;
import org.apache.poi.sl.usermodel.ShapeType;
import org.apache.poi.sl.usermodel.TextParagraph;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFAutoShape;
import org.apache.poi.xslf.usermodel.XSLFPictureData;
import org.apache.poi.xslf.usermodel.XSLFPictureShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextBox;
import org.apache.poi.xslf.usermodel.XSLFTextParagraph;
import org.apache.poi.xslf.usermodel.XSLFTextRun;
import org.springframework.stereotype.Component;

@Component
public class PptGenerator {

    private static final int SLIDE_WIDTH = 960;
    private static final int SLIDE_HEIGHT = 540;

    private static final String FONT_DISPLAY = "Aptos Display";
    private static final String FONT_BODY = "Aptos";

    private static final Color PRIMARY = new Color(255, 115, 0);
    private static final Color PRIMARY_DEEP = new Color(194, 65, 12);
    private static final Color PRIMARY_SOFT = new Color(255, 243, 235);
    private static final Color BACKGROUND = new Color(245, 247, 250);
    private static final Color CARD = Color.WHITE;
    private static final Color CARD_TINT = new Color(255, 250, 246);
    private static final Color BORDER = new Color(226, 232, 240);
    private static final Color TEXT = new Color(26, 32, 44);
    private static final Color MUTED = new Color(100, 116, 139);
    private static final Color SOFT_LINE = new Color(255, 215, 192);

    private final ImageService imageService;

    public PptGenerator(ImageService imageService) {
        this.imageService = imageService;
    }

    public String generate(SlideResponse response, String fileName) {

        try (XMLSlideShow ppt = new XMLSlideShow()) {
            ppt.setPageSize(new Dimension(SLIDE_WIDTH, SLIDE_HEIGHT));

            for (Slide slideData : safeSlides(response)) {
                XSLFSlide slide = ppt.createSlide();
                slide.getBackground().setFillColor(BACKGROUND);

                createCanvasChrome(slide);
                createLayout(slide, slideData, ppt);
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

    private void createLayout(XSLFSlide slide, Slide slideData, XMLSlideShow ppt) {
        String layout = slideData.getLayout();

        if (layout == null || layout.isBlank()) {
            layout = "content";
        }

        switch (layout) {
            case "title":
                createTitleSlide(slide, slideData, ppt);
                break;
            case "image":
                createImageSlide(slide, slideData, ppt);
                break;
            case "timeline":
                createTimelineSlide(slide, slideData);
                break;
            case "stats":
                createStatsSlide(slide, slideData);
                break;
            case "two-column":
                createTwoColumnSlide(slide, slideData);
                break;
            case "content":
            default:
                createContentSlide(slide, slideData);
                break;
        }

        if (!"title".equals(layout)) {
            addFooter(slide);
        }
    }

    private void createCanvasChrome(XSLFSlide slide) {
        XSLFAutoShape line = slide.createAutoShape();
        line.setShapeType(ShapeType.RECT);
        line.setAnchor(new Rectangle(0, 0, SLIDE_WIDTH, 6));
        line.setFillColor(PRIMARY);
        line.setLineColor(null);

        XSLFAutoShape glow = slide.createAutoShape();
        glow.setShapeType(ShapeType.RECT);
        glow.setAnchor(new Rectangle(0, 6, SLIDE_WIDTH, 24));
        glow.setFillColor(new Color(255, 249, 244));
        glow.setLineColor(null);
    }

    private void createTitleSlide(XSLFSlide slide, Slide data, XMLSlideShow ppt) {
        createFilledCard(slide, 40, 40, 880, 460, CARD, BORDER);
        createFilledCard(slide, 488, 64, 384, 412, CARD_TINT, new Color(255, 227, 210));

        Rectangle heroArea = new Rectangle(504, 80, 352, 380);
        placeImage(slide, ppt, resolveImageQuery(data), heroArea, true);

        XSLFTextBox eyebrow = createTextBox(slide, 72, 72, 190, 18);
        addText(eyebrow, "Prompt2Craft", 11.0, true, PRIMARY, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);

        XSLFTextBox title = createTextBox(slide, 72, 126, 356, 172);
        addText(
                title,
                text(data.getTitle(), "Presentation Title"),
                resolveTitleFontSize(text(data.getTitle(), "")),
                true,
                TEXT,
                null,
                TextParagraph.TextAlign.LEFT,
                false,
                FONT_DISPLAY
        );

        XSLFTextBox subtitle = createTextBox(slide, 72, 294, 344, 88);
        addText(
                subtitle,
                text(data.getSubtitle(), "A polished deck generated by Prompt2Craft"),
                resolveSubtitleFontSize(text(data.getSubtitle(), "")),
                false,
                MUTED,
                null,
                TextParagraph.TextAlign.LEFT,
                false,
                FONT_BODY
        );

        createFilledCard(slide, 72, 404, 184, 42, PRIMARY_SOFT, new Color(255, 225, 206));
        XSLFTextBox accentText = createTextBox(slide, 88, 416, 152, 18);
        addText(accentText, "Minimal. Clean. Editorial.", 11.0, true, PRIMARY_DEEP, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);

        XSLFAutoShape imageBadge = createFilledCard(slide, 720, 422, 116, 28, CARD, new Color(255, 232, 218));
        imageBadge.setLineWidth(1.0);
        XSLFTextBox badgeText = createTextBox(slide, 734, 430, 88, 12);
        addText(badgeText, "Hero Visual", 9.5, true, PRIMARY_DEEP, null, TextParagraph.TextAlign.CENTER, false, FONT_BODY);
    }

    private void createContentSlide(XSLFSlide slide, Slide data) {
        drawSectionHeader(slide, data.getTitle(), data.getSubtitle(), "Content");

        List<String> points = safeList(data.getPoints());
        if (points.isEmpty()) {
            points = List.of("Add the main point here", "Support it with a concise detail", "Close with a clear takeaway");
        }

        String highlight = points.get(0);
        List<String> remaining = points.size() > 1 ? points.subList(1, points.size()) : Collections.emptyList();

        createFilledCard(slide, 56, 146, 848, 92, PRIMARY_SOFT, new Color(255, 227, 210));
        XSLFTextBox highlightLabel = createTextBox(slide, 84, 164, 140, 14);
        addText(highlightLabel, "Key takeaway", 10.0, true, PRIMARY, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);

        XSLFTextBox highlightBox = createTextBox(slide, 84, 184, 792, 38);
        addText(
                highlightBox,
                highlight,
                resolveHighlightFontSize(highlight),
                true,
                TEXT,
                null,
                TextParagraph.TextAlign.LEFT,
                false,
                FONT_DISPLAY
        );

        createFilledCard(slide, 56, 258, 848, 204, CARD, BORDER);

        if (remaining.isEmpty()) {
            XSLFTextBox fallback = createTextBox(slide, 88, 316, 784, 60);
            addText(fallback, "Use this space for supporting detail or speaker context.", 17.0, false, MUTED, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);
            return;
        }

        double bulletFontSize = resolveBulletFontSize(remaining, 18.5, 16.5, 15.0);

        if (remaining.size() >= 4) {
            int split = (remaining.size() + 1) / 2;
            List<String> left = new ArrayList<>(remaining.subList(0, split));
            List<String> right = new ArrayList<>(remaining.subList(split, remaining.size()));
            addBulletColumn(slide, 88, 292, 356, 148, left, bulletFontSize, 14.0);
            addBulletColumn(slide, 492, 292, 356, 148, right, bulletFontSize, 14.0);

            XSLFAutoShape divider = slide.createAutoShape();
            divider.setShapeType(ShapeType.RECT);
            divider.setAnchor(new Rectangle(474, 292, 2, 148));
            divider.setFillColor(new Color(245, 232, 224));
            divider.setLineColor(null);
        } else {
            XSLFTextBox body = createTextBox(slide, 88, 294, 784, 148);
            addBullets(body, remaining, bulletFontSize, 16.0);
        }
    }

    private void createImageSlide(XSLFSlide slide, Slide data, XMLSlideShow ppt) {
        drawSectionHeader(slide, data.getTitle(), data.getSubtitle(), "Image");

        Rectangle imageArea = new Rectangle(56, 146, 418, 316);
        createFilledCard(slide, imageArea.x, imageArea.y, imageArea.width, imageArea.height, CARD_TINT, new Color(255, 227, 210));
        placeImage(slide, ppt, resolveImageQuery(data), imageArea, true);

        createFilledCard(slide, 494, 146, 410, 316, CARD, BORDER);

        XSLFTextBox narrativeLabel = createTextBox(slide, 524, 170, 140, 14);
        addText(narrativeLabel, "Supporting narrative", 10.0, true, PRIMARY, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);

        XSLFTextBox body = createTextBox(slide, 524, 202, 340, 210);
        List<String> points = safeList(data.getPoints());
        if (points.isEmpty()) {
            points = List.of("Add a strong narrative point", "Use the image to reinforce the idea", "Keep the slide focused");
        }
        addBullets(body, points, resolveBulletFontSize(points, 18.0, 16.0, 14.5), 14.0);
    }

    private void createTimelineSlide(XSLFSlide slide, Slide data) {
        drawSectionHeader(slide, data.getTitle(), data.getSubtitle(), "Timeline");

        List<String> points = safeList(data.getTimelinePoints());
        if (points.isEmpty()) {
            points = safeList(data.getPoints());
        }
        if (points.isEmpty()) {
            points = List.of("Phase 1", "Phase 2", "Phase 3");
        }

        int total = Math.min(points.size(), 4);
        int cardWidth = total <= 3 ? 250 : 196;
        int gap = total <= 3 ? 22 : 18;
        int totalWidth = (cardWidth * total) + (gap * (total - 1));
        int startX = (SLIDE_WIDTH - totalWidth) / 2;

        XSLFAutoShape line = slide.createAutoShape();
        line.setShapeType(ShapeType.RECT);
        line.setAnchor(new Rectangle(startX + 22, 274, totalWidth - 44, 4));
        line.setFillColor(SOFT_LINE);
        line.setLineColor(null);

        for (int index = 0; index < total; index++) {
            int x = startX + (index * (cardWidth + gap));

            XSLFAutoShape dot = slide.createAutoShape();
            dot.setShapeType(ShapeType.ELLIPSE);
            dot.setAnchor(new Rectangle(x + 26, 260, 28, 28));
            dot.setFillColor(PRIMARY);
            dot.setLineColor(null);

            createFilledCard(slide, x, 302, cardWidth, 126, CARD, BORDER);

            XSLFTextBox step = createTextBox(slide, x + 22, 320, cardWidth - 44, 16);
            addText(step, "STEP " + (index + 1), 10.0, true, PRIMARY, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);

            XSLFTextBox body = createTextBox(slide, x + 22, 346, cardWidth - 44, 56);
            addText(body, points.get(index), resolveTimelineFontSize(points.get(index)), true, TEXT, null, TextParagraph.TextAlign.LEFT, false, FONT_DISPLAY);
        }
    }

    private void createStatsSlide(XSLFSlide slide, Slide data) {
        drawSectionHeader(slide, data.getTitle(), data.getSubtitle(), "Stats");

        List<String> stats = safeList(data.getStats());
        if (stats.isEmpty()) {
            stats = safeList(data.getPoints());
        }
        if (stats.isEmpty()) {
            stats = List.of("264: Highest ODI score", "3x: Double centuries in ODIs", "1: ICC Champions Trophy title", "100%: Opening role clarity");
        }

        for (int index = 0; index < Math.min(stats.size(), 4); index++) {
            int row = index / 2;
            int column = index % 2;
            int x = 56 + (column * 426);
            int y = 158 + (row * 152);

            Color fill = index == 0 ? PRIMARY_SOFT : CARD;
            Color stroke = index == 0 ? new Color(255, 227, 210) : BORDER;
            createFilledCard(slide, x, y, 370, 122, fill, stroke);

            String[] parts = splitStat(stats.get(index));

            XSLFTextBox valueBox = createTextBox(slide, x + 28, y + 26, 160, 38);
            addText(valueBox, parts[0], resolveStatValueSize(parts[0]), true, TEXT, null, TextParagraph.TextAlign.LEFT, false, FONT_DISPLAY);

            XSLFTextBox labelBox = createTextBox(slide, x + 28, y + 70, 300, 26);
            addText(labelBox, parts[1], 13.0, false, MUTED, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);
        }
    }

    private void createTwoColumnSlide(XSLFSlide slide, Slide data) {
        drawSectionHeader(slide, data.getTitle(), data.getSubtitle(), "Two Column");

        List<String> left = safeList(data.getLeft());
        List<String> right = safeList(data.getRight());

        if (left.isEmpty() && right.isEmpty()) {
            List<String> points = safeList(data.getPoints());
            int midpoint = Math.max((points.size() + 1) / 2, 1);
            left = points.subList(0, Math.min(midpoint, points.size()));
            right = points.subList(Math.min(midpoint, points.size()), points.size());
        }

        createFilledCard(slide, 56, 150, 404, 312, CARD, BORDER);
        createFilledCard(slide, 500, 150, 404, 312, CARD, BORDER);

        XSLFTextBox leftLabel = createTextBox(slide, 88, 176, 120, 14);
        addText(leftLabel, "Column One", 10.0, true, PRIMARY, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);

        XSLFTextBox rightLabel = createTextBox(slide, 532, 176, 120, 14);
        addText(rightLabel, "Column Two", 10.0, true, PRIMARY, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);

        XSLFTextBox leftBody = createTextBox(slide, 88, 208, 340, 214);
        addBullets(leftBody, left.isEmpty() ? List.of("Add left column content") : left, resolveBulletFontSize(left, 17.0, 15.5, 14.0), 13.0);

        XSLFTextBox rightBody = createTextBox(slide, 532, 208, 340, 214);
        addBullets(rightBody, right.isEmpty() ? List.of("Add right column content") : right, resolveBulletFontSize(right, 17.0, 15.5, 14.0), 13.0);
    }

    private void drawSectionHeader(XSLFSlide slide, String title, String subtitle, String label) {
        XSLFTextBox eyebrow = createTextBox(slide, 56, 42, 120, 14);
        addText(eyebrow, label, 10.0, true, PRIMARY, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);

        XSLFTextBox titleBox = createTextBox(slide, 56, 60, 760, 42);
        addText(
                titleBox,
                text(title, "Untitled Slide"),
                resolveSectionTitleFontSize(text(title, "")),
                true,
                TEXT,
                null,
                TextParagraph.TextAlign.LEFT,
                false,
                FONT_DISPLAY
        );

        if (subtitle != null && !subtitle.isBlank()) {
            XSLFTextBox subtitleBox = createTextBox(slide, 56, 106, 780, 18);
            addText(subtitleBox, subtitle, 13.0, false, MUTED, null, TextParagraph.TextAlign.LEFT, false, FONT_BODY);
        }
    }

    private void addFooter(XSLFSlide slide) {
        XSLFTextBox footer = createTextBox(slide, 738, 506, 170, 12);
        addText(footer, "Generated by Prompt2Craft", 8.5, false, MUTED, null, TextParagraph.TextAlign.RIGHT, false, FONT_BODY);
    }

    private void addBulletColumn(XSLFSlide slide, int x, int y, int width, int height, List<String> points, double fontSize, double spaceAfter) {
        XSLFTextBox body = createTextBox(slide, x, y, width, height);
        addBullets(body, points, fontSize, spaceAfter);
    }

    private void placeImage(XSLFSlide slide, XMLSlideShow ppt, String query, Rectangle target, boolean cover) {
        byte[] image = imageService.fetchImage(query);

        if (image == null) {
            XSLFTextBox placeholder = createTextBox(slide, target.x + 22, target.y + target.height / 2 - 24, target.width - 44, 48);
            addText(placeholder, text(query, "Image placeholder"), 14.0, true, MUTED, null, TextParagraph.TextAlign.CENTER, false, FONT_BODY);
            return;
        }

        byte[] processed = cover ? cropToCover(image, target.width, target.height) : image;
        if (processed == null) {
            processed = image;
        }

        try {
            XSLFPictureData pictureData = ppt.addPicture(processed, PictureData.PictureType.JPEG);
            XSLFPictureShape picture = slide.createPicture(pictureData);
            picture.setAnchor(target);
        } catch (Exception e) {
            XSLFTextBox placeholder = createTextBox(slide, target.x + 22, target.y + target.height / 2 - 24, target.width - 44, 48);
            addText(placeholder, text(query, "Image unavailable"), 14.0, true, MUTED, null, TextParagraph.TextAlign.CENTER, false, FONT_BODY);
        }
    }

    private XSLFAutoShape createFilledCard(XSLFSlide slide, int x, int y, int width, int height, Color fill, Color stroke) {
        XSLFAutoShape card = slide.createAutoShape();
        card.setShapeType(ShapeType.ROUND_RECT);
        card.setAnchor(new Rectangle(x, y, width, height));
        card.setFillColor(fill);
        card.setLineColor(stroke);
        card.setLineWidth(1.0);
        return card;
    }

    private XSLFTextBox createTextBox(XSLFSlide slide, int x, int y, int width, int height) {
        XSLFTextBox textBox = slide.createTextBox();
        textBox.setAnchor(new Rectangle(x, y, width, height));
        textBox.clearText();
        return textBox;
    }

    private void addText(
            XSLFTextBox textBox,
            String value,
            double fontSize,
            boolean bold,
            Color color,
            Double spaceAfter,
            TextParagraph.TextAlign align,
            boolean bullet,
            String fontFamily
    ) {
        XSLFTextParagraph paragraph = textBox.addNewTextParagraph();
        paragraph.setTextAlign(align);
        paragraph.setSpaceAfter(spaceAfter == null ? 0.0 : spaceAfter);
        paragraph.setLineSpacing(108.0);
        if (bullet) {
            paragraph.setBullet(true);
            paragraph.setLeftMargin(22.0);
        }

        XSLFTextRun run = paragraph.addNewTextRun();
        run.setText(value);
        run.setFontSize(fontSize);
        run.setBold(bold);
        run.setFontColor(color);
        run.setFontFamily(fontFamily);
    }

    private void addBullets(XSLFTextBox box, List<String> points, double fontSize, double spaceAfter) {
        for (String point : points) {
            addText(box, point, fontSize, false, TEXT, spaceAfter, TextParagraph.TextAlign.LEFT, true, FONT_BODY);
        }
    }

    private double resolveTitleFontSize(String title) {
        int length = title.length();
        if (length > 72) {
            return 24.0;
        }
        if (length > 48) {
            return 27.0;
        }
        return 32.0;
    }

    private double resolveSectionTitleFontSize(String title) {
        int length = title.length();
        if (length > 60) {
            return 22.0;
        }
        if (length > 38) {
            return 24.0;
        }
        return 27.0;
    }

    private double resolveSubtitleFontSize(String subtitle) {
        return subtitle.length() > 80 ? 14.0 : 16.0;
    }

    private double resolveHighlightFontSize(String value) {
        if (value.length() > 90) {
            return 15.0;
        }
        if (value.length() > 60) {
            return 17.0;
        }
        return 19.0;
    }

    private double resolveTimelineFontSize(String value) {
        return value.length() > 42 ? 14.0 : 16.0;
    }

    private double resolveStatValueSize(String value) {
        return value.length() > 10 ? 20.0 : 26.0;
    }

    private double resolveBulletFontSize(List<String> points, double baseSize, double mediumSize, double smallSize) {
        int maxLength = 0;
        int totalLength = 0;

        for (String point : points) {
            maxLength = Math.max(maxLength, point.length());
            totalLength += point.length();
        }

        int averageLength = points.isEmpty() ? 0 : totalLength / points.size();

        if (points.size() >= 5 || maxLength > 90 || averageLength > 70) {
            return smallSize;
        }
        if (points.size() >= 4 || maxLength > 65 || averageLength > 50) {
            return mediumSize;
        }
        return baseSize;
    }

    private String[] splitStat(String rawStat) {
        String value = rawStat == null ? "" : rawStat.trim();

        if (value.contains(":")) {
            String[] parts = value.split(":", 2);
            return new String[] { parts[0].trim(), parts[1].trim() };
        }

        if (value.contains(" - ")) {
            String[] parts = value.split(" - ", 2);
            return new String[] { parts[0].trim(), parts[1].trim() };
        }

        if (value.matches("^[0-9][0-9A-Za-z+.%/-]*\\s+.+$")) {
            int splitAt = value.indexOf(' ');
            return new String[] { value.substring(0, splitAt).trim(), value.substring(splitAt + 1).trim() };
        }

        return new String[] { value, "Key metric" };
    }

    private byte[] cropToCover(byte[] imageBytes, int targetWidth, int targetHeight) {
        try {
            BufferedImage source = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (source == null) {
                return null;
            }

            double targetRatio = (double) targetWidth / (double) targetHeight;
            double sourceRatio = (double) source.getWidth() / (double) source.getHeight();

            int cropX = 0;
            int cropY = 0;
            int cropWidth = source.getWidth();
            int cropHeight = source.getHeight();

            if (sourceRatio > targetRatio) {
                cropWidth = (int) Math.round(source.getHeight() * targetRatio);
                cropX = Math.max((source.getWidth() - cropWidth) / 2, 0);
            } else if (sourceRatio < targetRatio) {
                cropHeight = (int) Math.round(source.getWidth() / targetRatio);
                cropY = Math.max((source.getHeight() - cropHeight) / 2, 0);
            }

            BufferedImage cropped = source.getSubimage(cropX, cropY, cropWidth, cropHeight);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(cropped, "jpg", outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            return null;
        }
    }

    private String resolveImageQuery(Slide data) {
        return text(data.getImagePrompt(), text(data.getTitle(), "presentation visual"));
    }

    private List<Slide> safeSlides(SlideResponse response) {
        return response == null || response.getSlides() == null
                ? Collections.emptyList()
                : response.getSlides();
    }

    private List<String> safeList(List<String> values) {
        return values == null ? Collections.emptyList() : values;
    }

    private String text(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
