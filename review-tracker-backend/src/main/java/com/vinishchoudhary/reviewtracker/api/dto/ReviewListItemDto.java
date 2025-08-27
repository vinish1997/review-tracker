package com.vinishchoudhary.reviewtracker.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewListItemDto {
    private String id;
    private String orderId;
    private String productName;
    private String statusId;
    private String statusName;
    private String platformId;
    private String platformName;
    private BigDecimal amountRupees;
    private BigDecimal lessRupees;
    private BigDecimal refundAmountRupees;
    private String mediatorId;
    private String mediatorName;
    private String mediatorWaLink;
    private LocalDate orderedDate;
    private LocalDate deliveryDate;
    private LocalDate reviewSubmitDate;
    private LocalDate refundFormSubmittedDate;
    private LocalDate paymentReceivedDate;
    private String orderLink;
}

