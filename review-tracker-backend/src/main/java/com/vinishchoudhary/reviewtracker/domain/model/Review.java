package com.vinishchoudhary.reviewtracker.domain.model;

import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.mapping.*;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("reviews")
public class Review {
    @Id
    private String id;

    @Indexed(unique = true)
    private String orderId;
    private String orderLink;
    private String productName;
    private String dealType; // REVIEW_PUBLISHED | REVIEW_SUBMISSION | RATING_ONLY
    private String status;   // computed current status label
    private String platformId;
    private String mediatorId;

    private LocalDate orderedDate;
    private LocalDate deliveryDate;
    private LocalDate reviewSubmitDate;
    private LocalDate reviewAcceptedDate;
    private LocalDate ratingSubmittedDate;
    private LocalDate refundFormSubmittedDate;
    private LocalDate paymentReceivedDate;

    private BigDecimal amountRupees;
    private BigDecimal lessRupees;
    private BigDecimal refundAmountRupees;

    @CreatedDate
    private java.time.Instant createdAt;
    @LastModifiedDate
    private java.time.Instant updatedAt;
}
