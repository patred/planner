package com.patred.planner.solver;

import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.score.stream.*;
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
                fairnessPerEmployee(factory)
        };
    }

    // Vincolo 1: Nessuna sovrapposizione di orario per lo stesso dipendente
    private Constraint noOverlappingShifts(ConstraintFactory factory) {
        return factory.forEachUniquePair(Shift.class,
                        Joiners.equal(Shift::getEmployee),
                        Joiners.overlapping(Shift::getStart, Shift::getEnd))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Turni sovrapposti");
    }

    // Vincolo 2: Riposo minimo di 11 ore tra due turni
    private Constraint atLeast11HoursRestBetweenShifts(ConstraintFactory factory) {
        return factory.forEachUniquePair(Shift.class,
                        Joiners.equal(Shift::getEmployee))
                .filter((shift1, shift2) -> {
                    Duration rest;
                    if (shift1.getEnd().isBefore(shift2.getStart())) {
                        rest = Duration.between(shift1.getEnd(), shift2.getStart());
                    } else {
                        rest = Duration.between(shift2.getEnd(), shift1.getStart());
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
}