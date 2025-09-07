package com.vinishchoudhary.reviewtracker.repository;

import com.vinishchoudhary.reviewtracker.domain.model.Review;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;
import java.util.regex.Pattern;

@Repository
@RequiredArgsConstructor
public class ReviewRepositoryImpl implements ReviewRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<Review> searchReviews(ReviewSearchCriteria criteria, Pageable pageable) {
        Query query = new Query();
        List<Criteria> filters = new ArrayList<>();

        if (criteria.getPlatformId() != null) filters.add(Criteria.where("platformId").is(criteria.getPlatformId()));
        if (criteria.getPlatformIdIn() != null && !criteria.getPlatformIdIn().isEmpty())
            filters.add(Criteria.where("platformId").in(criteria.getPlatformIdIn()));

        if (criteria.getStatus() != null) filters.add(Criteria.where("status").is(criteria.getStatus()));
        if (criteria.getStatusIn() != null && !criteria.getStatusIn().isEmpty())
            filters.add(Criteria.where("status").in(criteria.getStatusIn()));

        if (criteria.getMediatorId() != null) filters.add(Criteria.where("mediatorId").is(criteria.getMediatorId()));
        if (criteria.getMediatorIdIn() != null && !criteria.getMediatorIdIn().isEmpty())
            filters.add(Criteria.where("mediatorId").in(criteria.getMediatorIdIn()));
        if (criteria.getDealType() != null) filters.add(Criteria.where("dealType").is(criteria.getDealType()));
        if (criteria.getDealTypeIn() != null && !criteria.getDealTypeIn().isEmpty())
            filters.add(Criteria.where("dealType").in(criteria.getDealTypeIn()));

        if (criteria.getProductNameContains() != null)
            filters.add(Criteria.where("productName").regex(criteria.getProductNameContains(), "i"));

        if (criteria.getOrderIdContains() != null)
            filters.add(Criteria.where("orderId").regex(criteria.getOrderIdContains(), "i"));

        if (!filters.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(filters.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, Review.class);
        query.with(pageable);
        List<Review> results = mongoTemplate.find(query, Review.class);

        return new PageImpl<>(results, pageable, total);
    }

