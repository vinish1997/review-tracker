package com.vinishchoudhary.reviewtracker.repository;

import com.vinishchoudhary.reviewtracker.domain.model.Review;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Repository
@RequiredArgsConstructor
public class ReviewRepositoryImpl implements ReviewRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<Review> searchReviews(ReviewSearchCriteria criteria, Pageable pageable) {
        Query query = new Query();
        List<Criteria> filters = new ArrayList<>();

        if (criteria.getPlatformId() != null) filters.add(Criteria.where("platformId").is(criteria.getPlatformId()));
        if (criteria.getPlatformIdIn() != null && !criteria.getPlatformIdIn().isEmpty())
            filters.add(Criteria.where("platformId").in(criteria.getPlatformIdIn()));

        if (criteria.getStatus() != null) filters.add(Criteria.where("status").is(criteria.getStatus()));
        if (criteria.getStatusIn() != null && !criteria.getStatusIn().isEmpty())
            filters.add(Criteria.where("status").in(criteria.getStatusIn()));

        if (criteria.getMediatorId() != null) filters.add(Criteria.where("mediatorId").is(criteria.getMediatorId()));
        if (criteria.getMediatorIdIn() != null && !criteria.getMediatorIdIn().isEmpty())
            filters.add(Criteria.where("mediatorId").in(criteria.getMediatorIdIn()));
        if (criteria.getDealType() != null) filters.add(Criteria.where("dealType").is(criteria.getDealType()));
        if (criteria.getDealTypeIn() != null && !criteria.getDealTypeIn().isEmpty())
            filters.add(Criteria.where("dealType").in(criteria.getDealTypeIn()));

        if (criteria.getProductNameContains() != null)
            filters.add(Criteria.where("productName").regex(criteria.getProductNameContains(), "i"));

        if (criteria.getOrderIdContains() != null)
            filters.add(Criteria.where("orderId").regex(criteria.getOrderIdContains(), "i"));

        if (!filters.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(filters.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, Review.class);
        query.with(pageable);
        List<Review> results = mongoTemplate.find(query, Review.class);

        return new PageImpl<>(results, pageable, total);
    }
}
