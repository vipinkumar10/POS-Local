package com.poslocal.controller;

import com.poslocal.dto.SyncRequestDTO;
import com.poslocal.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // In production, restrict to your PWA domain
public class SyncController {

    private final SyncService syncService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> sync(@RequestBody SyncRequestDTO request) {
        Map<String, Object> serverSettings = syncService.syncData(
            request.getOrders(), 
            request.getExpenses(),
            request.getMenuItems(),
            request.getInventoryItems(),
            request.getRecipes(),
            request.getSettings()
        );
        return ResponseEntity.ok(serverSettings);
    }

    @GetMapping("/master-data")
    public ResponseEntity<Map<String, Object>> getMasterData() {
        return ResponseEntity.ok(syncService.getMasterData());
    }
}
