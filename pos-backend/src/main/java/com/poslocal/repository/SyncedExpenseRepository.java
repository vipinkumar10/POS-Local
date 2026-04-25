package com.poslocal.repository;

import com.poslocal.model.SyncedExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SyncedExpenseRepository extends JpaRepository<SyncedExpense, String> {
    List<SyncedExpense> findByDateBetween(LocalDateTime from, LocalDateTime to);
    List<SyncedExpense> findBySyncedAtAfter(LocalDateTime since);

    @Query("SELECT SUM(e.amount) FROM SyncedExpense e WHERE e.date BETWEEN :from AND :to")
    Double sumAmountBetween(LocalDateTime from, LocalDateTime to);
}
