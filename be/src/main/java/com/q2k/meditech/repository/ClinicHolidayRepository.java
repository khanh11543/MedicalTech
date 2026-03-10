package com.q2k.meditech.repository;

import com.q2k.meditech.entity.ClinicHoliday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClinicHolidayRepository extends JpaRepository<ClinicHoliday, Long> {

    List<ClinicHoliday> findByYearAndIsActiveTrueOrderByHolidayDateAsc(Integer year);

    List<ClinicHoliday> findAllByOrderByHolidayDateAsc();

    Optional<ClinicHoliday> findByHolidayDate(LocalDate holidayDate);

    boolean existsByHolidayDate(LocalDate holidayDate);

    boolean existsByHolidayDateAndIdNot(LocalDate holidayDate, Long id);

    @Query("SELECT ch.holidayDate FROM ClinicHoliday ch " +
            "WHERE ch.holidayDate >= :from AND ch.holidayDate <= :to " +
            "AND ch.isActive = true AND ch.preventSlotCreation = true")
    List<LocalDate> findBlockedDatesInRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("SELECT ch FROM ClinicHoliday ch " +
            "WHERE ch.holidayDate >= :from AND ch.holidayDate <= :to " +
            "AND ch.isActive = true AND ch.autoBlockSlots = true")
    List<ClinicHoliday> findAutoBlockHolidaysInRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
