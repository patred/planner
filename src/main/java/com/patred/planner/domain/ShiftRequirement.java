package com.patred.planner.domain;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "shift_requirements")
public class ShiftRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int count; // Quanti dipendenti servono (es. 2)

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "shift_requirement_roles",
            joinColumns = @JoinColumn(name = "requirement_id"),
            inverseJoinColumns = @JoinColumn(name = "role_code")
    )
    private Set<Role> acceptableRoles = new HashSet<>(); // Ruoli ammessi (es. [DOCTOR_APHERESIST, BIOLOGIST])

    public ShiftRequirement() {
    }

    public ShiftRequirement(int count, Set<Role> acceptableRoles) {
        this.count = count;
        this.acceptableRoles = acceptableRoles;
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public Set<Role> getAcceptableRoles() {
        return acceptableRoles;
    }

    public void setAcceptableRoles(Set<Role> acceptableRoles) {
        this.acceptableRoles = acceptableRoles;
    }
}