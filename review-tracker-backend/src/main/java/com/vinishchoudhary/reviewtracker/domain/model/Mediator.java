package com.vinishchoudhary.reviewtracker.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("mediators")
public class Mediator {
    @Id
    private String id;
    private String name;
    private String phone;

    public Mediator(String id, String name) {
        this.id = id;
        this.name = name;
    }
}
