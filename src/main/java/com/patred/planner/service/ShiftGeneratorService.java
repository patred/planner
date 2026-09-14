package com.patred.planner.service;

import com.patred.planner.domain.Shift;
import com.patred.planner.domain.ShiftRequirement;
import com.patred.planner.domain.ShiftTemplate;
import com.patred.planner.repository.ShiftRepository;
import com.patred.planner.repository.ShiftTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
                // Filtra in base ai giorni feriali / weekend
                if ((day == DayOfWeek.SATURDAY && !t.isOnSaturday()) ||
                        (day == DayOfWeek.SUNDAY && !t.isOnSunday()) ||
                        (!isWeekend && !t.isOnWeekdays())) {
                    continue;
                }

                LocalDateTime start = date.atTime(t.getStartTime());
                LocalDateTime end = t.isNightShift()
                        ? date.plusDays(1).atTime(t.getEndTime())
                        : date.atTime(t.getEndTime());

                // Per ogni regola di fabbisogno nel template (es. 2x [Medico/Biologo])
                for (ShiftRequirement req : t.getStaffRequirements()) {
                    // Genera N istanze di Shift quanti sono i posti richiesti dalla regola
                    for (int i = 0; i < req.getCount(); i++) {
                        Shift shift = new Shift();
                        shift.setTemplate(t);
                        shift.setStartDateTime(start);
                        shift.setEndDateTime(end);
                        shift.setRequirement(req); // Collega la regola di fabbisogno

                        shiftRepository.save(shift);
                    }
                }
            }
        }
    }
}