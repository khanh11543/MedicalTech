package com.q2k.meditech.repository;

import com.q2k.meditech.entity.DataDeletionRequest;
import com.q2k.meditech.entity.enums.DeletionRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DataDeletionRequestRepository extends JpaRepository<DataDeletionRequest, Long>,
        JpaSpecificationExecutor<DataDeletionRequest> {

    @Query("SELECT d FROM DataDeletionRequest d JOIN FETCH d.user WHERE d.id = :id")
    Optional<DataDeletionRequest> findByIdWithUser(@Param("id") Long id);

    @Query("SELECT d FROM DataDeletionRequest d WHERE d.status = :status")
    List<DataDeletionRequest> findByStatus(@Param("status") DeletionRequestStatus status);

    @Query("SELECT d FROM DataDeletionRequest d WHERE d.status = 'PENDING' ORDER BY d.requestedDate ASC")
    List<DataDeletionRequest> findPendingRequests();

    @Query("SELECT d FROM DataDeletionRequest d WHERE d.status = 'APPROVED' AND d.scheduleDate <= CURRENT_TIMESTAMP")
    List<DataDeletionRequest> findApprovedAndScheduleReached();

    @Query("SELECT COUNT(d) FROM DataDeletionRequest d WHERE d.user.id = :userId AND d.status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED')")
    long countActiveRequestsByUserId(@Param("userId") Long userId);
}
