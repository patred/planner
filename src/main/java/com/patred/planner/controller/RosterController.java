package com.patred.planner.controller;

import ai.timefold.solver.core.api.solver.SolverManager;
import com.patred.planner.domain.Employee;
import com.patred.planner.domain.Roster;
import com.patred.planner.domain.Shift;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/roster")
public class RosterController {

    @Autowired
    private SolverManager<Roster, UUID> solverManager;

    @PostMapping("/generate")
    public Roster generateRoster() throws ExecutionException, InterruptedException {
        UUID problemId = UUID.randomUUID();

        // 1. Dati di test (in produzione verranno dal DB H2)
        List<Employee> employees = List.of(
                new Employee("1", "Mario Rossi"),
                new Employee("2", "Luigi Verdi"),
                new Employee("3", "Giulia Verdi")
        );

        List<Shift> shifts = List.of(
                // Lunedì 16 Marzo 2026
                new Shift("S1", LocalDateTime.of(2026, 3, 16, 6, 0), LocalDateTime.of(2026, 3, 16, 14, 0)),
                new Shift("S2", LocalDateTime.of(2026, 3, 16, 14, 0), LocalDateTime.of(2026, 3, 16, 22, 0)),

                // Martedì 17 Marzo 2026
                new Shift("S3", LocalDateTime.of(2026, 3, 17, 6, 0), LocalDateTime.of(2026, 3, 17, 14, 0)),
                new Shift("S4",LocalDateTime.of(2026, 3, 17, 14, 0), LocalDateTime.of(2026, 3, 17, 22, 0)),

                // Mercoledì 18 Marzo 2026
                new Shift("S5", LocalDateTime.of(2026, 3, 18, 6, 0), LocalDateTime.of(2026, 3, 18, 14, 0))
        );

        Roster problem = new Roster(employees, shifts);

        // 2. Avvia il Solver
        Roster solution = solverManager.solve(problemId, problem).getFinalBestSolution();

        return solution; // Restituisce il JSON con i turni assegnati!
    }
}