    @Override
    public java.util.Map<String, Object> aggregatedTotals(ReviewSearchCriteria criteria) {
        List<AggregationOperation> ops = new ArrayList<>();
        // match
        List<Criteria> filters = new ArrayList<>();
        if (criteria.getPlatformId() != null) filters.add(Criteria.where("platformId").is(criteria.getPlatformId()));
        if (criteria.getPlatformIdIn() != null && !criteria.getPlatformIdIn().isEmpty())
            filters.add(Criteria.where("platformId").in(criteria.getPlatformIdIn()));
        if (criteria.getStatus() != null) filters.add(Criteria.where("status").is(criteria.getStatus()));
        if (criteria.getStatusIn() != null && !criteria.getStatusIn().isEmpty())
            filters.add(Criteria.where("status").in(criteria.getStatusIn()));
        if (criteria.getMediatorId() != null) filters.add(Criteria.where("mediatorId").is(criteria.getMediatorId()));
        if (criteria.getMediatorIdIn() != null && !criteria.getMediatorIdIn().isEmpty())
            filters.add(Criteria.where("mediatorId").in(criteria.getMediatorIdIn()));
        if (criteria.getDealType() != null) filters.add(Criteria.where("dealType").is(criteria.getDealType()));
        if (criteria.getDealTypeIn() != null && !criteria.getDealTypeIn().isEmpty())
            filters.add(Criteria.where("dealType").in(criteria.getDealTypeIn()));
        if (criteria.getProductNameContains() != null)
            filters.add(Criteria.where("productName").regex(criteria.getProductNameContains(), "i"));
        if (criteria.getOrderIdContains() != null)
            filters.add(Criteria.where("orderId").regex(criteria.getOrderIdContains(), "i"));
        if (!filters.isEmpty()) {
            ops.add(context -> new org.bson.Document("$match", new org.bson.Document(new Criteria().andOperator(filters.toArray(new Criteria[0])).getCriteriaObject())));
        }

        // Add computedRefund using $ifNull + $cond; coerce to numbers via $toDouble to handle strings/decimals
        org.bson.Document computedRefundExpr = org.bson.Document.parse("{\n" +
                "  \"$ifNull\": [ \"$refundAmountRupees\", {\n" +
                "    \"$cond\": [ { \"$and\": [ { \"$ne\": [ \"$amountRupees\", null ] }, { \"$ne\": [ \"$lessRupees\", null ] } ] },\n" +
                "               { \"$subtract\": [ { \"$toDouble\": \"$amountRupees\" }, { \"$toDouble\": \"$lessRupees\" } ] },\n" +
                "               0 ]\n" +
                "  } ]\n" +
                "}");

        ops.add(context -> new org.bson.Document("$addFields", new org.bson.Document("computedRefund", computedRefundExpr)));

        // group totals
        org.bson.Document groupFields = new org.bson.Document("_id", null)
                .append("count", new org.bson.Document("$sum", 1))
                .append("totalAmount", new org.bson.Document("$sum", new org.bson.Document("$toDouble", "$amountRupees")))
                .append("totalRefund", new org.bson.Document("$sum", new org.bson.Document("$toDouble", "$computedRefund")));
        ops.add(context -> new org.bson.Document("$group", groupFields));

        Aggregation agg = Aggregation.newAggregation(ops);
        org.bson.Document result = mongoTemplate.aggregate(agg, Review.class, org.bson.Document.class)
                .getUniqueMappedResult();
        java.util.Map<String, Object> out = new java.util.HashMap<>();
        if (result != null) {
            Object c = result.getOrDefault("count", 0);
            Object ta = result.get("totalAmount");
            Object tr = result.get("totalRefund");
            out.put("count", (c instanceof Number n) ? n.longValue() : 0L);
            out.put("totalAmount", (ta instanceof Number n) ? n.doubleValue() : 0.0);
            out.put("totalRefund", (tr instanceof Number n) ? n.doubleValue() : 0.0);
        } else {
            out.put("count", 0L);
            out.put("totalAmount", 0.0);
            out.put("totalRefund", 0.0);
        }
        return out;
    }

    @Override
    public java.util.Map<String, Object> aggregatedDashboard() {
        return aggregatedDashboard(null, null, null);
    }

