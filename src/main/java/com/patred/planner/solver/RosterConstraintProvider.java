package com.patred.planner.solver;

import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.score.stream.*;
import com.patred.planner.domain.Role;
import com.patred.planner.domain.Shift;

import java.time.Duration;

public class RosterConstraintProvider implements ConstraintProvider {
    public RosterConstraintProvider() {
    }

    @Override
    public Constraint[] defineConstraints(ConstraintFactory factory) {
        return new Constraint[]{
                noOverlappingShifts(factory),
                atLeast11HoursRestBetweenShifts(factory),
                fairnessPerEmployee(factory),
                requiredRoleMatch(factory)
        };
    }

    // Vincolo 1: Nessuna sovrapposizione di orario per lo stesso dipendente
    private Constraint noOverlappingShifts(ConstraintFactory factory) {
        return factory.forEachUniquePair(Shift.class,
                        Joiners.equal(Shift::getEmployee),
                        Joiners.overlapping(Shift::getStartDateTime, Shift::getEndDateTime))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Turni sovrapposti");
    }

    // Vincolo 2: Riposo minimo di 11 ore tra due turni
    private Constraint atLeast11HoursRestBetweenShifts(ConstraintFactory factory) {
        return factory.forEachUniquePair(Shift.class,
                        Joiners.equal(Shift::getEmployee))
                .filter((shift1, shift2) -> {
                    Duration rest;
                    if (shift1.getEndDateTime().isBefore(shift2.getStartDateTime())) {
                        rest = Duration.between(shift1.getEndDateTime(), shift2.getStartDateTime());
                    } else {
                        rest = Duration.between(shift2.getEndDateTime(), shift1.getStartDateTime());
                    }
                    return rest.toHours() < 11;
                })
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Meno di 11 ore di riposo");
    }

    private Constraint fairnessPerEmployee(ConstraintFactory factory) {
        return factory
                .forEach(Shift.class)
                .filter(shift -> shift.getEmployee() != null)
                .groupBy(Shift::getEmployee, ConstraintCollectors.count())
                .penalize(HardSoftScore.ONE_SOFT, (employee, count) -> count * count)
                .asConstraint("Distribuzione equa dei turni");
    }

    public Constraint requiredRoleMatch(ConstraintFactory constraintFactory) {
        return constraintFactory.forEach(Shift.class)
                .filter(shift -> shift.getEmployee() != null)
                .filter(shift -> {
                    Role employeeRole = shift.getEmployee().getRole();
                    // Penalizza se il ruolo del dipendente NON è presente tra i ruoli ammessi dal requisito
                    return !shift.getRequirement().getAcceptableRoles().contains(employeeRole);
                })
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Ruolo dipendente non compatibile col fabbisogno del turno");
    }
}