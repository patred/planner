package com.patred.planner.service;

import com.patred.planner.domain.Role;
import com.patred.planner.domain.Shift;
import com.patred.planner.domain.ShiftTemplate;
import com.patred.planner.repository.ShiftRepository;
import com.patred.planner.repository.ShiftTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ShiftGeneratorService {

    private final ShiftTemplateRepository templateRepository;
    private final ShiftRepository shiftRepository;

    public ShiftGeneratorService(ShiftTemplateRepository templateRepository, ShiftRepository shiftRepository) {
        this.templateRepository = templateRepository;
        this.shiftRepository = shiftRepository;
    }

    @Transactional
    public void generateShiftsForPeriod(LocalDate startDate, LocalDate endDate) {
        List<ShiftTemplate> templates = templateRepository.findAll();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DayOfWeek day = date.getDayOfWeek();
            boolean isWeekend = (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY);

            for (ShiftTemplate t : templates) {
                // Filtra in base ai giorni feriali / festivi / weekend
                if ((day == DayOfWeek.SATURDAY && !t.isOnSaturday()) ||
                        (day == DayOfWeek.SUNDAY && !t.isOnSunday()) ||
                        (!isWeekend && !t.isOnWeekdays())) {
                    continue;
                }

                LocalDateTime start = date.atTime(t.getStartTime());
                LocalDateTime end = t.isNightShift()
                        ? date.plusDays(1).atTime(t.getEndTime())
                        : date.atTime(t.getEndTime());

                // Per ogni ruolo e relativo numero richiesto nel template, genera un'istanza Shift
                for (Map.Entry<Role, Integer> entry : t.getRequiredStaff().entrySet()) {
                    Role role = entry.getKey();
                    int count = entry.getValue();

                    for (int i = 0; i < count; i++) {
                        Shift shift = new Shift(t, start, end, role);
                        shiftRepository.save(shift);
                    }
                }
            }
        }
    }
}