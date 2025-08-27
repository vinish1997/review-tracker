package com.vinishchoudhary.reviewtracker.domain.validation;

import com.vinishchoudhary.reviewtracker.api.error.ValidationException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class MoneyValidator {
    public BigDecimal nonNegative(BigDecimal val, String field) {
        if (val == null) return BigDecimal.ZERO;
        if (val.signum() < 0) throw new ValidationException(field + " must be >= 0");
        return val.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal refund(BigDecimal amount, BigDecimal less) {
        var a = nonNegative(amount, "amountRupees");
        var l = nonNegative(less, "lessRupees");
        if (l.compareTo(a) > 0) throw new ValidationException("lessRupees cannot exceed amountRupees");
        return a.subtract(l).setScale(2, RoundingMode.HALF_UP);
    }
}
