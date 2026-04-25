package com.poslocal.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Runtime-configurable settings stored in DB.
 * Allows the frontend to update email/SMTP, sync interval, scheduler cron, etc.
 */
@Entity
@Table(name = "app_config")
@Data
public class AppConfig {

    @Id
    private String configKey;

    @Column(columnDefinition = "TEXT")
    private String configValue;

    private String description;
    private LocalDateTime updatedAt;
}
