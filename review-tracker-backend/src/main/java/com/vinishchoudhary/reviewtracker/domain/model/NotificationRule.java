package com.vinishchoudhary.reviewtracker.domain.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("notification_rules")
public class NotificationRule {
    @Id
    private String id;

    private String name; // e.g. "Review Reminder"
    private String triggerField; // e.g. "orderedDate"
    private int daysAfter; // e.g. 7
    private String missingField; // e.g. "reviewSubmitDate" (notify if this is null)
    private String excludeStatus; // e.g. "payment received" (don't notify if status matches this)

    private String type; // URGENT | WARNING | INFO
    private String messageTemplate; // e.g. "Order {orderId} needs review"
    private String actionUrl; // e.g. "/reviews/edit/{id}"

    private boolean active;
}
