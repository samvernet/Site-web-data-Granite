// REMPLACEZ PAR VOTRE URL DE DEPLOIEMENT GOOGLE APPS SCRIPT
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPTY4xhnCJKfgrv1yuSunibj4w7TG6Do0tsKTK7a04GvkLVI0jEMR-Z3z8fnjA7lh6/exec';

let allContacts = [];

// 1. Initialisation : Charger les données
async function loadData() {
    const status = document.getElementById('connectionStatus');
    try {
        const response = await fetch(SCRIPT_URL);
        allContacts = await response.json();
        status.textContent = "● Système Synchronisé";
        status.style.color = "#4ade80";
        // Optionnel : afficher tout au début ? render(allContacts);
    } catch (e) {
        status.textContent = "Erreur de connexion";
        status.style.color = "#f87171";
    }
}

// 2. Filtrer et Afficher
function search() {
    const name = document.getElementById('searchInput').value.toLowerCase().trim();
    const loc = document.getElementById('locationInput').value.toLowerCase().trim();
    const status = document.getElementById('statusSelect').value;

    const filtered = allContacts.filter(c => {
        const cName = (c['prénom nom'] || `${c.Prénom} ${c.Nom}`).toLowerCase();
        const cLoc = (c['Ville de naissance'] || "").toLowerCase();
        const cStatus = c.Etat || c.État || "";

        return cName.includes(name) && 
               cLoc.includes(loc) && 
               (!status || cStatus === status);
    });

    render(filtered);
}

function render(data) {
    const grid = document.getElementById('resultsGrid');
    document.getElementById('resultsCount').textContent = `${data.length} dossier(s) trouvé(s)`;
    
    window.currentFiltered = data; // Stocker pour le modal

    grid.innerHTML = data.map((item, index) => `
        <div class="card" onclick="openDetail(${index})">
            <h3>${item['prénom nom'] || (item.Prénom + ' ' + item.Nom)}</h3>
            <p><i class="fas fa-calendar-alt"></i> Décès : ${item['Date de décés'] || '-'}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${item['Ville de naissance'] || '-'}</p>
            <div style="margin-top:15px; font-weight:bold; color:var(--accent); font-size:0.8rem;">
                CLIQUEZ POUR LA FICHE →
            </div>
        </div>
    `).join('');
}

// 3. Fenêtre Modale (Fiche Détaillée)
function openDetail(index) {
    const item = window.currentFiltered[index];
    const dataContainer = document.getElementById('modalData');
    const photoContainer = document.getElementById('modalPhoto');

    // Noms des colonnes (adaptez si nécessaire)
    const section = item['Section'] || item['Carré'] || 'Non définie';
    const rangee = item['Rangée'] || item['Numéro de rangée'] || 'N/A';
    const num = item['Numéro'] || item['fid'] || '-';

    dataContainer.innerHTML = `
        <h2 style="font-family:'Playfair Display', serif; font-size:2.2rem; margin-bottom:30px;">Fiche Individuelle</h2>
        <div class="modal-body-layout">
            <div>
                <div class="info-item"><label>Nom Complet</label><span>${item['prénom nom'] || (item.Prénom + ' ' + item.Nom)}</span></div>
                <div class="info-item"><label>Naissance</label><span>${item['Date de naissance'] || '-'} à ${item['Ville de naissance'] || '-'}</span></div>
                <div class="info-item"><label>Date de Décès</label><span>${item['Date de décés'] || item['Date de décès'] || '-'}</span></div>
                <div class="info-item"><label>État Civil / Statut</label><span>${item.Etat || item.État || 'Non renseigné'}</span></div>
                
                <div class="location-box">
                    <div class="loc-tag"><strong>Section :</strong> ${section}</div>
                    <div class="loc-tag"><strong>Rangée :</strong> ${rangee}</div>
                    <div class="loc-tag"><strong>N° :</strong> ${num}</div>
                </div>
            </div>
            <div id="photoInside"></div>
        </div>
    `;

    const photoUrl = item['Url photo stèle'] || item['Photo'];
    const photoDiv = document.getElementById('photoInside');
    if (photoUrl && photoUrl.includes('http')) {
        photoDiv.innerHTML = `<img src="${photoUrl}" alt="Stèle" style="width:100%; border-radius:15px; box-shadow:0 10px 20px rgba(0,0,0,0.1);">`;
    } else {
        photoDiv.innerHTML = `<div style="height:250px; background:#f1f5f9; border-radius:15px; display:flex; align-items:center; justify-content:center; color:#94a3b8; border:2px dashed #cbd5e1;">Aucune photo</div>`;
    }

    document.getElementById('detailModal').style.display = "block";
}

// Fermeture
document.querySelector('.close-modal').onclick = () => document.getElementById('detailModal').style.display = "none";
window.onclick = (e) => { if(e.target.className === 'modal') document.getElementById('detailModal').style.display = "none"; }

// Ecouteur Formulaire
document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    search();
});

loadData();
