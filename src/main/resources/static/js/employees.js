const API_URL = '/api/employees';
const ROLES_URL = '/api/roles';

let loadedRoles = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadRoles();
    await loadEmployees();
});

// 1. Caricamento e popolazione della Select dei Ruoli
async function loadRoles() {
    try {
        const res = await fetch(ROLES_URL);
        if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);

        loadedRoles = await res.json();
        const select = document.getElementById('emp-role');
        if (!select) return;

        if (loadedRoles.length === 0) {
            select.innerHTML = '<option value="">Nessun ruolo disponibile</option>';
            return;
        }

        // Se Role usa 'code' o 'id' come PK
        select.innerHTML = '<option value="">-- Seleziona Ruolo --</option>' +
            loadedRoles.map(role => {
                const roleKey = role.code;
                const roleLabel = role.description;
                return `<option value="${roleKey}">${roleLabel}</option>`;
            }).join('');

    } catch (err) {
        console.error('Errore durante il caricamento dei ruoli:', err);
        const select = document.getElementById('emp-role');
        if (select) select.innerHTML = '<option value="">Errore caricamento ruoli</option>';
    }
}

// 2. Caricamento della Tabella Dipendenti
async function loadEmployees() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);

        const employees = await res.json();
        const tbody = document.getElementById('employees-table-body');
        if (!tbody) return;

        if (employees.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nessun dipendente presente.</td></tr>`;
            return;
        }

        tbody.innerHTML = employees.map(emp => {
            const roleName = emp.role ? emp.role.description : 'N/D';
            const roleKey = emp.role ? emp.role.code : '';

            return `
                <tr>
                    <td>${emp.id}</td>
                    <td>${emp.name}</td>
                    <td>${emp.surname}</td>
                    <td>${emp.email || '-'}</td>
                    <td><span class="role-tag">${roleName}</span></td>
                    <td>
                        <button class="btn btn-secondary" onclick="editEmployee(${emp.id}, '${escapeJs(emp.name)}', '${escapeJs(emp.surname)}', '${escapeJs(emp.email)}', '${roleKey}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteEmployee(${emp.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Errore durante il caricamento dei dipendenti:', err);
    }
}

// 3. Gestione Modale
function openModal() {
    document.getElementById('emp-id').value = '';
    document.getElementById('employee-form').reset();
    document.getElementById('modal-title').innerText = 'Nuovo Dipendente';
    document.getElementById('employee-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('employee-modal').classList.remove('show');
}

function editEmployee(id, name, surname, email, roleKey) {
    document.getElementById('emp-id').value = id;
    document.getElementById('emp-name').value = name;
    document.getElementById('emp-surname').value = surname;
    document.getElementById('emp-email').value = email;

    const roleSelect = document.getElementById('emp-role');
    if (roleSelect) roleSelect.value = roleKey;

    document.getElementById('modal-title').innerText = 'Modifica Dipendente';
    document.getElementById('employee-modal').classList.add('show');
}

// 4. Salva Dipendente (POST / PUT)
async function saveEmployee(event) {
    event.preventDefault();

    const id = document.getElementById('emp-id').value;
    const selectedRoleKey = document.getElementById('emp-role').value;

    if (!selectedRoleKey) {
        alert('Seleziona un ruolo valido.');
        return;
    }

    // Troviamo l'oggetto Role completo salvato in memoria
    const selectedRole = loadedRoles.find(r => (r.code == selectedRoleKey || r.id == selectedRoleKey));

    const payload = {
        name: document.getElementById('emp-name').value,
        surname: document.getElementById('emp-surname').value,
        email: document.getElementById('emp-email').value,
        role: selectedRole || { code: selectedRoleKey }
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Errore server (${res.status}): ${errText}`);
        }

        closeModal();
        await loadEmployees();
    } catch (err) {
        console.error('Errore nel salvataggio del dipendente:', err);
        alert('Errore durante il salvataggio. Controlla la console.');
    }
}

// 5. Elimina Dipendente
async function deleteEmployee(id) {
    if (confirm('Sei sicuro di voler eliminare questo dipendente?')) {
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadEmployees();
            } else {
                alert('Impossibile eliminare il dipendente.');
            }
        } catch (err) {
            console.error('Errore durante l\'eliminazione:', err);
        }
    }
}

// Utility per evitare rotture di apici nel codice inline onclick
function escapeJs(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}