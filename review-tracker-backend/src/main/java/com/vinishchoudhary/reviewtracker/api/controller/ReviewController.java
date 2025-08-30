package com.vinishchoudhary.reviewtracker.api.controller;

import com.vinishchoudhary.reviewtracker.domain.model.*;
import com.vinishchoudhary.reviewtracker.repository.ReviewSearchCriteria;
import com.vinishchoudhary.reviewtracker.service.ReviewService;
import com.vinishchoudhary.reviewtracker.service.ReviewHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;
    private final ReviewHistoryService historyService;

    // ---------- CRUD ----------
    @PostMapping
    public ResponseEntity<Review> create(@RequestBody Review review) {
        return ResponseEntity.ok(reviewService.createReview(review));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Review> update(@PathVariable String id, @RequestBody Review review) {
        return ResponseEntity.ok(reviewService.updateReview(id, review));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Review> get(@PathVariable String id) {
        return reviewService.getReview(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    

    @GetMapping
    public List<Review> all(@RequestParam(required = false) String search) {
        if (search == null || search.isBlank()) {
            return reviewService.getAllReviews();
        }
        ReviewSearchCriteria criteria = ReviewSearchCriteria.builder()
                .productNameContains(search)
                .build();
        return reviewService.searchReviews(criteria, PageRequest.of(0, Integer.MAX_VALUE))
                .getContent();
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/search")
    public Page<Review> search(@RequestBody ReviewSearchCriteria criteria,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "10") int size,
                               @RequestParam(required = false, defaultValue = "createdAt") String sort,
                               @RequestParam(required = false, defaultValue = "DESC") String dir) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return reviewService.searchReviews(criteria, PageRequest.of(page, size, Sort.by(direction, sort)));
    }

    // ---------- Clone / Copy ----------
    @PostMapping("/{id}/clone")
    public ResponseEntity<Review> clone(@PathVariable String id) {
        return ResponseEntity.ok(reviewService.cloneReview(id));
    }

    @PostMapping("/{srcId}/copy/{targetId}")
    public ResponseEntity<Review> copyFields(@PathVariable String srcId,
                                             @PathVariable String targetId,
                                             @RequestBody List<String> fields) {
        return ResponseEntity.ok(reviewService.copyFields(srcId, targetId, fields));
    }

    // ---------- Bulk ----------
    @PostMapping("/bulk-update")
    public ResponseEntity<List<Review>> bulkUpdate(@RequestBody Map<String, Object> body) {
        List<String> ids = (List<String>) body.get("ids");
        Map<String, Object> updates = (Map<String, Object>) body.get("updates");
        return ResponseEntity.ok(reviewService.bulkUpdate(ids, updates));
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> bulkDelete(@RequestBody List<String> ids) {
        reviewService.bulkDelete(ids);
        return ResponseEntity.noContent().build();
    }

    // ---------- History ----------
    @GetMapping("/{id}/history")
    public ResponseEntity<List<ReviewHistory>> history(@PathVariable String id) {
        return ResponseEntity.ok(historyService.getHistory(id));
    }

    // ---------- CSV ----------
    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<String> exportCsv() {
        return ResponseEntity.ok(reviewService.exportCsv());
    }

    @PostMapping("/import")
    public ResponseEntity<List<Review>> importCsv(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(reviewService.importCsv(file));
    }

    // ---------- Dashboard ----------
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        return ResponseEntity.ok(reviewService.dashboard());
    }
}
