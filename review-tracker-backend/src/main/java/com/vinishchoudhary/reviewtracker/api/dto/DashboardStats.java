package com.vinishchoudhary.reviewtracker.api.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardStats {
    private long totalReviews;
    private long pendingReviewRating;
    private long pendingRefundForm;
    private long pendingPayment;
    private long overdue;

    private BigDecimal totalSpent;
    private BigDecimal totalRefunded;
    private BigDecimal netCost;
    private BigDecimal pendingRefundAmount;

    private List<ActionItem> actionItems;

    @Data
    @Builder
    public static class ActionItem {
        private String id;
        private String message;
        private String type; // URGENT, WARNING, INFO
        private String link;
    }
}
