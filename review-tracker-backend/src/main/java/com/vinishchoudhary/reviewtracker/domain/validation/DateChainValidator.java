package com.vinishchoudhary.reviewtracker.domain.validation;

import com.vinishchoudhary.reviewtracker.api.error.ValidationException;
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

    private void check(String name, LocalDate actual, LocalDate min, String minName) {
        if (actual != null && min != null && actual.isBefore(min)) {
            throw new ValidationException(name + " must be >= " + minName);
        }
    }
}

