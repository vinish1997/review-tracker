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

    public List<Review> getAllReviews() {
        return reviewRepo.findAll();
    }

    // ---------- CRUD ----------
    public Review createReview(Review r) {
        if (r.getRefundAmountRupees() == null && r.getAmountRupees() != null && r.getLessRupees() != null) {
            r.setRefundAmountRupees(r.getAmountRupees().subtract(r.getLessRupees()));
        }
        r.setStatus(computeStatus(r));
        Review saved = reviewRepo.save(r);
        historyService.logChange(saved.getId(), "CREATE", "Created review", null);
        return saved;
    }

    public Review updateReview(String id, Review updated) {
        Review existing = reviewRepo.findById(id).orElseThrow();
        List<ReviewHistory.Change> changes = new ArrayList<>();

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
        existing.setRefundAmountRupees(
                updated.getAmountRupees().subtract(updated.getLessRupees())
        );
        existing.setOrderedDate(updated.getOrderedDate());
        existing.setDeliveryDate(updated.getDeliveryDate());
        existing.setReviewSubmitDate(updated.getReviewSubmitDate());
        existing.setReviewAcceptedDate(updated.getReviewAcceptedDate());
        existing.setRatingSubmittedDate(updated.getRatingSubmittedDate());
        existing.setRefundFormSubmittedDate(updated.getRefundFormSubmittedDate());
        existing.setPaymentReceivedDate(updated.getPaymentReceivedDate());
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
        StringBuilder sb = new StringBuilder("orderId,productName,amount,less,refund\n");
        for (Review r : reviews) {
            sb.append(r.getOrderId()).append(",")
                    .append(r.getProductName()).append(",")
                    .append(r.getAmountRupees()).append(",")
                    .append(r.getLessRupees()).append(",")
                    .append(r.getRefundAmountRupees()).append("\n");
        }
        return sb.toString();
    }

    // ---------- CSV Import ----------
    public List<Review> importCsv(MultipartFile file) throws IOException {
        List<Review> reviews = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            br.readLine(); // skip header
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(",");
                Review r = Review.builder()
                        .orderId(parts[0])
                        .productName(parts[1])
                        .amountRupees(new BigDecimal(parts[2]))
                        .lessRupees(new BigDecimal(parts[3]))
                        .refundAmountRupees(new BigDecimal(parts[2]).subtract(new BigDecimal(parts[3])))
                        .build();
                reviews.add(r);
            }
        }
        return reviewRepo.saveAll(reviews);
    }

    // ---------- Dashboard ----------
    public Map<String, Object> dashboard() {
        List<Review> all = reviewRepo.findAll();
        BigDecimal totalReceived = all.stream()
                .map(Review::getRefundAmountRupees)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long submitted = all.stream().filter(r -> r.getReviewSubmitDate() != null).count();
        long pending = all.size() - submitted;

        Map<String, Object> result = new HashMap<>();
        result.put("totalReviews", all.size());
        result.put("totalPaymentReceived", totalReceived);
        result.put("reviewsSubmitted", submitted);
        result.put("reviewsPending", pending);
        Map<String, Long> statusCounts = all.stream().collect(Collectors.groupingBy(r -> Optional.ofNullable(r.getStatus()).orElse("unknown"), Collectors.counting()));
        Map<String, Long> platformCounts = all.stream().collect(Collectors.groupingBy(r -> Optional.ofNullable(r.getPlatformId()).orElse("unknown"), Collectors.counting()));
        Map<String, Long> dealTypeCounts = all.stream().collect(Collectors.groupingBy(r -> Optional.ofNullable(r.getDealType()).orElse("unknown"), Collectors.counting()));
        result.put("statusCounts", statusCounts);
        result.put("platformCounts", platformCounts);
        result.put("dealTypeCounts", dealTypeCounts);
        return result;
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
