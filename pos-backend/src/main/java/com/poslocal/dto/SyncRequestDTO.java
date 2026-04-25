package com.poslocal.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class SyncRequestDTO {
    private List<Map<String, Object>> orders;
    private List<Map<String, Object>> expenses;
}
