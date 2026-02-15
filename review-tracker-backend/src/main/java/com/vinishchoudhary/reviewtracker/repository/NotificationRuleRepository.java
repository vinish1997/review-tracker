package com.vinishchoudhary.reviewtracker.repository;

import com.vinishchoudhary.reviewtracker.domain.model.NotificationRule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRuleRepository extends MongoRepository<NotificationRule, String> {
    List<NotificationRule> findByActiveTrue();
}
