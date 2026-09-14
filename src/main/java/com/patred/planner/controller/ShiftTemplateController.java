package com.patred.planner.controller;

import com.patred.planner.domain.ShiftTemplate;
import com.patred.planner.repository.ShiftTemplateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shift-templates")
public class ShiftTemplateController {

    private final ShiftTemplateRepository shiftTemplateRepository;

    public ShiftTemplateController(ShiftTemplateRepository shiftTemplateRepository) {
        this.shiftTemplateRepository = shiftTemplateRepository;
    }

    /**
     * Recupera tutti i modelli di turno configurati.
     */
    @GetMapping
    public ResponseEntity<List<ShiftTemplate>> getAllTemplates() {
        List<ShiftTemplate> templates = shiftTemplateRepository.findAll();
        return ResponseEntity.ok(templates);
    }

    /**
     * Recupera un singolo modello per ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ShiftTemplate> getTemplateById(@PathVariable Long id) {
        return shiftTemplateRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Crea un nuovo modello di turno (es. Notte con relative fasce orarie e fabbisogno ruoli).
     */
    @PostMapping
    public ResponseEntity<ShiftTemplate> createTemplate(@RequestBody ShiftTemplate template) {
        ShiftTemplate savedTemplate = shiftTemplateRepository.save(template);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTemplate);
    }

    /**
     * Aggiorna un modello esistente.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ShiftTemplate> updateTemplate(@PathVariable Long id, @RequestBody ShiftTemplate updatedTemplate) {
        return shiftTemplateRepository.findById(id)
                .map(existingTemplate -> {
                    existingTemplate.setName(updatedTemplate.getName());
                    existingTemplate.setShortName(updatedTemplate.getShortName());
                    existingTemplate.setAcronym(updatedTemplate.getAcronym());
                    existingTemplate.setStartTime(updatedTemplate.getStartTime());
                    existingTemplate.setEndTime(updatedTemplate.getEndTime());

                    existingTemplate.setOnWeekdays(updatedTemplate.isOnWeekdays());
                    existingTemplate.setOnSaturday(updatedTemplate.isOnSaturday());
                    existingTemplate.setOnSunday(updatedTemplate.isOnSunday());
                    existingTemplate.setOnHolidays(updatedTemplate.isOnHolidays());
                    existingTemplate.setNightShift(updatedTemplate.isNightShift());

                    // Aggiornamento pulito della lista di fabbisogni
                    existingTemplate.getStaffRequirements().clear();
                    if (updatedTemplate.getStaffRequirements() != null) {
                        existingTemplate.getStaffRequirements().forEach(req -> {
                            existingTemplate.getStaffRequirements().add(req);
                        });
                    }

                    ShiftTemplate saved = shiftTemplateRepository.save(existingTemplate);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Elimina un modello di turno per ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        if (!shiftTemplateRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        shiftTemplateRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}