package com.vinishchoudhary.reviewtracker.domain.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("view_presets")
public class ViewPreset {
    @Id
    private String id;
    private String name;
    private Map<String, Object> config; // arbitrary config blob (filters, columns, etc.)
    private Boolean shared;
    private String slug; // shareable slug when shared = true

    @CreatedDate
    private java.time.Instant createdAt;
    @LastModifiedDate
    private java.time.Instant updatedAt;
}
