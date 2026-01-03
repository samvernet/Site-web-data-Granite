const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPTY4xhnCJKfgrv1yuSunibj4w7TG6Do0tsKTK7a04GvkLVI0jEMR-Z3z8fnjA7lh6/exec'; // L'URL de votre Apps Script
let allContacts = [];

async function init() {
    try {
        const response = await fetch(SCRIPT_URL);
        allContacts = await response.json();
        document.getElementById('connectionStatus').textContent = "● Système Prêt";
        document.getElementById('connectionStatus').style.color = "#4ade80";
    } catch (e) {
        document.getElementById('connectionStatus').textContent = "Erreur réseau";
    }
}

function render(data) {
    const grid = document.getElementById('resultsGrid');
    document.getElementById('resultsCount').textContent = `${data.length} dossier(s) trouvé(s)`;
    
    grid.innerHTML = data.map(item => `
        <div class="card">
            <h3>${item['prénom nom'] || (item.Prénom + ' ' + item.Nom)}</h3>
            <p><strong>Lieu :</strong> ${item['Ville de naissance'] || '-'}</p>
            <p><strong>Décès :</strong> ${item['Date de décés'] || '-'}</p>
            <div class="badge badge-${(item.Etat || "").toLowerCase()}">${item.Etat || 'N/A'}</div>
        </div>
    `).join('');
}

document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.toLowerCase();
    const loc = document.getElementById('locationInput').value.toLowerCase();
    const status = document.getElementById('statusSelect').value;

    const filtered = allContacts.filter(c => {
        const nameMatch = (c['prénom nom'] || "").toLowerCase().includes(query);
        const locMatch = (c['Ville de naissance'] || "").toLowerCase().includes(loc);
        const statusMatch = !status || c.Etat === status;
        return nameMatch && locMatch && statusMatch;
    });
    render(filtered);
});

init();