    @Override
    public java.util.Map<String, Object> aggregatedDashboard(String scope, java.time.LocalDate from, java.time.LocalDate to) {
        List<AggregationOperation> ops = new ArrayList<>();

        // computedRefund = refundAmountRupees ?? ((amountRupees && lessRupees) ? amountRupees-lessRupees : 0)
        org.bson.Document amountAndLessPresent = new org.bson.Document("$and", java.util.Arrays.asList(
                new org.bson.Document("$ne", java.util.Arrays.asList("$amountRupees", null)),
                new org.bson.Document("$ne", java.util.Arrays.asList("$lessRupees", null))
        ));
        org.bson.Document fallbackSubtract = new org.bson.Document("$cond",
                java.util.Arrays.asList(
                        amountAndLessPresent,
                        new org.bson.Document("$subtract", java.util.Arrays.asList("$amountRupees", "$lessRupees")),
                        0
                )
        );
        org.bson.Document computedRefundExpr = new org.bson.Document("$ifNull",
                java.util.Arrays.asList("$refundAmountRupees", fallbackSubtract)
        );
        ops.add(context -> new org.bson.Document("$addFields", new org.bson.Document("computedRefund", computedRefundExpr)));

        // Precompute 'completed' flag (flow finished) per dealType for pending/overdue logic
        org.bson.Document completedExpr = new org.bson.Document("$switch",
                new org.bson.Document("branches", java.util.Arrays.asList(
                        new org.bson.Document("case", new org.bson.Document("$eq", java.util.Arrays.asList("$dealType", "REVIEW_PUBLISHED")))
                                .append("then", new org.bson.Document("$and", java.util.Arrays.asList(
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$reviewSubmitDate", null)),
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$reviewAcceptedDate", null)),
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$refundFormSubmittedDate", null)),
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$paymentReceivedDate", null))
                                ))),
                        new org.bson.Document("case", new org.bson.Document("$eq", java.util.Arrays.asList("$dealType", "RATING_ONLY")))
                                .append("then", new org.bson.Document("$and", java.util.Arrays.asList(
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$ratingSubmittedDate", null)),
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$refundFormSubmittedDate", null)),
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$paymentReceivedDate", null))
                                ))),
                        new org.bson.Document("case", new org.bson.Document("$eq", java.util.Arrays.asList("$dealType", "REVIEW_SUBMISSION")))
                                .append("then", new org.bson.Document("$and", java.util.Arrays.asList(
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$reviewSubmitDate", null)),
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$refundFormSubmittedDate", null)),
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$paymentReceivedDate", null))
                                )))
                )).append("default", false));
        ops.add(context -> new org.bson.Document("$addFields", new org.bson.Document("completed", completedExpr)));

        // Date anchors for aging buckets (JSON parse to avoid builder nesting)
        org.bson.Document anchorExpr = org.bson.Document.parse("{\n" +
                "  \"$switch\": {\n" +
                "    \"branches\": [\n" +
                "      { \"case\": { \"$eq\": [ \"$dealType\", \"REVIEW_PUBLISHED\" ] }, \"then\": { \"$cond\": [ { \"$eq\": [ \"$reviewSubmitDate\", null ] }, \"$deliveryDate\", { \"$cond\": [ { \"$eq\": [ \"$reviewAcceptedDate\", null ] }, \"$reviewSubmitDate\", { \"$cond\": [ { \"$eq\": [ \"$refundFormSubmittedDate\", null ] }, \"$reviewAcceptedDate\", { \"$cond\": [ { \"$eq\": [ \"$paymentReceivedDate\", null ] }, \"$refundFormSubmittedDate\", null ] } ] } ] } ] } },\n" +
                "      { \"case\": { \"$eq\": [ \"$dealType\", \"RATING_ONLY\" ] }, \"then\": { \"$cond\": [ { \"$eq\": [ \"$ratingSubmittedDate\", null ] }, \"$deliveryDate\", { \"$cond\": [ { \"$eq\": [ \"$refundFormSubmittedDate\", null ] }, \"$ratingSubmittedDate\", { \"$cond\": [ { \"$eq\": [ \"$paymentReceivedDate\", null ] }, \"$refundFormSubmittedDate\", null ] } ] } ] } },\n" +
                "      { \"case\": { \"$eq\": [ \"$dealType\", \"REVIEW_SUBMISSION\" ] }, \"then\": { \"$cond\": [ { \"$eq\": [ \"$reviewSubmitDate\", null ] }, \"$deliveryDate\", { \"$cond\": [ { \"$eq\": [ \"$refundFormSubmittedDate\", null ] }, \"$reviewSubmitDate\", { \"$cond\": [ { \"$eq\": [ \"$paymentReceivedDate\", null ] }, \"$refundFormSubmittedDate\", null ] } ] } ] } }\n" +
                "    ],\n" +
                "    \"default\": null\n" +
                "  }\n" +
                "}");
        ops.add(context -> new org.bson.Document("$addFields", new org.bson.Document("anchorDate", anchorExpr)));

        // build reference dates for overdue and aging buckets
        java.util.Date now = new java.util.Date();
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTime(now); cal.add(java.util.Calendar.DAY_OF_MONTH, -7); java.util.Date nowMinus7 = cal.getTime();
        cal.setTime(now); cal.add(java.util.Calendar.DAY_OF_MONTH, -14); java.util.Date nowMinus14 = cal.getTime();
        cal.setTime(now); cal.add(java.util.Calendar.DAY_OF_MONTH, -30); java.util.Date nowMinus30 = cal.getTime();

        // Optional scope/date filters prior to facet
        // Scope: 'received' => paymentReceivedDate != null; 'pending' => completed != true; else all
        if ("received".equalsIgnoreCase(scope)) {
            ops.add(context -> new org.bson.Document("$match", new org.bson.Document("paymentReceivedDate", new org.bson.Document("$ne", null))));
        } else if ("pending".equalsIgnoreCase(scope)) {
            ops.add(context -> new org.bson.Document("$match", new org.bson.Document("completed", new org.bson.Document("$ne", true))));
        }

        // Date window (apply before facet): for 'received' use paymentReceivedDate; otherwise use createdAt
        if (from != null || to != null) {
            java.util.Date fromD = null, toD = null;
            if (from != null) fromD = java.util.Date.from(from.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());
            if (to != null) toD = java.util.Date.from(to.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());
            String dateField = ("received".equalsIgnoreCase(scope)) ? "paymentReceivedDate" : "createdAt";
            org.bson.Document range = new org.bson.Document();
            if (fromD != null) range.append("$gte", fromD);
            if (toD != null) range.append("$lt", toD);
            ops.add(context -> new org.bson.Document("$match", new org.bson.Document(dateField, range)));
        }

        // facet
        org.bson.Document facet = new org.bson.Document();

        // totals
        facet.append("totals", java.util.Arrays.asList(
                new org.bson.Document("$group", new org.bson.Document("_id", null)
                        .append("totalReviews", new org.bson.Document("$sum", 1))
                        .append("totalReceived", new org.bson.Document("$sum",
                                new org.bson.Document("$cond", java.util.Arrays.asList(
                                        new org.bson.Document("$ne", java.util.Arrays.asList("$paymentReceivedDate", null)),
                                        new org.bson.Document("$ifNull", java.util.Arrays.asList("$refundAmountRupees", "$computedRefund")),
                                        0
                                ))))
                        .append("countReceived", new org.bson.Document("$sum",
                                new org.bson.Document("$cond", java.util.Arrays.asList(new org.bson.Document("$ne", java.util.Arrays.asList("$paymentReceivedDate", null)), 1, 0))))
                        .append("pendingAmount", new org.bson.Document("$sum",
                                new org.bson.Document("$cond", java.util.Arrays.asList(new org.bson.Document("$eq", java.util.Arrays.asList("$paymentReceivedDate", null)), "$computedRefund", 0))))
                        .append("submittedCount", new org.bson.Document("$sum",
                                new org.bson.Document("$cond", java.util.Arrays.asList(new org.bson.Document("$ne", java.util.Arrays.asList("$reviewSubmitDate", null)), 1, 0))))
                ),
                new org.bson.Document("$project", new org.bson.Document("_id", 0)
                        .append("totalReviews", 1)
                        .append("totalPaymentReceived", "$totalReceived")
                        .append("averageRefund", new org.bson.Document("$cond", java.util.Arrays.asList(
                                new org.bson.Document("$gt", java.util.Arrays.asList("$countReceived", 0)),
                                new org.bson.Document("$divide", java.util.Arrays.asList("$totalReceived", "$countReceived")),
                                0
                        )))
                        .append("paymentPendingAmount", "$pendingAmount")
                        .append("reviewsSubmitted", "$submittedCount")
                        .append("reviewsPending", new org.bson.Document("$subtract", java.util.Arrays.asList("$totalReviews", "$submittedCount")))
                )
        ));

        // generic group helper via inline docs
        facet.append("statusCounts", java.util.List.of(
                new org.bson.Document("$group", new org.bson.Document("_id", new org.bson.Document("$ifNull", java.util.List.of("$status", "unknown")))
                        .append("c", new org.bson.Document("$sum", 1)))
        ));
        facet.append("platformCounts", java.util.List.of(
                new org.bson.Document("$group", new org.bson.Document("_id", new org.bson.Document("$ifNull", java.util.List.of("$platformId", "unknown")))
                        .append("c", new org.bson.Document("$sum", 1)))
        ));
        facet.append("dealTypeCounts", java.util.List.of(
                new org.bson.Document("$group", new org.bson.Document("_id", new org.bson.Document("$ifNull", java.util.List.of("$dealType", "unknown")))
                        .append("c", new org.bson.Document("$sum", 1)))
        ));
        facet.append("mediatorCounts", java.util.List.of(
                new org.bson.Document("$group", new org.bson.Document("_id", new org.bson.Document("$ifNull", java.util.List.of("$mediatorId", "unknown")))
                        .append("c", new org.bson.Document("$sum", 1)))
        ));

        facet.append("receivedByPlatform", java.util.List.of(
                new org.bson.Document("$match", new org.bson.Document("paymentReceivedDate", new org.bson.Document("$ne", null))),
                new org.bson.Document("$group", new org.bson.Document("_id", new org.bson.Document("$ifNull", java.util.List.of("$platformId", "unknown")))
                        .append("amt", new org.bson.Document("$sum", new org.bson.Document("$toDouble", new org.bson.Document("$ifNull", java.util.List.of("$refundAmountRupees", "$computedRefund"))))))
        ));
        facet.append("pendingByPlatform", java.util.List.of(
                new org.bson.Document("$match", new org.bson.Document("paymentReceivedDate", null)),
                new org.bson.Document("$group", new org.bson.Document("_id", new org.bson.Document("$ifNull", java.util.List.of("$platformId", "unknown")))
                        .append("amt", new org.bson.Document("$sum", "$computedRefund")))
        ));
        facet.append("receivedByMediator", java.util.List.of(
                new org.bson.Document("$match", new org.bson.Document("paymentReceivedDate", new org.bson.Document("$ne", null))),
                new org.bson.Document("$group", new org.bson.Document("_id", new org.bson.Document("$ifNull", java.util.List.of("$mediatorId", "unknown")))
                        .append("amt", new org.bson.Document("$sum", new org.bson.Document("$toDouble", new org.bson.Document("$ifNull", java.util.List.of("$refundAmountRupees", "$computedRefund"))))))
        ));
        facet.append("pendingByMediator", java.util.List.of(
                new org.bson.Document("$match", new org.bson.Document("paymentReceivedDate", null)),
                new org.bson.Document("$group", new org.bson.Document("_id", new org.bson.Document("$ifNull", java.util.List.of("$mediatorId", "unknown")))
                        .append("amt", new org.bson.Document("$sum", "$computedRefund")))
        ));

        facet.append("overdue", java.util.List.of(
                new org.bson.Document("$match", new org.bson.Document("deliveryDate", new org.bson.Document("$ne", null))),
                new org.bson.Document("$match", new org.bson.Document("deliveryDate", new org.bson.Document("$lt", nowMinus7))),
                new org.bson.Document("$match", new org.bson.Document("completed", false)),
                new org.bson.Document("$count", "count")
        ));

        // aging removed per requirements

        facet.append("avgDurations", java.util.Arrays.asList(
                new org.bson.Document("$project", new org.bson.Document()
                        .append("d1", new org.bson.Document("$cond", java.util.Arrays.asList(
                                new org.bson.Document("$and", java.util.Arrays.asList(new org.bson.Document("$ne", java.util.Arrays.asList("$orderedDate", null)), new org.bson.Document("$ne", java.util.Arrays.asList("$deliveryDate", null)))),
                                new org.bson.Document("$divide", java.util.Arrays.asList(new org.bson.Document("$subtract", java.util.Arrays.asList("$deliveryDate", "$orderedDate")), 86400000)),
                                null)))
                        .append("d2", new org.bson.Document("$cond", java.util.Arrays.asList(
                                new org.bson.Document("$and", java.util.Arrays.asList(new org.bson.Document("$ne", java.util.Arrays.asList("$deliveryDate", null)), new org.bson.Document("$ne", java.util.Arrays.asList("$reviewSubmitDate", null)))),
                                new org.bson.Document("$divide", java.util.Arrays.asList(new org.bson.Document("$subtract", java.util.Arrays.asList("$reviewSubmitDate", "$deliveryDate")), 86400000)),
                                null)))
                        .append("d3", new org.bson.Document("$cond", java.util.Arrays.asList(
                                new org.bson.Document("$and", java.util.Arrays.asList(new org.bson.Document("$ne", java.util.Arrays.asList("$reviewSubmitDate", null)), new org.bson.Document("$ne", java.util.Arrays.asList("$reviewAcceptedDate", null)))),
                                new org.bson.Document("$divide", java.util.Arrays.asList(new org.bson.Document("$subtract", java.util.Arrays.asList("$reviewAcceptedDate", "$reviewSubmitDate")), 86400000)),
                                null)))
                        .append("d4", new org.bson.Document("$cond", java.util.Arrays.asList(
                                new org.bson.Document("$and", java.util.Arrays.asList(new org.bson.Document("$ne", java.util.Arrays.asList("$deliveryDate", null)), new org.bson.Document("$ne", java.util.Arrays.asList("$ratingSubmittedDate", null)))),
                                new org.bson.Document("$divide", java.util.Arrays.asList(new org.bson.Document("$subtract", java.util.Arrays.asList("$ratingSubmittedDate", "$deliveryDate")), 86400000)),
                                null)))
                        .append("d5", new org.bson.Document("$cond", java.util.Arrays.asList(
                                new org.bson.Document("$and", java.util.Arrays.asList(new org.bson.Document("$ne", java.util.Arrays.asList("$reviewSubmitDate", null)), new org.bson.Document("$ne", java.util.Arrays.asList("$refundFormSubmittedDate", null)))),
                                new org.bson.Document("$divide", java.util.Arrays.asList(new org.bson.Document("$subtract", java.util.Arrays.asList("$refundFormSubmittedDate", "$reviewSubmitDate")), 86400000)),
                                null)))
                        .append("d6", new org.bson.Document("$cond", java.util.Arrays.asList(
                                new org.bson.Document("$and", java.util.Arrays.asList(new org.bson.Document("$ne", java.util.Arrays.asList("$ratingSubmittedDate", null)), new org.bson.Document("$ne", java.util.Arrays.asList("$refundFormSubmittedDate", null)))),
                                new org.bson.Document("$divide", java.util.Arrays.asList(new org.bson.Document("$subtract", java.util.Arrays.asList("$refundFormSubmittedDate", "$ratingSubmittedDate")), 86400000)),
                                null)))
                        .append("d7", new org.bson.Document("$cond", java.util.Arrays.asList(
                                new org.bson.Document("$and", java.util.Arrays.asList(new org.bson.Document("$ne", java.util.Arrays.asList("$refundFormSubmittedDate", null)), new org.bson.Document("$ne", java.util.Arrays.asList("$paymentReceivedDate", null)))),
                                new org.bson.Document("$divide", java.util.Arrays.asList(new org.bson.Document("$subtract", java.util.Arrays.asList("$paymentReceivedDate", "$refundFormSubmittedDate")), 86400000)),
                                null)))
                ),
                new org.bson.Document("$group", new org.bson.Document("_id", null)
                        .append("avg1", new org.bson.Document("$avg", "$d1"))
                        .append("avg2", new org.bson.Document("$avg", "$d2"))
                        .append("avg3", new org.bson.Document("$avg", "$d3"))
                        .append("avg4", new org.bson.Document("$avg", "$d4"))
                        .append("avg5", new org.bson.Document("$avg", "$d5"))
                        .append("avg6", new org.bson.Document("$avg", "$d6"))
                        .append("avg7", new org.bson.Document("$avg", "$d7"))
                )
        ));

        ops.add(context -> new org.bson.Document("$facet", facet));

        // Apply date range: if provided and scope==received, use paymentReceivedDate; else use createdAt
        if (from != null || to != null) {
            java.util.Date fromD = null, toD = null;
            if (from != null) fromD = java.util.Date.from(from.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());
            if (to != null) toD = java.util.Date.from(to.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());
            org.bson.Document cond = new org.bson.Document();
            String field = ("received".equalsIgnoreCase(scope)) ? "paymentReceivedDate" : "createdAt";
            org.bson.Document range = new org.bson.Document();
            if (fromD != null) range.append("$gte", fromD);
            if (toD != null) range.append("$lt", toD);
            cond.append(field, range);
            ops.add(context -> new org.bson.Document("$match", cond));
        }

        Aggregation agg = Aggregation.newAggregation(ops);
        org.bson.Document root = mongoTemplate.aggregate(agg, Review.class, org.bson.Document.class)
                .getUniqueMappedResult();
        java.util.Map<String, Object> out = new java.util.HashMap<>();
        if (root == null) return out;

        java.util.List<org.bson.Document> totals = (java.util.List<org.bson.Document>) root.get("totals");
        if (totals != null && !totals.isEmpty()) {
            org.bson.Document t = totals.get(0);
            // Normalize numeric types for the API (avoid Decimal128 leaking to JSON)
            Object tr = t.get("totalReviews");
            Object tpr = t.get("totalPaymentReceived");
            Object ar = t.get("averageRefund");
            Object ppa = t.get("paymentPendingAmount");
            Object rs = t.get("reviewsSubmitted");
            Object rp = t.get("reviewsPending");
            out.put("totalReviews", (tr instanceof Number n) ? n.longValue() : 0L);
            out.put("totalPaymentReceived", (tpr instanceof Number n) ? n.doubleValue() : 0.0);
            out.put("averageRefund", (ar instanceof Number n) ? n.doubleValue() : 0.0);
            out.put("paymentPendingAmount", (ppa instanceof Number n) ? n.doubleValue() : 0.0);
            out.put("reviewsSubmitted", (rs instanceof Number n) ? n.longValue() : 0L);
            out.put("reviewsPending", (rp instanceof Number n) ? n.longValue() : 0L);
        }
        out.put("statusCounts", toCountMap((java.util.List<org.bson.Document>) root.get("statusCounts")));
        out.put("platformCounts", toCountMap((java.util.List<org.bson.Document>) root.get("platformCounts")));
        out.put("dealTypeCounts", toCountMap((java.util.List<org.bson.Document>) root.get("dealTypeCounts")));
        out.put("mediatorCounts", toCountMap((java.util.List<org.bson.Document>) root.get("mediatorCounts")));
        out.put("amountReceivedByPlatform", toAmountMap((java.util.List<org.bson.Document>) root.get("receivedByPlatform"), "amt"));
        out.put("amountPendingByPlatform", toAmountMap((java.util.List<org.bson.Document>) root.get("pendingByPlatform"), "amt"));
        out.put("amountReceivedByMediator", toAmountMap((java.util.List<org.bson.Document>) root.get("receivedByMediator"), "amt"));
        out.put("amountPendingByMediator", toAmountMap((java.util.List<org.bson.Document>) root.get("pendingByMediator"), "amt"));

        java.util.List<org.bson.Document> overdue = (java.util.List<org.bson.Document>) root.get("overdue");
        long ov = 0;
        if (overdue != null && !overdue.isEmpty()) {
            Object v = overdue.get(0).get("count");
            if (v instanceof Number n) ov = n.longValue();
        }
        out.put("overdueSinceDeliveryCount", ov);

        // agingBuckets removed

        // avgStageDurations removed

        // reviewsPending should equal delivered count
        try {
            java.util.Map<String, Long> sc = (java.util.Map<String, Long>) out.get("statusCounts");
            long delivered = sc != null && sc.get("delivered") != null ? sc.get("delivered") : 0L;
            out.put("reviewsPending", delivered);
        } catch (Exception ignore) { }
        return out;
    }

