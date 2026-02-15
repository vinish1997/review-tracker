package com.vinishchoudhary.reviewtracker.api.controller;

import com.vinishchoudhary.reviewtracker.domain.model.Review;
import com.vinishchoudhary.reviewtracker.repository.ReviewRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final ReviewRepository reviewRepo;
    private final com.vinishchoudhary.reviewtracker.repository.NotificationRuleRepository ruleRepo;

    @Data
    @Builder
    public static class NotificationItem {
        private String id;
        private String reviewId;
        private String orderId;
        private String type; // URGENT | INFO | WARNING
        private String title;
        private String message;
        private String actionUrl;
    }

    @GetMapping("/rules")
    public List<com.vinishchoudhary.reviewtracker.domain.model.NotificationRule> getRules() {
        return ruleRepo.findAll();
    }

    @PostMapping("/rules")
    public com.vinishchoudhary.reviewtracker.domain.model.NotificationRule createRule(
            @RequestBody com.vinishchoudhary.reviewtracker.domain.model.NotificationRule rule) {
        return ruleRepo.save(rule);
    }

    @PutMapping("/rules/{id}")
    public com.vinishchoudhary.reviewtracker.domain.model.NotificationRule updateRule(@PathVariable String id,
            @RequestBody com.vinishchoudhary.reviewtracker.domain.model.NotificationRule rule) {
        rule.setId(id);
        return ruleRepo.save(rule);
    }

    @DeleteMapping("/rules/{id}")
    public void deleteRule(@PathVariable String id) {
        ruleRepo.deleteById(id);
    }

    @GetMapping
    public List<NotificationItem> getNotifications() {
        List<NotificationItem> items = new ArrayList<>();
        LocalDate today = LocalDate.now();
        List<Review> reviews = reviewRepo.findAll();
        List<com.vinishchoudhary.reviewtracker.domain.model.NotificationRule> rules = ruleRepo.findByActiveTrue();

        // Fallback to default rules if none exist to preserve original behavior for
        // now?
        // No, let's just use the DB rules. If empty, no notifications (except maybe we
        // should seed them, but for now assuming user will add them)
        // actually, let's keep the hardcoded ones as "System Rules" if DB is empty to
        // avoid regression during dev?
        // Better: The requirement is "Configurable Notification Rules".
        // I will assume the user will create rules.

        for (Review r : reviews) {
            for (com.vinishchoudhary.reviewtracker.domain.model.NotificationRule rule : rules) {
                if (checkRule(r, rule, today)) {
                    long days = getDaysOffset(r, rule, today);
                    items.add(NotificationItem.builder()
                            .id("notif-" + rule.getId() + "-" + r.getId())
                            .reviewId(r.getId())
                            .orderId(r.getOrderId())
                            .type(rule.getType())
                            .title(rule.getName())
                            .message(rule.getMessageTemplate()
                                    .replace("{orderId}", r.getOrderId() == null ? "?" : r.getOrderId())
                                    .replace("{days}", String.valueOf(days)))
                            .actionUrl(rule.getActionUrl() != null ? rule.getActionUrl().replace("{id}", r.getId())
                                    : "/reviews/edit/" + r.getId())
                            .build());
                }
            }
        }
        return items;
    }

    private boolean checkRule(Review r, com.vinishchoudhary.reviewtracker.domain.model.NotificationRule rule,
            LocalDate today) {
        // 1. Check if trigger field is present
        LocalDate triggerDate = getDate(r, rule.getTriggerField());
        if (triggerDate == null)
            return false;

        // 2. Check if missing field is indeed missing
        if (rule.getMissingField() != null) {
            LocalDate missingDate = getDate(r, rule.getMissingField());
            if (missingDate != null)
                return false; // It's present, so rule doesn't apply
        }

        // 3. Check exclude status
        if (rule.getExcludeStatus() != null && rule.getExcludeStatus().equalsIgnoreCase(r.getStatus())) {
            return false;
        }

        // 4. Check time condition
        long days = ChronoUnit.DAYS.between(triggerDate, today);
        return days >= rule.getDaysAfter();
    }

    private long getDaysOffset(Review r, com.vinishchoudhary.reviewtracker.domain.model.NotificationRule rule,
            LocalDate today) {
        LocalDate triggerDate = getDate(r, rule.getTriggerField());
        if (triggerDate == null)
            return 0;
        return ChronoUnit.DAYS.between(triggerDate, today);
    }

    private LocalDate getDate(Review r, String field) {
        switch (field) {
            case "orderedDate":
                return r.getOrderedDate();
            case "deliveryDate":
                return r.getDeliveryDate();
            case "reviewSubmitDate":
                return r.getReviewSubmitDate();
            case "reviewAcceptedDate":
                return r.getReviewAcceptedDate();
            case "ratingSubmittedDate":
                return r.getRatingSubmittedDate();
            case "refundFormSubmittedDate":
                return r.getRefundFormSubmittedDate();
            case "paymentReceivedDate":
                return r.getPaymentReceivedDate();
            default:
                return null;
        }
    }
}
