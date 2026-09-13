package com.patred.planner.controller;

import com.patred.planner.service.RosterService;
import com.patred.planner.service.ShiftGeneratorService;
import com.patred.planner.solver.Roster;
import ai.timefold.solver.core.api.solver.SolverStatus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/roster")
public class RosterController {

    private final RosterService rosterService;
    private final ShiftGeneratorService shiftGeneratorService;

    public RosterController(RosterService rosterService, ShiftGeneratorService shiftGeneratorService) {
        this.rosterService = rosterService;
        this.shiftGeneratorService = shiftGeneratorService;
    }

    /**
     * 1. Genera nel DB le istanze dei turni (Shift) partendo dai modelli (ShiftTemplate)
     *    per il periodo specificato.
     */
    @PostMapping("/generate")
    public ResponseEntity<String> generateShifts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        shiftGeneratorService.generateShiftsForPeriod(startDate, endDate);
        return ResponseEntity.ok("Turni generati con successo per il periodo " + startDate + " - " + endDate);
    }

    /**
     * 2. Avvia l'ottimizzazione asincrona con Timefold per un determinato tenant/periodo.
     */
    @PostMapping("/solve/{rosterId}")
    public ResponseEntity<String> solveRoster(@PathVariable Long rosterId) {
        rosterService.solve(rosterId);
        return ResponseEntity.ok("Ottimizzazione avviata per il roster ID: " + rosterId);
    }

    /**
     * 3. Interrompe la risoluzione in corso (opzionale).
     */
    @PostMapping("/stop/{rosterId}")
    public ResponseEntity<String> stopSolving(@PathVariable Long rosterId) {
        rosterService.stopSolving(rosterId);
        return ResponseEntity.ok("Richiesta di arresto inviata per il roster ID: " + rosterId);
    }

    /**
     * 4. Recupera lo stato attuale del Roster (soluzione con turni assegnati + score).
     */
    @GetMapping("/{rosterId}")
    public ResponseEntity<Roster> getRoster(@PathVariable Long rosterId) {
        Roster roster = rosterService.getRoster(rosterId);
        if (roster == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(roster);
    }

    /**
     * 5. Verifica lo stato del Solver (SOLVING_ACTIVE, NOT_SOLVING, ecc.).
     */
    @GetMapping("/{rosterId}/status")
    public ResponseEntity<SolverStatus> getSolverStatus(@PathVariable Long rosterId) {
        SolverStatus status = rosterService.getSolverStatus(rosterId);
        return ResponseEntity.ok(status);
    }
}