    private static java.util.Map<String, Long> toCountMap(java.util.List<org.bson.Document> rows) {
        java.util.Map<String, Long> m = new java.util.HashMap<>();
        if (rows == null) return m;
        for (org.bson.Document d : rows) {
            String k = String.valueOf(d.get("_id"));
            m.put(k, ((Number) d.get("c")).longValue());
        }
        return m;
    }

    private static java.util.Map<String, java.math.BigDecimal> toAmountMap(java.util.List<org.bson.Document> rows, String field) {
        java.util.Map<String, java.math.BigDecimal> m = new java.util.HashMap<>();
        if (rows == null) return m;
        for (org.bson.Document d : rows) {
            String k = String.valueOf(d.get("_id"));
            Object v = d.get(field);
            java.math.BigDecimal bd;
            if (v instanceof org.bson.types.Decimal128 dec) bd = dec.bigDecimalValue();
            else if (v instanceof Number n) bd = java.math.BigDecimal.valueOf(n.doubleValue());
            else bd = java.math.BigDecimal.ZERO;
            m.put(k, bd);
        }
        return m;
    }

    private static Double toDouble(Object v) {
        if (v == null) return 0.0;
        if (v instanceof Number n) return n.doubleValue();
        return 0.0;
    }

    @Override
    public java.util.Map<String, Object> amountByPlatform() {
        return amountByField("platformId", null, null, null);
    }

