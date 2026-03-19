package com.prompt2craft.backend.controller;

import com.prompt2craft.backend.dto.PromptRequest;
import com.prompt2craft.backend.dto.SlideResponse;
import com.prompt2craft.backend.dto.PaymentOrderRequest;
import com.prompt2craft.backend.dto.PaymentOrderResponse;
import com.prompt2craft.backend.dto.PaymentVerificationRequest;
import com.prompt2craft.backend.dto.PaymentVerificationResponse;
import com.prompt2craft.backend.service.ImageAsset;
import com.prompt2craft.backend.service.ImageService;
import com.prompt2craft.backend.service.PromptService;
import com.prompt2craft.backend.service.RazorpayService;
import java.io.File;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class TestController {

    private final PromptService promptService;
    private final ImageService imageService;
    private final RazorpayService razorpayService;

    public TestController(PromptService promptService, ImageService imageService, RazorpayService razorpayService) {
        this.promptService = promptService;
        this.imageService = imageService;
        this.razorpayService = razorpayService;
    }

    @PostMapping("/preview")
    public ResponseEntity<SlideResponse> preview(@RequestBody PromptRequest request) {
        SlideResponse response = promptService.previewContent(request.getTopic(), request.getSlides());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/preview-image")
    public ResponseEntity<byte[]> previewImage(@RequestParam("query") String query) {
        ImageAsset image = imageService.fetchImageAsset(query);

        if (image == null || image.bytes() == null || image.bytes().length == 0) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .contentType(MediaType.parseMediaType(image.contentType()))
                .body(image.bytes());
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

    @PostMapping("/payments/order")
    public ResponseEntity<PaymentOrderResponse> createPaymentOrder(@RequestBody PaymentOrderRequest request) {
        PaymentOrderResponse response = razorpayService.createGenerationOrder(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payments/verify")
    public ResponseEntity<PaymentVerificationResponse> verifyPayment(@RequestBody PaymentVerificationRequest request) {
        PaymentVerificationResponse response = razorpayService.verifyPayment(request);
        return ResponseEntity.ok(response);
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
