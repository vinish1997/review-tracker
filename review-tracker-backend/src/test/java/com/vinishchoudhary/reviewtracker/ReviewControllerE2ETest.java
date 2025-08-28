package com.vinishchoudhary.reviewtracker;

import com.vinishchoudhary.reviewtracker.domain.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ReviewControllerE2ETest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void cleanDb() {
        mongoTemplate.getDb().drop();
    }

    @Test
    void fullReviewFlow() {
        // create lookup entities
        Platform platform = restTemplate.postForObject("/api/lookups/platforms", new Platform(null, "Amazon"), Platform.class);
        Status status = restTemplate.postForObject("/api/lookups/statuses", new Status(null, "Pending"), Status.class);
        Mediator mediator = restTemplate.postForObject("/api/lookups/mediators", new Mediator(null, "John"), Mediator.class);

        // create review
        Review r1 = Review.builder()
                .orderId("O1")
                .productName("Widget")
                .platformId(platform.getId())
                .statusId(status.getId())
                .mediatorId(mediator.getId())
                .amountRupees(new BigDecimal("100"))
                .lessRupees(new BigDecimal("10"))
                .orderedDate(LocalDate.now())
                .build();
        Review created1 = restTemplate.postForObject("/api/reviews", r1, Review.class);
        assertThat(created1.getId()).isNotNull();

        // get review
        Review fetched = restTemplate.getForObject("/api/reviews/" + created1.getId(), Review.class);
        assertThat(fetched.getProductName()).isEqualTo("Widget");
        assertThat(fetched.getRefundAmountRupees()).isEqualByComparingTo("90");

        // update review
        created1.setProductName("Widget Updated");
        ResponseEntity<Review> updatedResp = restTemplate.exchange("/api/reviews/" + created1.getId(), HttpMethod.PUT, new HttpEntity<>(created1), Review.class);
        assertThat(updatedResp.getBody().getProductName()).isEqualTo("Widget Updated");

        // search
        Review[] searchResults = restTemplate.getForObject("/api/reviews?search=Widget", Review[].class);
        assertThat(searchResults).isNotEmpty();

        // clone
        Review clone = restTemplate.postForObject("/api/reviews/" + created1.getId() + "/clone", null, Review.class);
        assertThat(clone.getOrderId()).isEqualTo(created1.getOrderId() + "-clone");

        // second review
        Review r2 = Review.builder()
                .orderId("O2")
                .productName("Gadget")
                .platformId(platform.getId())
                .statusId(status.getId())
                .mediatorId(mediator.getId())
                .amountRupees(new BigDecimal("50"))
                .lessRupees(new BigDecimal("5"))
                .orderedDate(LocalDate.now())
                .build();
        Review created2 = restTemplate.postForObject("/api/reviews", r2, Review.class);

        // copy product name from r1 to r2
        Review copied = restTemplate.postForObject("/api/reviews/" + created1.getId() + "/copy/" + created2.getId(), List.of("productName"), Review.class);
        assertThat(copied.getProductName()).isEqualTo("Widget Updated");

        // bulk update
        Map<String, Object> bulkBody = new HashMap<>();
        bulkBody.put("ids", List.of(created1.getId(), created2.getId()));
        bulkBody.put("updates", Map.of("statusId", status.getId()));
        Review[] bulkUpdated = restTemplate.postForObject("/api/reviews/bulk-update", bulkBody, Review[].class);
        assertThat(bulkUpdated).hasSize(2);

        // history
        ReviewHistory[] history = restTemplate.getForObject("/api/reviews/" + created1.getId() + "/history", ReviewHistory[].class);
        assertThat(history.length).isGreaterThanOrEqualTo(2);

        // export csv
        String csv = restTemplate.getForObject("/api/reviews/export", String.class);
        assertThat(csv).contains("O1");

        // import csv
        String csvData = "orderId,productName,amount,less,refund\nO3,Thing,30,3,27\n";
        ByteArrayResource csvResource = new ByteArrayResource(csvData.getBytes(StandardCharsets.UTF_8)) {
            @Override
            public String getFilename() {
                return "reviews.csv";
            }
        };
        MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();
        parts.add("file", csvResource);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> importReq = new HttpEntity<>(parts, headers);
        ResponseEntity<Review[]> importResp = restTemplate.postForEntity("/api/reviews/import", importReq, Review[].class);
        assertThat(importResp.getBody()).hasSize(1);

        // dashboard
        Map dashboard = restTemplate.getForObject("/api/reviews/dashboard", Map.class);
        assertThat((Integer) dashboard.get("totalReviews")).isGreaterThanOrEqualTo(3);

        // bulk delete
        HttpEntity<List<String>> deleteReq = new HttpEntity<>(List.of(created1.getId(), created2.getId(), clone.getId()));
        restTemplate.postForEntity("/api/reviews/bulk-delete", deleteReq, Void.class);
        Review[] remaining = restTemplate.getForObject("/api/reviews", Review[].class);
        assertThat(remaining.length).isGreaterThanOrEqualTo(1);
    }
}

