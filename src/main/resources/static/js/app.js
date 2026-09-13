const API_BASE = '/api/roster';
let pollInterval = null;
const ROSTER_ID = 1; // ID di default per la soluzione di pianificazione corrente

document.addEventListener('DOMContentLoaded', () => {
    // Imposta la data di inizio ad oggi e la data di fine a 7 giorni dopo
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    document.getElementById('startDate').value = today.toISOString().split('T')[0];
    document.getElementById('endDate').value = nextWeek.toISOString().split('T')[0];

    // Carica l'eventuale palinsesto esistente all'avvio
    loadRoster();
});

// 1. Generazione dei turni vuoti nell'intervallo di date
async function generateShifts() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert('Seleziona sia la data di inizio che la data di fine.');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert('La data di inizio non può essere successiva alla data di fine.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/generate?startDate=${startDate}&endDate=${endDate}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Turni generati con successo! Ora puoi avviare l\'ottimizzazione.');
            loadRoster();
        } else {
            alert('Errore durante la generazione dei turni.');
        }
    } catch (error) {
        console.error('Errore di connessione durante la generazione dei turni:', error);
    }
}

// 2. Avvio dell'ottimizzazione tramite il Solver Timefold
async function startSolver() {
    try {
        const response = await fetch(`${API_BASE}/solve/${ROSTER_ID}`, { method: 'POST' });
        if (response.ok) {
            updateStatusBadge('SOLVING_ACTIVE');
            startPollingStatus();
        } else {
            alert('Impossibile avviare il Solver.');
        }
    } catch (error) {
        console.error('Errore durante l\'avvio del solver:', error);
    }
}

// 3. Arresto forzato del Solver
async function stopSolver() {
    try {
        await fetch(`${API_BASE}/stop/${ROSTER_ID}`, { method: 'POST' });
        stopPolling();
        loadRoster();
    } catch (error) {
        console.error('Errore durante lo stop del solver:', error);
    }
}

// Monitoraggio in tempo reale dello stato del Solver (Polling ogni 2 secondi)
function startPollingStatus() {
    stopPolling(); // Pulizia di eventuali intervalli precedenti

    pollInterval = setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/${ROSTER_ID}/status`);
            if (res.ok) {
                const status = await res.json();
                updateStatusBadge(status);

                // Rinfresca la griglia per mostrare le assegnazioni in miglioramento
                loadRoster();

                if (status === 'NOT_SOLVING' || status === 'STOPPED') {
                    stopPolling();
                }
            }
        } catch (error) {
            console.error('Errore nel polling dello stato:', error);
            stopPolling();
        }
    }, 2000);
}

function stopPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    updateStatusBadge('NOT_SOLVING');
}

// Aggiornamento grafico del badge dello stato
function updateStatusBadge(status) {
    const badge = document.getElementById('solver-status-badge');
    if (!badge) return;

    if (status === 'SOLVING_ACTIVE' || status === 'SOLVING') {
        badge.className = 'badge status-solving';
        badge.innerText = 'Status: Ottimizzazione in corso...';
    } else {
        badge.className = 'badge status-idle';
        badge.innerText = 'Status: Inattivo';
    }
}

// 4. Recupero e rendering della griglia dei turni
async function loadRoster() {
    try {
        const res = await fetch(`${API_BASE}/${ROSTER_ID}`);
        if (res.ok) {
            const roster = await res.json();
            renderCalendarGrid(roster.shiftList || []);
        }
    } catch (error) {
        console.error('Errore durante il caricamento del palinsesto:', error);
    }
}

// Rendering HTML della tabella dei turni
function renderCalendarGrid(shiftList) {
    const container = document.getElementById('calendar-grid');

    if (!shiftList || shiftList.length === 0) {
        container.innerHTML = `<p class="placeholder-text">Nessun turno presente nel sistema per le date selezionate.</p>`;
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Data & Ora Inizio</th>
                    <th>Data & Ora Fine</th>
                    <th>Ruolo Richiesto</th>
                    <th>Dipendente Assegnato</th>
                </tr>
            </thead>
            <tbody>
    `;

    shiftList.forEach(shift => {
        const startFormatted = formatDateTime(shift.startDateTime);
        const endFormatted = formatDateTime(shift.endDateTime);
        const roleName = shift.requiredRole ? shift.requiredRole.name : 'Qualsiasi';

        let employeeBadge = '';
        if (shift.employee) {
            employeeBadge = `<span class="assigned-emp"><i class="fa-solid fa-user-check"></i> ${shift.employee.firstName} ${shift.employee.lastName}</span>`;
        } else {
            employeeBadge = `<span class="unassigned-emp"><i class="fa-solid fa-user-slash"></i> NON ASSEGNATO</span>`;
        }

        html += `
            <tr>
                <td><b>${startFormatted}</b></td>
                <td><b>${endFormatted}</b></td>
                <td><span class="role-tag">${roleName}</span></td>
                <td>${employeeBadge}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Funzione utility per formattare le date ISO in formato leggibile italiano (es. 15/09/2026 08:00)
function formatDateTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}