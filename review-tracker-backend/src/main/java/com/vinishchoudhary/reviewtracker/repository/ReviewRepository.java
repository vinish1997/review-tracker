package com.vinishchoudhary.reviewtracker.repository;

import com.vinishchoudhary.reviewtracker.domain.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends ReviewRepositoryCustom, MongoRepository<Review, String> {
    Optional<Review> findByOrderId(String orderId);
    boolean existsByOrderId(String orderId);
    long countByDeliveryDateBeforeAndPaymentReceivedDateIsNull(java.time.LocalDate date);
}
