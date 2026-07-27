package com.poslocal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.poslocal.model.*;
import com.poslocal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    private final SyncedOrderRepository orderRepository;
    private final SyncedExpenseRepository expenseRepository;
    private final SyncedMenuItemRepository menuItemRepository;
    private final SyncedInventoryItemRepository inventoryItemRepository;
    private final SyncedRecipeRepository recipeRepository;
    private final AppConfigRepository appConfigRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Map<String, Object> syncData(List<Map<String, Object>> orders, 
                         List<Map<String, Object>> expenses,
                         List<Map<String, Object>> menuItems,
                         List<Map<String, Object>> inventoryItems,
                         List<Map<String, Object>> recipes,
                         Map<String, Object> settings) {
        if (orders != null) orders.forEach(this::saveOrder);
        if (expenses != null) expenses.forEach(this::saveExpense);
        if (menuItems != null) menuItems.forEach(this::saveMenuItem);
        if (inventoryItems != null) inventoryItems.forEach(this::saveInventoryItem);
        if (recipes != null) recipes.forEach(this::saveRecipe);
        if (settings != null) saveSettings(settings);
        
        return getLatestSettings();
    }

    private Map<String, Object> getLatestSettings() {
        Map<String, Object> settings = new java.util.HashMap<>();
        List<AppConfig> configs = appConfigRepository.findAll();
        for (AppConfig config : configs) {
            if (config.getConfigKey().startsWith("pwa.")) {
                String key = config.getConfigKey().substring(4);
                settings.put(key, config.getConfigValue());
            }
        }
        return settings;
    }

    private void saveOrder(Map<String, Object> map) {
        try {
            SyncedOrder order = new SyncedOrder();
            order.setId((String) map.get("id"));
            order.setOrderNumber((String) map.get("orderNumber"));
            order.setOrderType((String) map.get("orderType"));
            order.setOrderDate(parseDate(map.get("orderDate")));
            order.setSubtotal(toDouble(map.get("subtotal")));
            order.setDiscountAmount(toDouble(map.get("discountAmount")));
            order.setTaxAmount(toDouble(map.get("taxAmount")));
            order.setTotalAmount(toDouble(map.get("totalAmount")));
            order.setPaymentMode((String) map.get("paymentMode"));
            order.setStatus((String) map.get("status"));
            order.setCustomerName((String) map.get("customerName"));
            order.setTableNumber((String) map.get("tableNumber"));
            order.setSyncedAt(LocalDateTime.now());
            order.setRawJson(objectMapper.writeValueAsString(map));
            
            orderRepository.save(order);
        } catch (Exception e) {
            log.error("Failed to sync order: {}", map.get("id"), e);
        }
    }

    private void saveExpense(Map<String, Object> map) {
        try {
            SyncedExpense expense = new SyncedExpense();
            expense.setId((String) map.get("id"));
            expense.setCategoryId((String) map.get("categoryId"));
            expense.setCategoryName((String) map.get("categoryName"));
            expense.setDate(parseDate(map.get("date")));
            expense.setAmount(toDouble(map.get("amount")));
            expense.setDescription((String) map.get("description"));
            expense.setSyncedAt(LocalDateTime.now());
            
            expenseRepository.save(expense);
        } catch (Exception e) {
            log.error("Failed to sync expense: {}", map.get("id"), e);
        }
    }

    private void saveMenuItem(Map<String, Object> map) {
        try {
            SyncedMenuItem item = new SyncedMenuItem();
            item.setId((String) map.get("id"));
            item.setCategoryId((String) map.get("categoryId"));
            item.setName((String) map.get("name"));
            item.setPrice(toDouble(map.get("price")));
            item.setUnit((String) map.get("unit"));
            item.setIsVeg((Boolean) map.get("isVeg"));
            item.setIsActive((Boolean) map.get("isActive"));
            item.setVariantsJson(objectMapper.writeValueAsString(map.get("variants")));
            item.setUpdatedAt(parseDate(map.get("updatedAt")));
            item.setSyncedAt(LocalDateTime.now());
            
            menuItemRepository.save(item);
        } catch (Exception e) {
            log.error("Failed to sync menu item: {}", map.get("id"), e);
        }
    }

    private void saveInventoryItem(Map<String, Object> map) {
        try {
            SyncedInventoryItem item = new SyncedInventoryItem();
            item.setId((String) map.get("id"));
            item.setName((String) map.get("name"));
            item.setUnit((String) map.get("unit"));
            item.setCurrentStock(toDouble(map.get("currentStock")));
            item.setMinStockAlert(toDouble(map.get("minStockAlert")));
            item.setCostPerUnit(toDouble(map.get("costPerUnit")));
            item.setUpdatedAt(parseDate(map.get("updatedAt")));
            item.setSyncedAt(LocalDateTime.now());
            
            inventoryItemRepository.save(item);
        } catch (Exception e) {
            log.error("Failed to sync inventory item: {}", map.get("id"), e);
        }
    }

    private void saveRecipe(Map<String, Object> map) {
        try {
            SyncedRecipe recipe = new SyncedRecipe();
            recipe.setId((String) map.get("id"));
            recipe.setMenuItemId((String) map.get("menuItemId"));
            recipe.setInventoryItemId((String) map.get("inventoryItemId"));
            recipe.setQuantityRequired(toDouble(map.get("quantityRequired")));
            recipe.setSyncedAt(LocalDateTime.now());
            
            recipeRepository.save(recipe);
        } catch (Exception e) {
            log.error("Failed to sync recipe: {}", map.get("id"), e);
        }
    }

    private void saveSettings(Map<String, Object> settings) {
        settings.forEach((key, value) -> {
            try {
                if (value == null) return;
                AppConfig config = new AppConfig();
                config.setConfigKey("pwa." + key);
                config.setConfigValue(String.valueOf(value));
                config.setUpdatedAt(LocalDateTime.now());
                config.setDescription("Synced from PWA");
                appConfigRepository.save(config);
            } catch (Exception e) {
                log.error("Failed to sync setting: {}", key, e);
            }
        });
    }

    public Map<String, Object> getMasterData() {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("menuItems", menuItemRepository.findAll());
        data.put("inventoryItems", inventoryItemRepository.findAll());
        data.put("recipes", recipeRepository.findAll());
        data.put("settings", getLatestSettings());
        return data;
    }

    private LocalDateTime parseDate(Object dateObj) {
        if (dateObj == null) return null;
        if (dateObj instanceof Number) {
            return LocalDateTime.ofInstant(Instant.ofEpochMilli(((Number) dateObj).longValue()), ZoneId.systemDefault());
        }
        if (dateObj instanceof String) {
            String str = (String) dateObj;
            try {
                // Handle UTC strings like 2026-05-02T14:39:33.071Z
                return Instant.parse(str).atZone(ZoneId.systemDefault()).toLocalDateTime();
            } catch (Exception e) {
                try {
                    return LocalDateTime.parse(str);
                } catch (Exception e2) {
                    log.warn("Could not parse date string: {}", str);
                    return null;
                }
            }
        }
        return null;
    }

    private Double toDouble(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number) return ((Number) obj).doubleValue();
        if (obj instanceof String) return Double.parseDouble((String) obj);
        return 0.0;
    }
}
