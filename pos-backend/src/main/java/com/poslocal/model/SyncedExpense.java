package com.poslocal.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "synced_expenses")
@Data
public class SyncedExpense {

    @Id
    private String id;

    private String categoryId;
    private String categoryName;
    private LocalDateTime date;
    private Double amount;
    private String description;
    private LocalDateTime syncedAt;
}
