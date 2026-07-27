package com.poslocal.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "synced_inventory_items")
@Data
public class SyncedInventoryItem {
    @Id
    private String id;
    
    private String name;
    private String unit;
    private Double currentStock;
    private Double minStockAlert;
    private Double costPerUnit;
    
    private LocalDateTime updatedAt;
    private LocalDateTime syncedAt;
}
