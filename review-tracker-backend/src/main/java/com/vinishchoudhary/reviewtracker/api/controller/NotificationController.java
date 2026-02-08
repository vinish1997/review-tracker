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

    @GetMapping
    public List<NotificationItem> getNotifications() {
        List<NotificationItem> items = new ArrayList<>();
        LocalDate today = LocalDate.now();
        List<Review> reviews = reviewRepo.findAll();

        for (Review r : reviews) {
            // 1. Review Reminder: 7 days after orderedDate and no reviewSubmitDate
            if (r.getOrderedDate() != null && r.getReviewSubmitDate() == null) {
                long days = ChronoUnit.DAYS.between(r.getOrderedDate(), today);
                if (days >= 7) {
                    items.add(NotificationItem.builder()
                            .id("rev-" + r.getId())
                            .reviewId(r.getId())
                            .orderId(r.getOrderId())
                            .type("WARNING")
                            .title("Review Pending")
                            .message("It's been " + days + " days since order. Time to submit review?")
                            .actionUrl("/reviews/edit/" + r.getId())
                            .build());
                }
            }

            // 2. Refund Form Reminder: 3 days after reviewAcceptedDate/reviewSubmitDate and
            // no refundFormSubmittedDate
            LocalDate triggerDate = r.getReviewAcceptedDate() != null ? r.getReviewAcceptedDate()
                    : r.getReviewSubmitDate();
            if (triggerDate != null && r.getRefundFormSubmittedDate() == null
                    && !"payment received".equals(r.getStatus())) {
                long days = ChronoUnit.DAYS.between(triggerDate, today);
                if (days >= 3) {
                    items.add(NotificationItem.builder()
                            .id("ref-" + r.getId())
                            .reviewId(r.getId())
                            .orderId(r.getOrderId())
                            .type("URGENT")
                            .title("Refund Form Pending")
                            .message("Submit refund form for order " + r.getOrderId() + " (accepted " + days
                                    + " days ago).")
                            .actionUrl("/reviews/edit/" + r.getId())
                            .build());
                }
            }

            // 3. Payment Reminders: 45 and 60 days
            if (r.getRefundFormSubmittedDate() != null && r.getPaymentReceivedDate() == null) {
                long days = ChronoUnit.DAYS.between(r.getRefundFormSubmittedDate(), today);
                if (days >= 60) {
                    items.add(NotificationItem.builder()
                            .id("pay60-" + r.getId())
                            .reviewId(r.getId())
                            .orderId(r.getOrderId())
                            .type("URGENT")
                            .title("Payment Critical Overdue")
                            .message("Order " + r.getOrderId() + " payment overdue by " + days + " days. Escalate now!")
                            .actionUrl("/reviews/edit/" + r.getId())
                            .build());
                } else if (days >= 45) {
                    items.add(NotificationItem.builder()
                            .id("pay45-" + r.getId())
                            .reviewId(r.getId())
                            .orderId(r.getOrderId())
                            .type("WARNING")
                            .title("Payment Follow-up")
                            .message("45 days passed since refund form submission. Check status.")
                            .actionUrl("/reviews/edit/" + r.getId())
                            .build());
                }
            }
        }

        return items;
    }
}
