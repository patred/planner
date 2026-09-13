package com.patred.planner.repository;

import com.patred.planner.domain.Employee;
import com.patred.planner.domain.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ShiftRepository extends JpaRepository<Shift, Long> {

    @Modifying
    @Query("UPDATE Shift s SET s.employee = :employee WHERE s.id = :shiftId")
    void updateEmployee(Long shiftId, Employee employee);
}