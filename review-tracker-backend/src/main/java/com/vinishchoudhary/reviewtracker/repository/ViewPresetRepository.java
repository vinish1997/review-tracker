package com.vinishchoudhary.reviewtracker.repository;

import com.vinishchoudhary.reviewtracker.domain.model.ViewPreset;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ViewPresetRepository extends MongoRepository<ViewPreset, String> {
    java.util.Optional<ViewPreset> findBySlug(String slug);
}
