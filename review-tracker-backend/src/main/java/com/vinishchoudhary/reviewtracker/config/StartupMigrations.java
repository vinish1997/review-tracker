package com.vinishchoudhary.reviewtracker.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

/**
 * One-time lightweight startup migrations.
 * - Backfill missing version field on reviews to 0 for optimistic locking.
 */
@Component
public class StartupMigrations implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(StartupMigrations.class);
    private final MongoTemplate mongoTemplate;

    public StartupMigrations(MongoTemplate mongoTemplate) { this.mongoTemplate = mongoTemplate; }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Query q = new Query(Criteria.where("version").exists(false));
            Update u = new Update().set("version", 0L);
            var res = mongoTemplate.updateMulti(q, u, "reviews");
            long mod = res.getModifiedCount();
            if (mod > 0) log.info("Backfilled version=0 on {} review(s)", mod);
        } catch (Exception e) {
            log.warn("Startup migration failed: {}", e.getMessage());
        }
    }
}

