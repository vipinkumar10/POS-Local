package com.poslocal.controller;

import com.poslocal.scheduler.ReportScheduler;
import com.poslocal.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;
    private final ReportScheduler reportScheduler;

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        try {
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);
            
            byte[] report = reportService.generateDailyExcelReport(start, end);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Report_" + date + ".xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/send-email")
    public ResponseEntity<String> forceEmailReport() {
        reportScheduler.sendDailyReport();
        return ResponseEntity.ok("Email trigger initiated");
    }
}
