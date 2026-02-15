package com.vinishchoudhary.reviewtracker.api.controller;

import com.vinishchoudhary.reviewtracker.domain.model.*;
import com.vinishchoudhary.reviewtracker.repository.ReviewSearchCriteria;
import com.vinishchoudhary.reviewtracker.service.ReviewService;
import com.vinishchoudhary.reviewtracker.service.ReviewHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import com.vinishchoudhary.reviewtracker.api.dto.PageResponse;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.time.LocalDate;

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
    public PageResponse<Review> search(@RequestBody ReviewSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "createdAt") String sort,
            @RequestParam(required = false, defaultValue = "DESC") String dir) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Page<Review> result = reviewService.searchReviews(criteria,
                PageRequest.of(page, size, Sort.by(direction, sort)));
        PageResponse<Review> resp = new PageResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                sort,
                dir);
        return resp;
    }

    // GET alternative for environments that block POSTs
    @GetMapping("/search")
    public PageResponse<Review> searchGet(
            @RequestParam(required = false) String productNameContains,
            @RequestParam(required = false) String orderIdContains,
            @RequestParam(required = false) String platformId,
            @RequestParam(required = false) String mediatorId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dealType,
            @RequestParam(required = false) List<String> platformIdIn,
            @RequestParam(required = false) List<String> mediatorIdIn,
            @RequestParam(required = false) List<String> statusIn,
            @RequestParam(required = false) List<String> dealTypeIn,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "createdAt") String sort,
            @RequestParam(required = false, defaultValue = "DESC") String dir,
            @RequestParam(required = false) Boolean hasRefundFormUrl) {
        ReviewSearchCriteria criteria = ReviewSearchCriteria.builder()
                .platformId(emptyToNull(platformId))
                .mediatorId(emptyToNull(mediatorId))
                .status(emptyToNull(status))
                .dealType(emptyToNull(dealType))
                .productNameContains(emptyToNull(productNameContains))
                .orderIdContains(emptyToNull(orderIdContains))
                .platformIdIn(normalizeList(platformIdIn))
                .mediatorIdIn(normalizeList(mediatorIdIn))
                .statusIn(normalizeList(statusIn))
                .dealTypeIn(normalizeList(dealTypeIn))
                .hasRefundFormUrl(hasRefundFormUrl)
                .build();
        Sort.Direction direction = "ASC".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Page<Review> result = reviewService.searchReviews(criteria,
                PageRequest.of(page, size, Sort.by(direction, sort)));
        return new PageResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                sort,
                dir);
    }

    @PostMapping("/aggregates")
    public ResponseEntity<Map<String, Object>> aggregates(@RequestBody ReviewSearchCriteria criteria) {
        return ResponseEntity.ok(reviewService.aggregates(criteria));
    }

    // GET alternative for aggregates
    @GetMapping("/aggregates")
    public ResponseEntity<Map<String, Object>> aggregatesGet(
            @RequestParam(required = false) String productNameContains,
            @RequestParam(required = false) String orderIdContains,
            @RequestParam(required = false) List<String> platformIdIn,
            @RequestParam(required = false) List<String> mediatorIdIn,
            @RequestParam(required = false) List<String> statusIn,
            @RequestParam(required = false) List<String> dealTypeIn,
            @RequestParam(required = false) Boolean hasRefundFormUrl) {
        ReviewSearchCriteria criteria = ReviewSearchCriteria.builder()
                .productNameContains(emptyToNull(productNameContains))
                .orderIdContains(emptyToNull(orderIdContains))
                .platformIdIn(normalizeList(platformIdIn))
                .mediatorIdIn(normalizeList(mediatorIdIn))
                .statusIn(normalizeList(statusIn))
                .dealTypeIn(normalizeList(dealTypeIn))
                .hasRefundFormUrl(hasRefundFormUrl)
                .build();
        return ResponseEntity.ok(reviewService.aggregates(criteria));
    }

    private static String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static List<String> normalizeList(List<String> in) {
        if (in == null)
            return null;
        // Accept both repeated query params and single comma-separated strings
        List<String> out = new ArrayList<>();
        for (String v : in) {
            if (v == null)
                continue;
            if (v.contains(",")) {
                for (String p : v.split(",")) {
                    String t = p.trim();
                    if (!t.isEmpty())
                        out.add(t);
                }
            } else {
                String t = v.trim();
                if (!t.isEmpty())
                    out.add(t);
            }
        }
        return out.isEmpty() ? null : out;
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

    // ---------- Advance ----------
    public static class AdvanceRequest {
        public String date;
        public List<String> ids;
    }

    @PostMapping("/{id}/advance")
    public ResponseEntity<Review> advance(@PathVariable String id, @RequestBody(required = false) AdvanceRequest body) {
        LocalDate when = null;
        if (body != null && body.date != null && !body.date.isBlank()) {
            when = LocalDate.parse(body.date);
        }
        return ResponseEntity.ok(reviewService.advanceNext(id, when));
    }

    @PostMapping("/bulk-advance")
    public ResponseEntity<List<Review>> bulkAdvance(@RequestBody AdvanceRequest body) {
        if (body == null || body.ids == null || body.ids.isEmpty())
            return ResponseEntity.badRequest().build();
        LocalDate when = null;
        if (body.date != null && !body.date.isBlank())
            when = LocalDate.parse(body.date);
        return ResponseEntity.ok(reviewService.bulkAdvanceNext(body.ids, when));
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

    // ---------- Metrics (MVP) ----------
    @GetMapping("/metrics/overdue-count")
    public ResponseEntity<java.util.Map<String, Long>> overdueCount() {
        long c = reviewService.overdueCount();
        return ResponseEntity.ok(java.util.Map.of("overdue", c));
    }

    // ---------- Dashboard ----------
    @GetMapping("/dashboard-stats")
    public ResponseEntity<com.vinishchoudhary.reviewtracker.api.dto.DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(reviewService.getDashboardStats());
    }
}
