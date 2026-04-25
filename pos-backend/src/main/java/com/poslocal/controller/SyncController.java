package com.poslocal.controller;

import com.poslocal.dto.SyncRequestDTO;
import com.poslocal.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // In production, restrict to your PWA domain
public class SyncController {

    private final SyncService syncService;

    @PostMapping
    public ResponseEntity<String> sync(@RequestBody SyncRequestDTO request) {
        syncService.syncData(request.getOrders(), request.getExpenses());
        return ResponseEntity.ok("Sync successful");
    }
}
