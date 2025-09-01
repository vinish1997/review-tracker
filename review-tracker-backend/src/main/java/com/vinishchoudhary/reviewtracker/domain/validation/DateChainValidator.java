package com.vinishchoudhary.reviewtracker.domain.validation;

import com.vinishchoudhary.reviewtracker.api.error.ValidationException;
import com.vinishchoudhary.reviewtracker.domain.model.Review;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DateChainValidator {
    public void validateChain(LocalDate ordered, LocalDate delivery, LocalDate review,
                              LocalDate refundForm, LocalDate payment) {
        check("deliveryDate", delivery, ordered, "orderedDate");
        check("reviewSubmitDate", review, delivery, "deliveryDate");
        check("refundFormSubmittedDate", refundForm, review, "reviewSubmitDate");
        check("paymentReceivedDate", payment, refundForm, "refundFormSubmittedDate");
    }

    public void validate(Review r) {
        LocalDate ordered = r.getOrderedDate();
        LocalDate delivery = r.getDeliveryDate();
        // Always: delivery >= ordered
        check("deliveryDate", delivery, ordered, "orderedDate");

        String dt = r.getDealType() == null ? "REVIEW_SUBMISSION" : r.getDealType();
        switch (dt) {
            case "REVIEW_PUBLISHED":
                check("reviewSubmitDate", r.getReviewSubmitDate(), delivery, "deliveryDate");
                check("reviewAcceptedDate", r.getReviewAcceptedDate(), r.getReviewSubmitDate(), "reviewSubmitDate");
                check("refundFormSubmittedDate", r.getRefundFormSubmittedDate(), r.getReviewAcceptedDate(), "reviewAcceptedDate");
                check("paymentReceivedDate", r.getPaymentReceivedDate(), r.getRefundFormSubmittedDate(), "refundFormSubmittedDate");
                break;
            case "RATING_ONLY":
                check("ratingSubmittedDate", r.getRatingSubmittedDate(), delivery, "deliveryDate");
                check("refundFormSubmittedDate", r.getRefundFormSubmittedDate(), r.getRatingSubmittedDate(), "ratingSubmittedDate");
                check("paymentReceivedDate", r.getPaymentReceivedDate(), r.getRefundFormSubmittedDate(), "refundFormSubmittedDate");
                break;
            default: // REVIEW_SUBMISSION
                check("reviewSubmitDate", r.getReviewSubmitDate(), delivery, "deliveryDate");
                check("refundFormSubmittedDate", r.getRefundFormSubmittedDate(), r.getReviewSubmitDate(), "reviewSubmitDate");
                check("paymentReceivedDate", r.getPaymentReceivedDate(), r.getRefundFormSubmittedDate(), "refundFormSubmittedDate");
        }
    }

    private void check(String name, LocalDate actual, LocalDate min, String minName) {
        if (actual != null && min != null && actual.isBefore(min)) {
            throw new ValidationException(name + " must be >= " + minName);
        }
    }
}