    @Override
    public java.util.Map<String, Object> amountByMediator() {
        return amountByField("mediatorId", null, null, null);
    }

    @Override
    public java.util.Map<String, Object> amountByPlatform(String scope, java.time.LocalDate from, java.time.LocalDate to) {
        return amountByField("platformId", scope, from, to);
    }

    @Override
    public java.util.Map<String, Object> amountByMediator(String scope, java.time.LocalDate from, java.time.LocalDate to) {
        return amountByField("mediatorId", scope, from, to);
    }

    private java.util.Map<String, Object> amountByField(String field, String scope, java.time.LocalDate from, java.time.LocalDate to) {
        java.util.List<AggregationOperation> ops = new java.util.ArrayList<>();
        // computedRefund = refundAmountRupees ?? ((amountRupees && lessRupees) ? amountRupees-lessRupees : 0)
        org.bson.Document amountAndLessPresent2 = new org.bson.Document("$and", java.util.Arrays.asList(
                new org.bson.Document("$ne", java.util.Arrays.asList("$amountRupees", null)),
                new org.bson.Document("$ne", java.util.Arrays.asList("$lessRupees", null))
        ));
        org.bson.Document fallbackSubtract2 = new org.bson.Document("$cond",
                java.util.Arrays.asList(
                        amountAndLessPresent2,
                        new org.bson.Document("$subtract", java.util.Arrays.asList("$amountRupees", "$lessRupees")),
                        0
                )
        );
        org.bson.Document computedRefundExpr = new org.bson.Document("$ifNull",
                java.util.Arrays.asList("$refundAmountRupees", fallbackSubtract2)
        );
        ops.add(context -> new org.bson.Document("$addFields", new org.bson.Document("computedRefund", computedRefundExpr)));

        java.util.Date fromD = null, toD = null;
        if (from != null) fromD = java.util.Date.from(from.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());
        if (to != null) toD = java.util.Date.from(to.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());

        org.bson.Document facet = new org.bson.Document();
        // Received facet with optional date window on paymentReceivedDate
        {
            org.bson.Document match = new org.bson.Document("paymentReceivedDate", new org.bson.Document("$ne", null));
            if (fromD != null || toD != null) {
                org.bson.Document range = new org.bson.Document();
                if (fromD != null) range.append("$gte", fromD);
                if (toD != null) range.append("$lt", toD);
                match.append("paymentReceivedDate", new org.bson.Document("$ne", null).append("$gte", range.get("$gte")).append("$lt", range.get("$lt")));
            }
            facet.append("received", java.util.List.of(
                    new org.bson.Document("$match", match),
                    new org.bson.Document("$group", new org.bson.Document("_id", new org.bson.Document("$ifNull", java.util.List.of("$" + field, "unknown")))
                            .append("amt", new org.bson.Document("$sum", new org.bson.Document("$ifNull", java.util.List.of("$refundAmountRupees", "$computedRefund")))))
            ));
        }
        // Pending facet with optional date window on createdAt
        {
            org.bson.Document match = new org.bson.Document("paymentReceivedDate", null);
            if (fromD != null || toD != null) {
                org.bson.Document range = new org.bson.Document();
                if (fromD != null) range.append("$gte", fromD);
                if (toD != null) range.append("$lt", toD);
                match.append("createdAt", range);
            }
            facet.append("pending", java.util.List.of(
                    new org.bson.Document("$match", match),
                    new org.bson.Document("$group", new org.bson.Document("_id", new org.bson.Document("$ifNull", java.util.List.of("$" + field, "unknown")))
                            .append("amt", new org.bson.Document("$sum", "$computedRefund")))
            ));
        }

        ops.add(context -> new org.bson.Document("$facet", facet));
        Aggregation agg = Aggregation.newAggregation(ops);
        org.bson.Document root = mongoTemplate.aggregate(agg, Review.class, org.bson.Document.class)
                .getUniqueMappedResult();
        if (root == null) {
            java.util.Map<String, Object> empty = new java.util.HashMap<>();
            empty.put("amountReceived", java.util.Collections.emptyMap());
            empty.put("amountPending", java.util.Collections.emptyMap());
            return empty;
        }
        java.util.Map<String, Object> out = new java.util.HashMap<>();
        out.put("amountReceived", toAmountMap((java.util.List<org.bson.Document>) root.get("received"), "amt"));
        out.put("amountPending", toAmountMap((java.util.List<org.bson.Document>) root.get("pending"), "amt"));
        return out;
    }
}
