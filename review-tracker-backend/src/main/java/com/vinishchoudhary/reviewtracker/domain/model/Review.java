package com.vinishchoudhary.reviewtracker.domain.model;

import lombok.*;
import org.springframework.data.annotation.*;
import org.springframework.data.annotation.Version;
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
    private String status; // computed current status label
    @Indexed
    private String platformId;
    @Indexed
    private String mediatorId;

    @Indexed
    private LocalDate orderedDate;
    @Indexed
    private LocalDate deliveryDate;
    @Indexed
    private LocalDate reviewSubmitDate;
    @Indexed
    private LocalDate reviewAcceptedDate;
    @Indexed
    private LocalDate ratingSubmittedDate;
    @Indexed
    private LocalDate refundFormSubmittedDate;
    @Indexed
    private LocalDate paymentReceivedDate;

    private String refundFormUrl;
    private String imageUrl;

    private BigDecimal amountRupees;
    private BigDecimal lessRupees;
    private BigDecimal refundAmountRupees;

    @CreatedDate
    @Indexed
    private java.time.Instant createdAt;
    @LastModifiedDate
    private java.time.Instant updatedAt;

    @Version
    private Long version;
}
