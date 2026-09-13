package com.patred.planner.config;

import com.patred.planner.domain.Role;
import com.patred.planner.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initRoles(RoleRepository roleRepository) {
        return args -> {
            if (roleRepository.count() == 0) {
                roleRepository.saveAll(List.of(
                        new Role("DOCTOR_APHERESIST", "Medico Aferesista"),
                        new Role("DOCTOR_NOT_APHERESIST", "Medico non Aferesista"),
                        new Role("BIOLOGIST", "Biologo")
                ));
            }
        };
    }
}
