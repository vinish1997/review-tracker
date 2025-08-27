package com.vinishchoudhary.reviewtracker.repository;

import com.vinishchoudhary.reviewtracker.domain.model.ReviewHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReviewHistoryRepository extends MongoRepository<ReviewHistory, String> {
    List<ReviewHistory> findByReviewIdOrderByAtAsc(String reviewId);
}