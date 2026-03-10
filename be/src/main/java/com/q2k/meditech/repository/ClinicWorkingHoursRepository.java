package com.q2k.meditech.repository;

import com.q2k.meditech.entity.ClinicWorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClinicWorkingHoursRepository extends JpaRepository<ClinicWorkingHours, Long> {

    List<ClinicWorkingHours> findAllByOrderByDayOfWeekAsc();

    Optional<ClinicWorkingHours> findByDayOfWeek(Integer dayOfWeek);

    boolean existsByDayOfWeek(Integer dayOfWeek);

    boolean existsByDayOfWeekAndIdNot(Integer dayOfWeek, Long id);

    List<ClinicWorkingHours> findByIsOpenTrue();
}
