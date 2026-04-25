package com.poslocal.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "synced_orders")
@Data
public class SyncedOrder {

    @Id
    private String id;

    private String orderNumber;
    private String orderType;
    private LocalDateTime orderDate;
    private Double subtotal;
    private Double discountAmount;
    private Double taxAmount;
    private Double totalAmount;
    private String paymentMode;
    private String status;
    private String customerName;
    private String tableNumber;
    private LocalDateTime syncedAt;

    @Column(columnDefinition = "TEXT")
    private String itemsJson; // raw JSON of order items

    @Column(columnDefinition = "TEXT")
    private String rawJson;  // full original PWA payload
}
