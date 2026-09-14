package com.patred.planner.domain;

import ai.timefold.solver.core.api.domain.entity.PlanningEntity;
import ai.timefold.solver.core.api.domain.lookup.PlanningId;
import ai.timefold.solver.core.api.domain.variable.PlanningVariable;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "shifts")
@PlanningEntity
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Riferimento al modello da cui è stato generato
    @ManyToOne(optional = false)
    @JoinColumn(name = "template_id")
    private ShiftTemplate template;

    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;

    // Regola di fabbisogno collegata (contiene il set di ruoli compatibili)
    @ManyToOne(optional = false)
    @JoinColumn(name = "shift_requirement_id")
    private ShiftRequirement requirement;

    // Dipendente assegnato da Timefold a questo specifico posto
    @PlanningVariable
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    public Shift() {
    }

    public Shift(ShiftTemplate template, LocalDateTime startDateTime, LocalDateTime endDateTime, ShiftRequirement requirement) {
        this.template = template;
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
        this.requirement = requirement;
    }

    @PlanningId
    public String getPlanningId() {
        return id != null ? String.valueOf(id) : null;
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ShiftTemplate getTemplate() {
        return template;
    }

    public void setTemplate(ShiftTemplate template) {
        this.template = template;
    }

    public LocalDateTime getStartDateTime() {
        return startDateTime;
    }

    public void setStartDateTime(LocalDateTime startDateTime) {
        this.startDateTime = startDateTime;
    }

    public LocalDateTime getEndDateTime() {
        return endDateTime;
    }

    public void setEndDateTime(LocalDateTime endDateTime) {
        this.endDateTime = endDateTime;
    }

    public ShiftRequirement getRequirement() {
        return requirement;
    }

    public void setRequirement(ShiftRequirement requirement) {
        this.requirement = requirement;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }
}