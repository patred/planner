const API_URL = '/api/shift-templates';
const ROLES_URL = '/api/roles';

let loadedRoles = [];
let loadedTemplates = [];

// Lista temporanea per le regole correntemente in fase di inserimento/modifica nella modale
let currentRequirements = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Carichiamo prima i ruoli, poi i template
    await loadRoles();
    await loadTemplates();
});

// 1. Carica la lista dei ruoli disponibili
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

// 2. Renderizza le regole di fabbisogno all'interno del form della modale
function renderRequirementsRules() {
    const container = document.getElementById('requirements-rules-container');
    if (!container) return;

    if (!loadedRoles || loadedRoles.length === 0) {
        container.innerHTML = '<p style="font-size:0.85rem; color:#64748b; margin:0;">Nessun ruolo presente nel sistema.</p>';
        return;
    }

    if (currentRequirements.length === 0) {
        container.innerHTML = `<p style="font-size:0.85rem; color:#94a3b8; font-style:italic; margin: 5px 0;">Nessuna regola definita. Clicca su "+ Aggiungi Regola".</p>`;
        return;
    }

    container.innerHTML = currentRequirements.map((req, index) => {
        // Estrae la lista dei codici dei ruoli già selezionati per questa regola
        const selectedRoleCodes = (req.acceptableRoles || []).map(r => typeof r === 'string' ? r : r.code);

        const rolesCheckboxesHtml = loadedRoles.map(role => {
            const isChecked = selectedRoleCodes.includes(role.code) ? 'checked' : '';
            return `
                <label style="font-size: 0.8rem; display: flex; align-items: center; gap: 4px; background: #ffffff; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: pointer;">
                    <input type="checkbox" class="req-role-checkbox" data-rule-index="${index}" value="${role.code}" ${isChecked}>
                    ${role.description || role.code}
                </label>
            `;
        }).join('');

        return `
            <div class="requirement-rule-card" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 6px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.85rem; font-weight: 600; color: #334155;">Persone necessarie:</span>
                        <input type="number" min="1" value="${req.count || 1}" 
                               onchange="currentRequirements[${index}].count = parseInt(this.value) || 1" 
                               style="width: 60px; padding: 3px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-weight: 600; text-align: center;">
                    </div>
                    <button type="button" onclick="removeRequirementRule(${index})" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer; font-size:0.85rem;">
                        <i class="fa-solid fa-xmark"></i> Rimuovi
                    </button>
                </div>
                <div>
                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; display: block; margin-bottom: 4px;">Ruoli ammissibili in alternativa:</span>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${rolesCheckboxesHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Listener sui checkbox dei ruoli per aggiornare la struttura JS in tempo reale
    document.querySelectorAll('.req-role-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const ruleIdx = parseInt(e.target.getAttribute('data-rule-index'));
            const roleCode = e.target.value;

            if (!currentRequirements[ruleIdx].acceptableRoles) {
                currentRequirements[ruleIdx].acceptableRoles = [];
            }

            if (e.target.checked) {
                currentRequirements[ruleIdx].acceptableRoles.push({ code: roleCode });
            } else {
                currentRequirements[ruleIdx].acceptableRoles = currentRequirements[ruleIdx].acceptableRoles.filter(
                    r => (typeof r === 'string' ? r : r.code) !== roleCode
                );
            }
        });
    });
}

// Aggiunge una nuova regola di fabbisogno vuota
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'btn-add-requirement-rule') {
        currentRequirements.push({ count: 1, acceptableRoles: [] });
        renderRequirementsRules();
    }
});

// Rimuove una regola di fabbisogno specificata
window.removeRequirementRule = function(index) {
    currentRequirements.splice(index, 1);
    renderRequirementsRules();
};

// 3. Carica e mostra la lista dei Template nella tabella
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

            // Formattazione pulita delle regole di fabbisogno (es. 2x [Medico o Biologo])
            let reqHtml = '';
            if (tpl.staffRequirements && tpl.staffRequirements.length > 0) {
                reqHtml = tpl.staffRequirements.map(req => {
                    const rolesList = (req.acceptableRoles || []).map(r => {
                        const code = typeof r === 'string' ? r : r.code;
                        const found = loadedRoles.find(lr => lr.code === code);
                        return found ? (found.description || found.code) : code;
                    }).join(' / ');

                    return `<div class="req-pill" style="display:block; margin-bottom:4px;">
                                <b>${req.count}x</b> [${rolesList || 'Nessun ruolo selezionato'}]
                            </div>`;
                }).join('');
            } else {
                reqHtml = '<span style="color:#94a3b8; font-size:0.85rem;">Nessuno</span>';
            }

            return `
                <tr>
                    <td>
                        <span class="badge-acronym">${tpl.acronym || ''}</span>
                        <b>${tpl.name || ''}</b> ${tpl.shortName ? `(${tpl.shortName})` : ''}
                    </td>
                    <td><b>${tpl.startTime ? tpl.startTime.substring(0, 5) : ''} - ${tpl.endTime ? tpl.endTime.substring(0, 5) : ''}</b></td>
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

// 4. Apertura e Chiusura Modale
async function openModal() {
    if (!loadedRoles || loadedRoles.length === 0) {
        await loadRoles();
    }

    const modal = document.getElementById('template-modal');
    const form = document.getElementById('template-form');

    if (form) form.reset();
    document.getElementById('template-id').value = '';

    const weekdaysChk = document.getElementById('tpl-onWeekdays');
    if (weekdaysChk) weekdaysChk.checked = true;

    document.getElementById('modal-title').innerText = 'Nuovo Template Turno';

    // Azzera le regole di fabbisogno per il nuovo inserimento
    currentRequirements = [];
    renderRequirementsRules();

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

// 5. Modifica Template
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

    // Clona le regole per non mutare direttamente quelle caricati in memoria prima del salvataggio
    currentRequirements = tpl.staffRequirements ? JSON.parse(JSON.stringify(tpl.staffRequirements)) : [];
    renderRequirementsRules();

    document.getElementById('modal-title').innerText = 'Modifica Template Turno';
    document.getElementById('template-modal').classList.add('show');
}

// 6. Salva Template (POST / PUT)
async function saveTemplate(event) {
    event.preventDefault();

    const id = document.getElementById('template-id').value;

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
        staffRequirements: currentRequirements
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

// 7. Elimina Template
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