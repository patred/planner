package com.patred.planner.domain;

import ai.timefold.solver.core.api.domain.lookup.PlanningId;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Employee {
    @Id
    @PlanningId
    private String id;
    private String name;

    public Employee() {
    }

    public Employee(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
