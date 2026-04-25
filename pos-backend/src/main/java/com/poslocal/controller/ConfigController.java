package com.poslocal.controller;

import com.poslocal.service.ConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConfigController {

    private final ConfigService configService;

    @PostMapping("/{key}")
    public ResponseEntity<String> setConfig(@PathVariable String key, @RequestBody Map<String, String> body) {
        configService.setConfig(key, body.get("value"), body.get("description"));
        return ResponseEntity.ok("Config saved");
    }

    @GetMapping("/{key}")
    public ResponseEntity<String> getConfig(@PathVariable String key, @RequestParam(defaultValue = "") String defaultValue) {
        return ResponseEntity.ok(configService.getConfig(key, defaultValue));
    }
}
