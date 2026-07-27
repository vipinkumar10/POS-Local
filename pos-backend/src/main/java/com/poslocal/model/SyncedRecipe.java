package com.poslocal.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "synced_recipes")
@Data
public class SyncedRecipe {
    @Id
    private String id;
    
    private String menuItemId;
    private String inventoryItemId;
    private Double quantityRequired;
    
    private LocalDateTime syncedAt;
}
