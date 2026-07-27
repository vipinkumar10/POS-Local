package com.poslocal.repository;

import com.poslocal.model.SyncedInventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SyncedInventoryItemRepository extends JpaRepository<SyncedInventoryItem, String> {
}
