package com.poslocal.service;

import com.poslocal.model.SyncedExpense;
import com.poslocal.model.SyncedOrder;
import com.poslocal.repository.SyncedExpenseRepository;
import com.poslocal.repository.SyncedOrderRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SyncedOrderRepository orderRepository;
    private final SyncedExpenseRepository expenseRepository;

    public byte[] generateDailyExcelReport(LocalDateTime start, LocalDateTime end) throws IOException {
        List<SyncedOrder> orders = orderRepository.findByOrderDateBetweenOrderByOrderDateDesc(start, end);
        List<SyncedExpense> expenses = expenseRepository.findByDateBetween(start, end);

        try (Workbook workbook = new XSSFWorkbook()) {
            // Sales Sheet
            Sheet salesSheet = workbook.createSheet("Sales");
            createSalesHeader(salesSheet);
            int rowIdx = 1;
            for (SyncedOrder order : orders) {
                Row row = salesSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(order.getOrderNumber());
                row.createCell(1).setCellValue(order.getOrderDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                row.createCell(2).setCellValue(order.getOrderType());
                row.createCell(3).setCellValue(order.getTotalAmount());
                row.createCell(4).setCellValue(order.getPaymentMode());
                row.createCell(5).setCellValue(order.getTableNumber() != null ? order.getTableNumber() : "-");
            }

            // Expenses Sheet
            Sheet expenseSheet = workbook.createSheet("Expenses");
            createExpenseHeader(expenseSheet);
            rowIdx = 1;
            for (SyncedExpense expense : expenses) {
                Row row = expenseSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(expense.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                row.createCell(1).setCellValue(expense.getCategoryName());
                row.createCell(2).setCellValue(expense.getAmount());
                row.createCell(3).setCellValue(expense.getDescription());
            }

            // Summary Sheet
            Sheet summarySheet = workbook.createSheet("Summary");
            double totalSales = orders.stream().mapToDouble(SyncedOrder::getTotalAmount).sum();
            double totalExpenses = expenses.stream().mapToDouble(SyncedExpense::getAmount).sum();
            
            Row r1 = summarySheet.createRow(0);
            r1.createCell(0).setCellValue("Total Sales");
            r1.createCell(1).setCellValue(totalSales);
            
            Row r2 = summarySheet.createRow(1);
            r2.createCell(0).setCellValue("Total Expenses");
            r2.createCell(1).setCellValue(totalExpenses);
            
            Row r3 = summarySheet.createRow(2);
            r3.createCell(0).setCellValue("Net Profit");
            r3.createCell(1).setCellValue(totalSales - totalExpenses);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void createSalesHeader(Sheet sheet) {
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Order #");
        header.createCell(1).setCellValue("Date");
        header.createCell(2).setCellValue("Type");
        header.createCell(3).setCellValue("Total");
        header.createCell(4).setCellValue("Payment");
        header.createCell(5).setCellValue("Table");
    }

    private void createExpenseHeader(Sheet sheet) {
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Date");
        header.createCell(1).setCellValue("Category");
        header.createCell(2).setCellValue("Amount");
        header.createCell(3).setCellValue("Description");
    }
}
