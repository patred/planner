const API_URL = '/api/shift-templates';
const ROLES_URL = '/api/roles';
let availableRoles = [];

document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    loadRoles();
});

async function loadRoles() {
    try {
        const res = await fetch(ROLES_URL);
        availableRoles = await res.json();
    } catch (err) {
        console.error('Errore durante il recupero dei ruoli:', err);
    }
}

async function loadTemplates() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const tbody = document.getElementById('templates-table-body');

        tbody.innerHTML = data.map(tpl => {
            // Elaboriamo la Map<Role, Integer> ritornata da Spring
            let reqsHtml = 'Nessun vincolo';
            if (tpl.requiredStaff && Object.keys(tpl.requiredStaff).length > 0) {
                reqsHtml = Object.entries(tpl.requiredStaff)
                    .map(([roleCode, qty]) => `<span class="req-badge">${qty}x ${roleCode}</span>`)
                    .join(' ');
            }

            return `
                <tr>
                    <td>${tpl.id}</td>
                    <td><b>${tpl.name}</b></td>
                    <td>${tpl.startTime}</td>
                    <td>${tpl.endTime}</td>
                    <td>${reqsHtml}</td>
                    <td>
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

function openModal() {
    document.getElementById('template-form').reset();

    // Genera dinamica della lista input per ciascun ruolo disponibile
    const reqContainer = document.getElementById('role-requirements-list');
    reqContainer.innerHTML = availableRoles.map(role => `
        <div class="role-req-item">
            <label>${role.name}:</label>
            <input type="number" data-role-id="${role.id}" class="form-control role-qty-input" value="0" min="0" style="width: 80px;">
        </div>
    `).join('');

    document.getElementById('template-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('template-modal').classList.remove('show');
}

async function saveTemplate(event) {
    event.preventDefault();

    // Costruisci il dizionario (Map) del fabbisogno per ruolo
    const requiredStaffMap = {};
    document.querySelectorAll('.role-qty-input').forEach(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
            const roleId = input.getAttribute('data-role-id');
            // Nota: passa la struttura dell'entità Role o la chiave a seconda di come è mappata la tua Map JPA
            requiredStaffMap[roleId] = qty;
        }
    });

    const payload = {
        name: document.getElementById('tpl-name').value,
        startTime: document.getElementById('tpl-start').value + ':00',
        endTime: document.getElementById('tpl-end').value + ':00',
        requiredStaff: requiredStaffMap
    };

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    closeModal();
    loadTemplates();
}

async function deleteTemplate(id) {
    if (confirm('Sei sicuro di voler eliminare questo template?')) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        loadTemplates();
    }
}