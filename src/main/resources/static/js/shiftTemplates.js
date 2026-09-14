const API_URL = '/api/shift-templates';
const ROLES_URL = '/api/roles';

let loadedRoles = [];
let loadedTemplates = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Carichiamo prima i ruoli, poi i template
    await loadRoles();
    await loadTemplates();
});

// 1. Carica i ruoli
async function loadRoles() {
    try {
        const res = await fetch(ROLES_URL);
        if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);
        loadedRoles = await res.json();
    } catch (err) {
        console.error('Errore durante il caricamento dei ruoli:', err);
        loadedRoles = [];
    }
}

// Genera dinamicamente gli input del fabbisogno per ruolo
function renderRequirementsForm(requirementsMap = {}) {
    const container = document.getElementById('roles-requirements-container');
    if (!container) return;

    if (!loadedRoles || loadedRoles.length === 0) {
        container.innerHTML = '<p style="font-size:0.85rem; color:#64748b; margin:0;">Nessun ruolo presente nel sistema.</p>';
        return;
    }

    container.innerHTML = loadedRoles.map(role => {
        const roleCode = role.code;
        const roleName = role.description;

        // Recupera il valore se presente nella mappa restituita da Spring Boot
        let count = 0;
        if (requirementsMap && typeof requirementsMap === 'object') {
            // Cerca sia per codice esatto sia controllando se la chiave corrisponde
            Object.keys(requirementsMap).forEach(key => {
                if (key === roleCode || key === role.description) {
                    count = requirementsMap[key];
                }
            });
        }

        return `
            <div class="requirement-row">
                <span>${roleName}</span>
                <input type="number" 
                       id="req-role-${roleCode}" 
                       data-role-key="${roleCode}" 
                       class="role-req-input" 
                       min="0" 
                       value="${count}" 
                       placeholder="0">
            </div>
        `;
    }).join('');
}

// 2. Carica la lista dei Template
async function loadTemplates() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);

        loadedTemplates = await res.json();
        const tbody = document.getElementById('templates-table-body');
        if (!tbody) return;

        if (loadedTemplates.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nessun template turno presente.</td></tr>`;
            return;
        }

        tbody.innerHTML = loadedTemplates.map(tpl => {
            const daysHtml = `
                <span class="day-tag ${tpl.onWeekdays ? 'active' : ''}">Fer</span>
                <span class="day-tag ${tpl.onSaturday ? 'active' : ''}">Sab</span>
                <span class="day-tag ${tpl.onSunday ? 'active' : ''}">Dom</span>
                <span class="day-tag ${tpl.onHolidays ? 'active' : ''}">Fest</span>
                ${tpl.nightShift ? '<span class="night-tag"><i class="fa-solid fa-moon"></i> Notte</span>' : ''}
            `;

            let reqHtml = '';
            if (tpl.requiredStaff && Object.keys(tpl.requiredStaff).length > 0) {
                Object.entries(tpl.requiredStaff).forEach(([roleObj, count]) => {
                    if (count > 0) {
                        let rName = roleObj;
                        const foundRole = loadedRoles.find(r => r.code === roleObj || String(r.id) === roleObj);
                        if (foundRole) rName = foundRole.name;

                        reqHtml += `<span class="req-pill">${rName}: <b>${count}</b></span>`;
                    }
                });
            }
            if (!reqHtml) reqHtml = '<span style="color:#94a3b8; font-size:0.85rem;">Nessuno</span>';

            return `
                <tr>
                    <td>
                        <span class="badge-acronym">${tpl.acronym}</span>
                        <b>${tpl.name}</b> ${tpl.shortName ? `(${tpl.shortName})` : ''}
                    </td>
                    <td><b>${tpl.startTime || ''} - ${tpl.endTime || ''}</b></td>
                    <td>${daysHtml}</td>
                    <td>${reqHtml}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="editTemplate(${tpl.id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteTemplate(${tpl.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('Errore durante il caricamento dei template:', err);
    }
}

