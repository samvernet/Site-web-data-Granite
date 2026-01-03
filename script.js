const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPTY4xhnCJKfgrv1yuSunibj4w7TG6Do0tsKTK7a04GvkLVI0jEMR-Z3z8fnjA7lh6/exec';

let allContacts = [];

async function loadInitialData() {
    const dot = document.getElementById('statusDot');
    const txt = document.getElementById('statusText');
    
    try {
        const response = await fetch(SCRIPT_URL);
        allContacts = await response.json();
        dot.classList.add('active');
        txt.textContent = "Registre Synchronisé";
    } catch (e) {
        txt.textContent = "Erreur de liaison";
    }
}

function filterData(e) {
    if(e) e.preventDefault();
    
    const name = document.getElementById('searchInput').value.toLowerCase();
    const loc = document.getElementById('locationInput').value.toLowerCase();
    const status = document.getElementById('statusSelect').value;

    const filtered = allContacts.filter(c => {
        const cName = (c['prénom nom'] || `${c.Prénom} ${c.Nom}`).toLowerCase();
        const cLoc = (c['Ville de naissance'] || "").toLowerCase();
        const cStatus = c.Etat || c.État || "";
        
        return cName.includes(name) && 
               cLoc.includes(loc) && 
               (!status || cStatus === status);
    });

    renderCards(filtered);
}

function renderCards(data) {
    const container = document.getElementById('resultsGrid');
    document.getElementById('resultsMeta').textContent = `${data.length} dossier(s) trouvé(s)`;
    
    container.innerHTML = data.map(c => `
        <div class="card">
            <h3>${c['prénom nom'] || (c.Prénom + ' ' + c.Nom)}</h3>
            <p><strong>Né(e) à :</strong> ${c['Ville de naissance'] || '-'}</p>
            <p><strong>Décès :</strong> ${c['Date de décés'] || '-'}</p>
            <span class="badge badge-${(c.Etat || c.État || "").toLowerCase()}">
                ${c.Etat || c.État || "Non défini"}
            </span>
        </div>
    `).join('');
}

document.getElementById('searchForm').addEventListener('submit', filterData);
loadInitialData();
