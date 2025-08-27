package com.vinishchoudhary.reviewtracker.repository;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSearchCriteria {
    private String platformId;
    private String statusId;
    private String mediatorId;
    private String productNameContains;
}

