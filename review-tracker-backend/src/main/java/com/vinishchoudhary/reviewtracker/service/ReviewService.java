package com.vinishchoudhary.reviewtracker.service;

import com.vinishchoudhary.reviewtracker.domain.model.Review;
import com.vinishchoudhary.reviewtracker.domain.model.ReviewHistory;
import com.vinishchoudhary.reviewtracker.repository.ReviewRepository;
import com.vinishchoudhary.reviewtracker.repository.ReviewSearchCriteria;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepo;
    private final ReviewHistoryService historyService;
    private final com.vinishchoudhary.reviewtracker.domain.validation.DateChainValidator dateValidator;

    public List<Review> getAllReviews() {
        return reviewRepo.findAll();
    }

    // ---------- CRUD ----------
    public Review createReview(Review r) {
        // Order ID uniqueness
        if (r.getOrderId() != null && reviewRepo.existsByOrderId(r.getOrderId())) {
            throw new com.vinishchoudhary.reviewtracker.api.error.ValidationException("Order ID must be unique");
        }
        if (r.getRefundAmountRupees() == null && r.getAmountRupees() != null && r.getLessRupees() != null) {
            r.setRefundAmountRupees(r.getAmountRupees().subtract(r.getLessRupees()));
        }
        dateValidator.validate(r);
        r.setStatus(computeStatus(r));
        Review saved = reviewRepo.save(r);
        historyService.logChange(saved.getId(), "CREATE", "Created review", null);
        return saved;
    }

    public Review updateReview(String id, Review updated) {
        Review existing = reviewRepo.findById(id).orElseThrow();
        List<ReviewHistory.Change> changes = new ArrayList<>();

        // ensure optimistic locking by applying client version
        existing.setVersion(updated.getVersion());

        // Order ID uniqueness on change
        if (updated.getOrderId() != null && !Objects.equals(existing.getOrderId(), updated.getOrderId())) {
            if (reviewRepo.existsByOrderId(updated.getOrderId())) {
                throw new com.vinishchoudhary.reviewtracker.api.error.ValidationException("Order ID must be unique");
            }
        }

        if (!Objects.equals(existing.getProductName(), updated.getProductName())) {
            changes.add(new ReviewHistory.Change("productName", existing.getProductName(), updated.getProductName()));
            existing.setProductName(updated.getProductName());
        }
        existing.setOrderId(updated.getOrderId());
        existing.setOrderLink(updated.getOrderLink());
        existing.setPlatformId(updated.getPlatformId());
        existing.setDealType(updated.getDealType());
        existing.setMediatorId(updated.getMediatorId());
        existing.setAmountRupees(updated.getAmountRupees());
        existing.setLessRupees(updated.getLessRupees());
        if (updated.getAmountRupees() != null && updated.getLessRupees() != null) {
            existing.setRefundAmountRupees(
                    updated.getAmountRupees().subtract(updated.getLessRupees())
            );
        }
        existing.setOrderedDate(updated.getOrderedDate());
        existing.setDeliveryDate(updated.getDeliveryDate());
        existing.setReviewSubmitDate(updated.getReviewSubmitDate());
        existing.setReviewAcceptedDate(updated.getReviewAcceptedDate());
        existing.setRatingSubmittedDate(updated.getRatingSubmittedDate());
        existing.setRefundFormSubmittedDate(updated.getRefundFormSubmittedDate());
        existing.setPaymentReceivedDate(updated.getPaymentReceivedDate());
        dateValidator.validate(existing);
        existing.setStatus(computeStatus(existing));

        Review saved = reviewRepo.save(existing);
        historyService.logChange(saved.getId(), "UPDATE", "Updated review", changes);
        return saved;
    }

    public void deleteReview(String id) {
        reviewRepo.deleteById(id);
        historyService.logChange(id, "DELETE", "Deleted review", null);
    }

    public Page<Review> searchReviews(ReviewSearchCriteria criteria, Pageable pageable) {
        return reviewRepo.searchReviews(criteria, pageable);
    }

    public Map<String, Object> aggregates(ReviewSearchCriteria criteria) {
        return reviewRepo.aggregatedTotals(criteria);
    }

    // ---------- Advance ----------
    public Review advanceNext(String id, LocalDate date) {
        Review r = reviewRepo.findById(id).orElseThrow();
        LocalDate when = date != null ? date : LocalDate.now();

        String nextField = nextFieldFor(r);
        if (nextField == null) {
            return r; // nothing to do
        }

        // Set next field and clear subsequent ones in the flow for consistency
        setField(r, nextField, when);
        clearAfter(r, nextField);

        r.setStatus(computeStatus(r));
        Review saved = reviewRepo.save(r);
        historyService.logChange(saved.getId(), "ADVANCE", "Set " + nextField + " to " + when, List.of(new ReviewHistory.Change(nextField, null, when.toString())));
        return saved;
    }

    public List<Review> bulkAdvanceNext(List<String> ids, LocalDate date) {
        List<Review> out = new ArrayList<>();
        for (String id : ids) {
            out.add(advanceNext(id, date));
        }
        return out;
    }

    private static void setField(Review r, String field, LocalDate value) {
        switch (field) {
            case "orderedDate": r.setOrderedDate(value); break;
            case "deliveryDate": r.setDeliveryDate(value); break;
            case "reviewSubmitDate": r.setReviewSubmitDate(value); break;
            case "reviewAcceptedDate": r.setReviewAcceptedDate(value); break;
            case "ratingSubmittedDate": r.setRatingSubmittedDate(value); break;
            case "refundFormSubmittedDate": r.setRefundFormSubmittedDate(value); break;
            case "paymentReceivedDate": r.setPaymentReceivedDate(value); break;
            default: /* ignore */
        }
    }

    private static void clearAfter(Review r, String fieldInclusive) {
        List<String> seq = sequenceFor(r.getDealType());
        int idx = seq.indexOf(fieldInclusive);
        if (idx < 0) return;
        for (int i = idx + 1; i < seq.size(); i++) {
            String f = seq.get(i);
            setField(r, f, null);
        }
    }

    private static String nextFieldFor(Review r) {
        for (String f : sequenceFor(r.getDealType())) {
            LocalDate v = getField(r, f);
            if (v == null) return f;
        }
        return null;
    }

    private static List<String> sequenceFor(String dealType) {
        List<String> base = List.of("orderedDate","deliveryDate");
        String dt = dealType == null ? "REVIEW_SUBMISSION" : dealType;
        switch (dt) {
            case "REVIEW_PUBLISHED":
                return List.of("orderedDate","deliveryDate","reviewSubmitDate","reviewAcceptedDate","refundFormSubmittedDate","paymentReceivedDate");
            case "RATING_ONLY":
                return List.of("orderedDate","deliveryDate","ratingSubmittedDate","refundFormSubmittedDate","paymentReceivedDate");
            default:
                return List.of("orderedDate","deliveryDate","reviewSubmitDate","refundFormSubmittedDate","paymentReceivedDate");
        }
    }

    private static LocalDate getField(Review r, String field) {
        switch (field) {
            case "orderedDate": return r.getOrderedDate();
            case "deliveryDate": return r.getDeliveryDate();
            case "reviewSubmitDate": return r.getReviewSubmitDate();
            case "reviewAcceptedDate": return r.getReviewAcceptedDate();
            case "ratingSubmittedDate": return r.getRatingSubmittedDate();
            case "refundFormSubmittedDate": return r.getRefundFormSubmittedDate();
            case "paymentReceivedDate": return r.getPaymentReceivedDate();
            default: return null;
        }
    }

    public Optional<Review> getReview(String id) {
        return reviewRepo.findById(id);
    }

    // ---------- Clone ----------
    public Review cloneReview(String sourceId) {
        Review source = reviewRepo.findById(sourceId).orElseThrow();
        Review copy = Review.builder()
                .orderId(source.getOrderId() + "-clone")
                .orderLink(source.getOrderLink())
                .productName(source.getProductName())
                .dealType(source.getDealType())
                .platformId(source.getPlatformId())
                .mediatorId(source.getMediatorId())
                .amountRupees(source.getAmountRupees())
                .lessRupees(source.getLessRupees())
                .refundAmountRupees(source.getRefundAmountRupees())
                .orderedDate(source.getOrderedDate())
                .deliveryDate(source.getDeliveryDate())
                .reviewSubmitDate(source.getReviewSubmitDate())
                .reviewAcceptedDate(source.getReviewAcceptedDate())
                .ratingSubmittedDate(source.getRatingSubmittedDate())
                .refundFormSubmittedDate(source.getRefundFormSubmittedDate())
                .paymentReceivedDate(source.getPaymentReceivedDate())
                .build();
        copy.setStatus(computeStatus(copy));
        Review saved = reviewRepo.save(copy);
        historyService.logChange(saved.getId(), "CLONE", "Cloned from " + sourceId, null);
        return saved;
    }

    // ---------- Copy ----------
    public Review copyFields(String sourceId, String targetId, List<String> fields) {
        Review src = reviewRepo.findById(sourceId).orElseThrow();
        Review tgt = reviewRepo.findById(targetId).orElseThrow();
        List<ReviewHistory.Change> changes = new ArrayList<>();

        for (String f : fields) {
            switch (f) {
                case "productName": tgt.setProductName(src.getProductName()); break;
                case "orderLink": tgt.setOrderLink(src.getOrderLink()); break;
                case "platformId": tgt.setPlatformId(src.getPlatformId()); break;
                case "dealType": tgt.setDealType(src.getDealType()); break;
                case "mediatorId": tgt.setMediatorId(src.getMediatorId()); break;
                case "amountRupees": tgt.setAmountRupees(src.getAmountRupees()); break;
                case "lessRupees": tgt.setLessRupees(src.getLessRupees()); break;
                case "dates":
                    tgt.setOrderedDate(src.getOrderedDate());
                    tgt.setDeliveryDate(src.getDeliveryDate());
                    tgt.setReviewSubmitDate(src.getReviewSubmitDate());
                    tgt.setReviewAcceptedDate(src.getReviewAcceptedDate());
                    tgt.setRatingSubmittedDate(src.getRatingSubmittedDate());
                    tgt.setRefundFormSubmittedDate(src.getRefundFormSubmittedDate());
                    tgt.setPaymentReceivedDate(src.getPaymentReceivedDate());
                    break;
            }
            changes.add(new ReviewHistory.Change(f, null, "copied from " + sourceId));
        }

        tgt.setStatus(computeStatus(tgt));
        Review saved = reviewRepo.save(tgt);
        historyService.logChange(saved.getId(), "COPY", "Copied fields from " + sourceId, changes);
        return saved;
    }

    // ---------- Bulk Ops ----------
    public List<Review> bulkUpdate(List<String> ids, Map<String, Object> updates) {
        List<Review> reviews = reviewRepo.findAllById(ids);
        for (Review r : reviews) {
            if (updates.containsKey("platformId")) r.setPlatformId((String) updates.get("platformId"));
            if (updates.containsKey("mediatorId")) r.setMediatorId((String) updates.get("mediatorId"));
            if (updates.containsKey("orderLink")) r.setOrderLink((String) updates.get("orderLink"));
            if (updates.containsKey("dealType")) r.setDealType((String) updates.get("dealType"));
            if (updates.containsKey("orderedDate")) r.setOrderedDate(LocalDate.parse((String) updates.get("orderedDate")));
            if (updates.containsKey("deliveryDate")) r.setDeliveryDate(LocalDate.parse((String) updates.get("deliveryDate")));
            if (updates.containsKey("reviewSubmitDate")) r.setReviewSubmitDate(LocalDate.parse((String) updates.get("reviewSubmitDate")));
            if (updates.containsKey("reviewAcceptedDate")) r.setReviewAcceptedDate(LocalDate.parse((String) updates.get("reviewAcceptedDate")));
            if (updates.containsKey("ratingSubmittedDate")) r.setRatingSubmittedDate(LocalDate.parse((String) updates.get("ratingSubmittedDate")));
            if (updates.containsKey("refundFormSubmittedDate")) r.setRefundFormSubmittedDate(LocalDate.parse((String) updates.get("refundFormSubmittedDate")));
            if (updates.containsKey("paymentReceivedDate")) r.setPaymentReceivedDate(LocalDate.parse((String) updates.get("paymentReceivedDate")));
            dateValidator.validate(r);
            r.setStatus(computeStatus(r));
        }
        return reviewRepo.saveAll(reviews);
    }

    public void bulkDelete(List<String> ids) {
        reviewRepo.deleteAllById(ids);
        ids.forEach(id -> historyService.logChange(id, "DELETE", "Bulk delete", null));
    }

    // ---------- CSV Export ----------
    public String exportCsv() {
        List<Review> reviews = reviewRepo.findAll();
        String[] header = {
                "orderId","orderLink","productName","dealType","platformId","mediatorId",
                "amountRupees","lessRupees","refundAmountRupees",
                "orderedDate","deliveryDate","reviewSubmitDate","reviewAcceptedDate","ratingSubmittedDate","refundFormSubmittedDate","paymentReceivedDate",
                "status"
        };
        StringBuilder sb = new StringBuilder(String.join(",", header)).append("\n");
        for (Review r : reviews) {
            List<String> row = new ArrayList<>();
            row.add(nullToEmpty(r.getOrderId()));
            row.add(nullToEmpty(r.getOrderLink()));
            row.add(nullToEmpty(r.getProductName()));
            row.add(nullToEmpty(r.getDealType()));
            row.add(nullToEmpty(r.getPlatformId()));
            row.add(nullToEmpty(r.getMediatorId()));
            row.add(r.getAmountRupees() == null ? "" : r.getAmountRupees().toPlainString());
            row.add(r.getLessRupees() == null ? "" : r.getLessRupees().toPlainString());
            row.add(r.getRefundAmountRupees() == null ? "" : r.getRefundAmountRupees().toPlainString());
            row.add(r.getOrderedDate() == null ? "" : r.getOrderedDate().toString());
            row.add(r.getDeliveryDate() == null ? "" : r.getDeliveryDate().toString());
            row.add(r.getReviewSubmitDate() == null ? "" : r.getReviewSubmitDate().toString());
            row.add(r.getReviewAcceptedDate() == null ? "" : r.getReviewAcceptedDate().toString());
            row.add(r.getRatingSubmittedDate() == null ? "" : r.getRatingSubmittedDate().toString());
            row.add(r.getRefundFormSubmittedDate() == null ? "" : r.getRefundFormSubmittedDate().toString());
            row.add(r.getPaymentReceivedDate() == null ? "" : r.getPaymentReceivedDate().toString());
            row.add(nullToEmpty(r.getStatus()));
            sb.append(toCsvRow(row)).append("\n");
        }
        return sb.toString();
    }

    private static String nullToEmpty(String s) { return s == null ? "" : s; }
    private static String toCsvRow(List<String> fields) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < fields.size(); i++) {
            if (i > 0) b.append(',');
            String v = fields.get(i);
            if (v == null) v = "";
            boolean needsQuote = v.contains(",") || v.contains("\"") || v.contains("\n");
            v = v.replace("\"", "\"\"");
            if (needsQuote) b.append('"').append(v).append('"'); else b.append(v);
        }
        return b.toString();
    }

    // ---------- CSV Import ----------
    public List<Review> importCsv(MultipartFile file) throws IOException {
        List<Review> reviews = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = br.readLine();
            if (headerLine == null) return List.of();
            List<String> header = parseCsvLine(headerLine);
            Map<String,Integer> idx = new HashMap<>();
            for (int i=0;i<header.size();i++) idx.put(header.get(i).trim(), i);

            String[] required = {"orderId","orderLink","productName","dealType","platformId","mediatorId","amountRupees","lessRupees"};
            for (String req : required) if (!idx.containsKey(req))
                throw new com.vinishchoudhary.reviewtracker.api.error.ValidationException("Missing required column: "+req);

            String line;
            while ((line = br.readLine()) != null) {
                if (line.isBlank()) continue;
                List<String> parts = parseCsvLine(line);
                java.util.function.Function<String,String> get = (k) -> {
                    Integer i = idx.get(k);
                    return (i == null || i >= parts.size()) ? null : parts.get(i);
                };
                String orderId = get.apply("orderId");
                if (orderId == null || orderId.isBlank())
                    throw new com.vinishchoudhary.reviewtracker.api.error.ValidationException("orderId is required in CSV");
                if (reviewRepo.existsByOrderId(orderId))
                    throw new com.vinishchoudhary.reviewtracker.api.error.ValidationException("Duplicate orderId in CSV or DB: "+orderId);

                Review r = Review.builder()
                        .orderId(orderId)
                        .orderLink(get.apply("orderLink"))
                        .productName(get.apply("productName"))
                        .dealType(get.apply("dealType"))
                        .platformId(get.apply("platformId"))
                        .mediatorId(get.apply("mediatorId"))
                        .amountRupees(parseBig(get.apply("amountRupees")))
                        .lessRupees(parseBig(get.apply("lessRupees")))
                        .refundAmountRupees(parseBig(get.apply("refundAmountRupees")))
                        .orderedDate(parseDate(get.apply("orderedDate")))
                        .deliveryDate(parseDate(get.apply("deliveryDate")))
                        .reviewSubmitDate(parseDate(get.apply("reviewSubmitDate")))
                        .reviewAcceptedDate(parseDate(get.apply("reviewAcceptedDate")))
                        .ratingSubmittedDate(parseDate(get.apply("ratingSubmittedDate")))
                        .refundFormSubmittedDate(parseDate(get.apply("refundFormSubmittedDate")))
                        .paymentReceivedDate(parseDate(get.apply("paymentReceivedDate")))
                        .build();

                // Compute refund if not provided
                if (r.getRefundAmountRupees() == null && r.getAmountRupees() != null && r.getLessRupees() != null) {
                    r.setRefundAmountRupees(r.getAmountRupees().subtract(r.getLessRupees()));
                }
                // Compute status
                r.setStatus(computeStatus(r));
                reviews.add(r);
            }
        }
        return reviewRepo.saveAll(reviews);
    }

    private static java.util.List<String> parseCsvLine(String line) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQ = false;
        for (int i=0;i<line.length();i++) {
            char ch = line.charAt(i);
            if (inQ) {
                if (ch == '"') {
                    if (i+1 < line.length() && line.charAt(i+1) == '"') { cur.append('"'); i++; }
                    else inQ = false;
                } else cur.append(ch);
            } else {
                if (ch == ',') { out.add(cur.toString()); cur.setLength(0); }
                else if (ch == '"') inQ = true;
                else cur.append(ch);
            }
        }
        out.add(cur.toString());
        return out;
    }

    private static java.math.BigDecimal parseBig(String s) {
        if (s == null || s.isBlank()) return null;
        try { return new BigDecimal(s.trim()); } catch (Exception e) { return null; }
    }
    private static java.time.LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try { return java.time.LocalDate.parse(s.trim()); } catch (Exception e) { return null; }
    }

    // ---------- Dashboard ----------
    public Map<String, Object> dashboard() {
        return reviewRepo.aggregatedDashboard();
    }

    public Map<String, Object> amountsByPlatform() {
        Map<String, Object> r = reviewRepo.amountByPlatform();
        // Normalize keys to match previous dashboard shape when needed
        Map<String, Object> out = new HashMap<>();
        out.put("amountReceivedByPlatform", r.get("amountReceived"));
        out.put("amountPendingByPlatform", r.get("amountPending"));
        return out;
    }

    public Map<String, Object> amountsByMediator() {
        Map<String, Object> r = reviewRepo.amountByMediator();
        Map<String, Object> out = new HashMap<>();
        out.put("amountReceivedByMediator", r.get("amountReceived"));
        out.put("amountPendingByMediator", r.get("amountPending"));
        return out;
    }

    private static long diffDays(java.time.LocalDate from, java.time.LocalDate to) {
        return java.time.temporal.ChronoUnit.DAYS.between(from, to);
    }

    private static java.time.LocalDate previousDateForNext(Review r, String nextField) {
        java.util.List<String> seq = sequenceFor(r.getDealType());
        int idx = seq.indexOf(nextField);
        if (idx <= 0) return null;
        String prev = seq.get(idx - 1);
        return getField(r, prev);
    }

    private static Double average(java.util.List<Long> values) {
        if (values == null || values.isEmpty()) return 0.0;
        return values.stream().mapToLong(Long::longValue).average().orElse(0.0);
    }

    private String computeStatus(Review r) {
        if (r.getPaymentReceivedDate() != null) return "payment received";
        if (r.getRefundFormSubmittedDate() != null) return "refund form submitted";
        String deal = r.getDealType() == null ? "REVIEW_SUBMISSION" : r.getDealType();
        switch (deal) {
            case "REVIEW_PUBLISHED":
                if (r.getReviewAcceptedDate() != null) return "review accepted";
                if (r.getReviewSubmitDate() != null) return "review submitted";
                break;
            case "RATING_ONLY":
                if (r.getRatingSubmittedDate() != null) return "rating submitted";
                break;
            default: // REVIEW_SUBMISSION
                if (r.getReviewSubmitDate() != null) return "review submitted";
        }
        if (r.getDeliveryDate() != null) return "delivered";
        if (r.getOrderedDate() != null) return "ordered";
        return "ordered";
    }
}
