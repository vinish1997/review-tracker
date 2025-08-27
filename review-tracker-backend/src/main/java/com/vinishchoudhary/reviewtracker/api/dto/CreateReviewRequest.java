package com.vinishchoudhary.reviewtracker.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateReviewRequest {
    @NotBlank
    @Pattern(regexp = "^[A-Za-z0-9-_]+$")
    private String orderId;

    @NotBlank @URL
    private String orderLink;

    @NotBlank
    private String productName;

    @NotBlank
    private String platformId;

    @NotBlank
    private String mediatorId;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal amountRupees;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal lessRupees;

    @NotNull
    private LocalDate orderedDate;
}

