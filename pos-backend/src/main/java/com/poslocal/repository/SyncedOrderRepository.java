package com.poslocal.repository;

import com.poslocal.model.SyncedOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SyncedOrderRepository extends JpaRepository<SyncedOrder, String> {
    List<SyncedOrder> findByOrderDateBetweenOrderByOrderDateDesc(LocalDateTime from, LocalDateTime to);
    List<SyncedOrder> findBySyncedAtAfter(LocalDateTime since);

    @Query("SELECT SUM(o.totalAmount) FROM SyncedOrder o WHERE o.orderDate BETWEEN :from AND :to")
    Double sumTotalAmountBetween(LocalDateTime from, LocalDateTime to);
}
