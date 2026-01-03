const SCRIPT_URL = 'VOTRE_URL_ICI'; // URL Google Apps Script
let allContacts = [];
let map = null;

async function loadData() {
    const status = document.getElementById('connectionStatus');
    try {
        const response = await fetch(SCRIPT_URL);
        allContacts = await response.json();
        status.textContent = "● Base de données synchronisée";
        status.style.background = "#27ae60"; status.style.color = "white";
    } catch (e) {
        status.textContent = "✗ Erreur de connexion";
        status.style.background = "#e74c3c";
    }
}

function render(data) {
    const grid = document.getElementById('resultsGrid');
    document.getElementById('resultsCount').textContent = `${data.length} résultat(s) trouvé(s)`;
    window.currentFiltered = data;

    grid.innerHTML = data.map((item, index) => `
        <div class="card" onclick="openDetail(${index})">
            <h3>${item['prénom nom'] || (item.Prénom + ' ' + item.Nom)}</h3>
            <p><strong>Lieu :</strong> ${item['Ville de naissance'] || '-'}</p>
            <p><strong>Emplacement :</strong> ${item.Section || ''} / ${item.Numéro || ''}</p>
        </div>
    `).join('');
}

function openDetail(index) {
    const item = window.currentFiltered[index];
    const dataContainer = document.getElementById('modalData');
    const photoContainer = document.getElementById('modalPhoto');
    const lat = parseFloat(item.Lat || item.X);
    const lng = parseFloat(item.Long || item.Y);

    dataContainer.innerHTML = `
        <h2 style="margin-bottom:20px; color:#2c3e50;">Fiche de renseignement</h2>
        <div class="info-item"><label>Nom Complet</label><span>${item['prénom nom'] || (item.Prénom + ' ' + item.Nom)}</span></div>
        <div class="info-item"><label>Naissance</label><span>${item['Date de naissance'] || '-'} à ${item['Ville de naissance'] || '-'}</span></div>
        <div class="info-item"><label>Date de Décès</label><span>${item['Date de décés'] || '-'}</span></div>
        <div class="info-item"><label>Renouvellement Concession</label><span style="color:#c0392b;">${item['Date de renouvellement'] || 'Non spécifié'}</span></div>
        <div class="info-item"><label>Coordonnées GPS</label><span style="font-family:monospace;">${lat || '-'}, ${lng || '-'}</span></div>
        <div style="background:#f9f9f9; padding:15px; border-radius:4px; margin-top:10px;">
            <strong>Localisation :</strong> Section ${item.Section || '-'} | Rangée ${item.Rangée || '-'} | N° ${item.Numéro || '-'}
        </div>
    `;

    const photoUrl = item['Url photo stèle'];
    photoContainer.innerHTML = photoUrl ? `<img src="${photoUrl}">` : `<div style="height:200px; background:#eee; display:flex; align-items:center; justify-content:center;">Aucune photo</div>`;

    document.getElementById('detailModal').style.display = "block";

    // CARTE
    setTimeout(() => {
        if (map) map.remove();
        if(!isNaN(lat) && !isNaN(lng)) {
            map = L.map('map').setView([lat, lng], 19);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            L.marker([lat, lng]).addTo(map);
        }
    }, 200);
}

document.querySelector('.close-modal').onclick = () => document.getElementById('detailModal').style.display = "none";
document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allContacts.filter(c => (c['prénom nom'] || "").toLowerCase().includes(query));
    render(filtered);
});

loadData();
