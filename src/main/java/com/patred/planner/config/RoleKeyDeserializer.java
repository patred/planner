package com.patred.planner.config;

import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.KeyDeserializer;
import com.patred.planner.domain.Role;
import com.patred.planner.repository.RoleRepository;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class RoleKeyDeserializer extends KeyDeserializer {

    private final RoleRepository roleRepository;

    public RoleKeyDeserializer(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public Object deserializeKey(String key, DeserializationContext ctxt) throws IOException {
        if (key == null || key.trim().isEmpty()) {
            return null;
        }

        // Cerca il Ruolo direttamente tramite la Primary Key 'code' (es. "DOCTOR_APHERESIST")
        return roleRepository.findById(key)
                .orElseGet(() -> {
                    // Fallback: se per caso il ruolo non viene trovato nel DB, restituisce un oggetto Role base con quel codice
                    Role fallbackRole = new Role();
                    fallbackRole.setCode(key);
                    return fallbackRole;
                });
    }
}