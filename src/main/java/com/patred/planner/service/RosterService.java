package com.patred.planner.service;

import ai.timefold.solver.core.api.solver.SolverManager;
import ai.timefold.solver.core.api.solver.SolverStatus;
import com.patred.planner.domain.Employee;
import com.patred.planner.domain.Role;
import com.patred.planner.domain.Shift;
import com.patred.planner.repository.EmployeeRepository;
import com.patred.planner.repository.RoleRepository;
import com.patred.planner.repository.ShiftRepository;
import com.patred.planner.solver.Roster;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RosterService {

    private final SolverManager<Roster, Long> solverManager;
    private final ShiftRepository shiftRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;

    public RosterService(SolverManager<Roster, Long> solverManager,
                         ShiftRepository shiftRepository,
                         EmployeeRepository employeeRepository,
                         RoleRepository roleRepository) {
        this.solverManager = solverManager;
        this.shiftRepository = shiftRepository;
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
    }

    /**
     * Avvia il calcolo dell'ottimizzazione per un dato rosterId (es. l'ID del mese o periodo).
     */
    public void solve(Long rosterId) {
        // 1. Avvia la risoluzione asincrona
        solverManager.solveAndListen(
                rosterId,
                this::loadRoster,      // Carica i dati dal DB
                this::saveSolution     // Salva la soluzione (chiamato man mano che trova soluzioni migliori)
        );
    }

    /**
     * Carica dal Database tutte le risorse e i turni da pianificare.
     */
    @Transactional(readOnly = true)
    public Roster loadRoster(Long rosterId) {
        List<Employee> employeeList = employeeRepository.findAll();
        List<Role> roleList = roleRepository.findAll();
        List<Shift> shiftList = shiftRepository.findAll(); // O filtrati per periodo/rosterId

        return new Roster(employeeList, roleList, shiftList);
    }

    /**
     * Callback eseguito da Timefold ogni volta che trova una soluzione migliore
     * o al termine dell'elaborazione.
     */
    @Transactional
    public void saveSolution(Roster solution) {
        // Aggiorna sul DB le assegnazioni dei dipendenti ai turni
        for (Shift shift : solution.getShiftList()) {
            shiftRepository.updateEmployee(shift.getId(), shift.getEmployee());
        }
    }

    /**
     * Ferma manualmente il solver in esecuzione per quel rosterId.
     */
    public void stopSolving(Long rosterId) {
        solverManager.terminateEarly(rosterId);
    }

    /**
     * Restituisce lo stato attuale del Solver (SOLVING_ACTIVE, NOT_SOLVING, ecc.).
     */
    public SolverStatus getSolverStatus(Long rosterId) {
        return solverManager.getSolverStatus(rosterId);
    }

    /**
     * Recupera lo stato attuale del Roster (con gli score e l'ultima assegnazione valida).
     */
    @Transactional(readOnly = true)
    public Roster getRoster(Long rosterId) {
        SolverStatus status = getSolverStatus(rosterId);
        Roster roster = loadRoster(rosterId);

        // Nota: in una versione avanzata puoi iniettare il SolutionManager per calcolare
        // lo score al volo anche quando il solver non è attivo.
        return roster;
    }
}