package com.q2k.meditech.repository;

import com.q2k.meditech.entity.ServiceOrder;
import com.q2k.meditech.entity.enums.ServiceOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, Long> {

    List<ServiceOrder> findByConsultationIdOrderByOrderedAtDesc(Long consultationId);

    List<ServiceOrder> findByAppointmentIdOrderByOrderedAtDesc(Long appointmentId);

    List<ServiceOrder> findByAppointmentIdAndStatusIn(Long appointmentId, List<ServiceOrderStatus> statuses);

    long countByAppointmentIdAndStatusIn(Long appointmentId, List<ServiceOrderStatus> statuses);

    boolean existsByAppointmentIdAndStatusIn(Long appointmentId, List<ServiceOrderStatus> statuses);

    List<ServiceOrder> findByAppointmentIdIn(List<Long> appointmentIds);

    // ── Department Worklist queries (using specialty FK) ──

    @Query("SELECT so FROM ServiceOrder so " +
           "JOIN FETCH so.appointment a " +
           "JOIN FETCH a.patient p " +
           "JOIN FETCH p.user pu " +
           "JOIN FETCH so.orderedByDoctor od " +
           "JOIN FETCH od.user ou " +
           "LEFT JOIN FETCH so.assignedDoctor ad " +
           "WHERE so.specialty.id IN :specialtyIds " +
           "AND so.status IN :statuses " +
           "ORDER BY so.orderedAt DESC")
    List<ServiceOrder> findBySpecialtyIdInAndStatusIn(
            @Param("specialtyIds") List<Long> specialtyIds,
            @Param("statuses") List<ServiceOrderStatus> statuses);

    @Query("SELECT so FROM ServiceOrder so " +
           "JOIN FETCH so.appointment a " +
           "JOIN FETCH a.patient p " +
           "JOIN FETCH p.user pu " +
           "JOIN FETCH so.orderedByDoctor od " +
           "JOIN FETCH od.user ou " +
           "LEFT JOIN FETCH so.assignedDoctor ad " +
           "WHERE so.specialty.id IN :specialtyIds " +
           "ORDER BY so.orderedAt DESC")
    List<ServiceOrder> findBySpecialtyIdIn(@Param("specialtyIds") List<Long> specialtyIds);
}
