package com.poslocal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.poslocal.model.SyncedExpense;
import com.poslocal.model.SyncedOrder;
import com.poslocal.repository.SyncedExpenseRepository;
import com.poslocal.repository.SyncedOrderRepository;
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
    private final ObjectMapper objectMapper;

    @Transactional
    public void syncData(List<Map<String, Object>> orders, List<Map<String, Object>> expenses) {
        if (orders != null) {
            for (Map<String, Object> orderMap : orders) {
                saveOrder(orderMap);
            }
        }
        if (expenses != null) {
            for (Map<String, Object> expenseMap : expenses) {
                saveExpense(expenseMap);
            }
        }
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

    private LocalDateTime parseDate(Object dateObj) {
        if (dateObj == null) return null;
        if (dateObj instanceof Number) {
            return LocalDateTime.ofInstant(Instant.ofEpochMilli(((Number) dateObj).longValue()), ZoneId.systemDefault());
        }
        if (dateObj instanceof String) {
            return LocalDateTime.parse((String) dateObj);
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
