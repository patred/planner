package com.patred.planner.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.awt.*;
import java.io.IOException;
import java.net.URI;

@Component
public class BrowserLauncher {

    private static final Logger log = LoggerFactory.getLogger(BrowserLauncher.class);
    private static final String APP_URL = "http://localhost:8080";

    @EventListener(ApplicationReadyEvent.class)
    public void openBrowserOnStartup() {
        // Disattiva il flag headless prima di richiedere l'integrazione Desktop AWT
        System.setProperty("java.awt.headless", "false");

        log.info("Server Spring Boot avviato con successo. Apertura browser su {}...", APP_URL);

        // Tentativo 1: Uso dell'API standard AWT Desktop
        if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
            try {
                Desktop.getDesktop().browse(new URI(APP_URL));
                return;
            } catch (Exception e) {
                log.warn("Impossibile aprire il browser tramite AWT Desktop: {}", e.getMessage());
            }
        }

        // Tentativo 2: Fallback tramite comandi nativi del Sistema Operativo
        openBrowserFallback(APP_URL);
    }

    private void openBrowserFallback(String url) {
        String os = System.getProperty("os.name").toLowerCase();
        Runtime runtime = Runtime.getRuntime();

        try {
            if (os.contains("win")) {
                // Windows
                runtime.exec(new String[]{"rundll32", "url.dll,FileProtocolHandler", url});
            } else if (os.contains("mac")) {
                // macOS
                runtime.exec(new String[]{"open", url});
            } else if (os.contains("nix") || os.contains("nux")) {
                // Linux / Ubuntu
                runtime.exec(new String[]{"xdg-open", url});
            } else {
                log.error("Sistema operativo non supportato per il lancio automatico del browser: {}", os);
            }
        } catch (IOException e) {
            log.error("Errore durante il lancio del browser tramite fallback OS: {}", e.getMessage());
        }
    }
}
