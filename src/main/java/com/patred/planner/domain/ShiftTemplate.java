package com.patred.planner.domain;

import jakarta.persistence.*;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "shift_templates")
public class ShiftTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;        // es. "Notte Reparto"
    private String shortName;   // es. "Notte"
    private String acronym;     // es. "N"

    private LocalTime startTime; // es. 20:00
    private LocalTime endTime;   // es. 08:00

    // Giorni di applicazione
    private boolean onWeekdays = true;  // Feriali (Lunedì - Venerdì)
    private boolean onSaturday = false;  // Sabato
    private boolean onSunday = false;    // Domenica
    private boolean onHolidays = false;  // Festivi infrasettimanali
    private boolean nightShift = false;  // Turno notturno

    // Fabbisogno di personale per Ruolo
    // Esempio: { MEDICO: 1, INFERMIERE: 2 }
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "shift_template_requirements", joinColumns = @JoinColumn(name = "shift_template_id"))
    @MapKeyJoinColumn(name = "role_code")
    @Column(name = "required_count")
    private Map<Role, Integer> requiredStaff = new HashMap<>();

    public ShiftTemplate() {
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public String getAcronym() {
        return acronym;
    }

    public void setAcronym(String acronym) {
        this.acronym = acronym;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public boolean isOnWeekdays() {
        return onWeekdays;
    }

    public void setOnWeekdays(boolean onWeekdays) {
        this.onWeekdays = onWeekdays;
    }

    public boolean isOnSaturday() {
        return onSaturday;
    }

    public void setOnSaturday(boolean onSaturday) {
        this.onSaturday = onSaturday;
    }

    public boolean isOnSunday() {
        return onSunday;
    }

    public void setOnSunday(boolean onSunday) {
        this.onSunday = onSunday;
    }

    public boolean isOnHolidays() {
        return onHolidays;
    }

    public void setOnHolidays(boolean onHolidays) {
        this.onHolidays = onHolidays;
    }

    public boolean isNightShift() {
        return nightShift;
    }

    public void setNightShift(boolean nightShift) {
        this.nightShift = nightShift;
    }

    public Map<Role, Integer> getRequiredStaff() {
        return requiredStaff;
    }

    public void setRequiredStaff(Map<Role, Integer> requiredStaff) {
        this.requiredStaff = requiredStaff;
    }
}
