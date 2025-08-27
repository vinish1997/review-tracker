package com.vinishchoudhary.reviewtracker.service;

import com.vinishchoudhary.reviewtracker.domain.model.ReviewHistory;
import com.vinishchoudhary.reviewtracker.repository.ReviewHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewHistoryService {
    private final ReviewHistoryRepository historyRepo;

    public void logChange(String reviewId, String type, String note, List<ReviewHistory.Change> changes) {
        ReviewHistory h = ReviewHistory.builder()
                .reviewId(reviewId)
                .type(type)
                .at(Instant.now())
                .note(note)
                .changes(changes)
                .build();
        historyRepo.save(h);
    }

    public List<ReviewHistory> getHistory(String reviewId) {
        return historyRepo.findByReviewIdOrderByAtAsc(reviewId);
    }
}
