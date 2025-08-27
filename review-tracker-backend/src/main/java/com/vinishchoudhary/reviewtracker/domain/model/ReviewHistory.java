package com.vinishchoudhary.reviewtracker.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document("review_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewHistory {
    @Id
    private String id;
    private String reviewId;
    private String type; // CREATE, UPDATE, DELETE, CLONE, COPY_FIELDS, BULK_UPDATE, BULK_DELETE, IMPORT
    private Instant at;
    private String note;
    private List<Change> changes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Change {
        private String field;
        private Object oldVal;
        private Object newVal;
    }
}
