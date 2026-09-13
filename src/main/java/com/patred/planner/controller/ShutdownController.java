package com.patred.planner.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class ShutdownController {

    @Autowired
    private ConfigurableApplicationContext context;

    @PostMapping("/shutdown")
    public String shutdown() {
        // Avvia l'arresto in un thread separato per consentire al server di inviare la risposta HTTP 200 OK alla UI
        new Thread(() -> {
            try {
                Thread.sleep(500);
            } catch (InterruptedException ignored) {
            }
            context.close();
            System.exit(0);
        }).start();

        return "Applicazione arrestata con successo.";
    }
}
