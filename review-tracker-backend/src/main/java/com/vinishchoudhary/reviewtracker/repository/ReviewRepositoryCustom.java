package com.vinishchoudhary.reviewtracker.repository;

import com.vinishchoudhary.reviewtracker.domain.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewRepositoryCustom {
    Page<Review> searchReviews(ReviewSearchCriteria criteria, Pageable pageable);
    java.util.Map<String, Object> aggregatedTotals(ReviewSearchCriteria criteria);
    java.util.Map<String, Object> aggregatedDashboard();
    java.util.Map<String, Object> amountByPlatform();
    java.util.Map<String, Object> amountByMediator();
}
