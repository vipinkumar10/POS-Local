package com.poslocal.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class SyncRequestDTO {
    private List<Map<String, Object>> orders;
    private List<Map<String, Object>> expenses;
    private List<Map<String, Object>> menuItems;
    private List<Map<String, Object>> inventoryItems;
    private List<Map<String, Object>> recipes;
    private Map<String, Object> settings;
}
