package com.poslocal.repository;

import com.poslocal.model.SyncedMenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SyncedMenuItemRepository extends JpaRepository<SyncedMenuItem, String> {
}