// 3. Apertura e Chiusura Modale (Garantito il funzionamento)
async function openModal() {
    // Se per qualsiasi motivo i ruoli non sono stati caricati all'inizio, li ricarica prima di aprire
    if (!loadedRoles || loadedRoles.length === 0) {
        await loadRoles();
    }

    const modal = document.getElementById('template-modal');
    const form = document.getElementById('template-form');

    if (form) form.reset();
    document.getElementById('template-id').value = '';

    // Default: feriali selezionato
    const weekdaysChk = document.getElementById('tpl-onWeekdays');
    if (weekdaysChk) weekdaysChk.checked = true;

    document.getElementById('modal-title').innerText = 'Nuovo Template Turno';

    // Popola gli input dei ruoli azzerati
    renderRequirementsForm();

    // Mostra la modale
    if (modal) {
        modal.classList.add('show');
    } else {
        console.error('Elemento #template-modal non trovato nel DOM HTML!');
    }
}

function closeModal() {
    const modal = document.getElementById('template-modal');
    if (modal) modal.classList.remove('show');
}

// 4. Modifica Template
function editTemplate(id) {
    const tpl = loadedTemplates.find(t => t.id === id);
    if (!tpl) return;

    document.getElementById('template-id').value = tpl.id;
    document.getElementById('tpl-name').value = tpl.name || '';
    document.getElementById('tpl-shortName').value = tpl.shortName || '';
    document.getElementById('tpl-acronym').value = tpl.acronym || '';

    document.getElementById('tpl-startTime').value = tpl.startTime ? tpl.startTime.substring(0, 5) : '';
    document.getElementById('tpl-endTime').value = tpl.endTime ? tpl.endTime.substring(0, 5) : '';

    document.getElementById('tpl-onWeekdays').checked = tpl.onWeekdays || false;
    document.getElementById('tpl-onSaturday').checked = tpl.onSaturday || false;
    document.getElementById('tpl-onSunday').checked = tpl.onSunday || false;
    document.getElementById('tpl-onHolidays').checked = tpl.onHolidays || false;
    document.getElementById('tpl-nightShift').checked = tpl.nightShift || false;

    renderRequirementsForm(tpl.requiredStaff || {});

    document.getElementById('modal-title').innerText = 'Modifica Template Turno';
    document.getElementById('template-modal').classList.add('show');
}

// 5. Salva Template (POST / PUT)
async function saveTemplate(event) {
    event.preventDefault();

    const id = document.getElementById('template-id').value;
    const requiredStaff = {};
    const reqInputs = document.querySelectorAll('.role-req-input');

    reqInputs.forEach(input => {
        const count = parseInt(input.value) || 0;
        const roleKey = input.getAttribute('data-role-key');

        if (count > 0 && roleKey) {
            const roleObj = loadedRoles.find(r => (r.code === roleKey || String(r.id) === roleKey));
            if (roleObj) {
                requiredStaff[roleObj.code || roleObj.id] = count;
            }
        }
    });

    const payload = {
        name: document.getElementById('tpl-name').value,
        shortName: document.getElementById('tpl-shortName').value,
        acronym: document.getElementById('tpl-acronym').value,
        startTime: document.getElementById('tpl-startTime').value + ':00',
        endTime: document.getElementById('tpl-endTime').value + ':00',
        onWeekdays: document.getElementById('tpl-onWeekdays').checked,
        onSaturday: document.getElementById('tpl-onSaturday').checked,
        onSunday: document.getElementById('tpl-onSunday').checked,
        onHolidays: document.getElementById('tpl-onHolidays').checked,
        nightShift: document.getElementById('tpl-nightShift').checked,
        requiredStaff: requiredStaff
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const res = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Errore server (${res.status}): ${errText}`);
        }

        closeModal();
        await loadTemplates();
    } catch (err) {
        console.error('Errore durante il salvataggio del template:', err);
        alert('Errore durante il salvataggio. Verificare la console.');
    }
}

// 6. Elimina Template
async function deleteTemplate(id) {
    if (confirm('Sei sicuro di voler eliminare questo template di turno?')) {
        try {
            const res = await fetch(`${API_URL}/${id}`, {method: 'DELETE'});
            if (res.ok) {
                await loadTemplates();
            } else {
                alert('Impossibile eliminare il template.');
            }
        } catch (err) {
            console.error('Errore durante l\'eliminazione:', err);
        }
    }
}