package com.resqnet.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Request {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String severity;

    private String category;

    @Column(length = 160)
    private String smsPayload;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String channelUsed;

    private String assignedTo;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime syncedAt;
}
