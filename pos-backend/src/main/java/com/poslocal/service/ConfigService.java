package com.poslocal.service;

import com.poslocal.model.AppConfig;
import com.poslocal.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConfigService {

    private final AppConfigRepository repository;

    public void setConfig(String key, String value, String description) {
        AppConfig config = repository.findById(key).orElse(new AppConfig());
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setDescription(description);
        config.setUpdatedAt(LocalDateTime.now());
        repository.save(config);
    }

    public String getConfig(String key, String defaultValue) {
        return repository.findById(key)
                .map(AppConfig::getConfigValue)
                .orElse(defaultValue);
    }
}
