package com.poslocal.scheduler;

import com.poslocal.service.ConfigService;
import com.poslocal.service.EmailService;
import com.poslocal.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReportScheduler {

    private final ReportService reportService;
    private final EmailService emailService;
    private final ConfigService configService;

    // Run every hour to check if it's time to send the report
    @Scheduled(cron = "0 0 * * * *")
    public void checkAndSendDailyReport() {
        boolean enabled = Boolean.parseBoolean(configService.getConfig("report.scheduler.enabled", "false"));
        if (!enabled) return;

        int scheduledHour = Integer.parseInt(configService.getConfig("report.scheduler.hour", "23"));
        int currentHour = LocalDateTime.now().getHour();

        if (currentHour == scheduledHour) {
            sendDailyReport();
        }
    }

    public void sendDailyReport() {
        String recipient = configService.getConfig("report.recipient.email", "");
        if (recipient.isEmpty()) {
            log.warn("Scheduled report skipped: No recipient email configured");
            return;
        }

        try {
            LocalDateTime start = LocalDate.now().atStartOfDay();
            LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
            
            byte[] report = reportService.generateDailyExcelReport(start, end);
            String fileName = "Daily_Report_" + LocalDate.now() + ".xlsx";
            
            emailService.sendEmailWithAttachment(
                recipient,
                "Daily POS Report - " + LocalDate.now(),
                "Please find attached the daily sales and expense report.",
                report,
                fileName
            );
            log.info("Scheduled daily report sent to {}", recipient);
        } catch (Exception e) {
            log.error("Failed to send scheduled daily report", e);
        }
    }
}
