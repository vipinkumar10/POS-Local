package com.poslocal.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "synced_menu_items")
@Data
public class SyncedMenuItem {
    @Id
    private String id;
    
    private String categoryId;
    private String name;
    private Double price;
    private String unit;
    private Boolean isVeg;
    private Boolean isActive;
    
    @Column(columnDefinition = "TEXT")
    private String variantsJson; // Stores the multi-unit variants as JSON
    
    private LocalDateTime updatedAt;
    private LocalDateTime syncedAt;
}
