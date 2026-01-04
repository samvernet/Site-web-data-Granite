
// CONFIGURATION : Remplacez par votre URL de déploiement Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPTY4xhnCJKfgrv1yuSunibj4w7TG6Do0tsKTK7a04GvkLVI0jEMR-Z3z8fnjA7lh6/exec'; 

let allData = [];
let map = null;

async function init() {
    try {
        const response = await fetch(SCRIPT_URL);
        allData = await response.json();
        document.getElementById('resultsCount').textContent = allData.length + " enregistrements indexés";
        render(allData);
    } catch (e) { document.getElementById('resultsCount').textContent = "Erreur de connexion"; }
}

function getCleanImgUrl(url) {
    if (!url) return null;
    if (url.startsWith('data:image')) return url;
    if (url.length > 500) return `data:image/jpeg;base64,${url}`;
    if (url.includes('drive.google.com')) {
        const fileId = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1];
        return `https://docs.google.com/uc?export=view&id=${fileId}`;
    }
    return url;
}

function render(data) {
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = data.map((item, index) => `
        <div class="card" onclick="showFiche(${index})">
            <h3>${item['prénom nom']}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${item.Section || 'N/A'} — Rang ${item.Rangée || '-'}</p>
            <div class="status-pill">${item['Etat de la stèle'] || 'ACTIF'}</div>
        </div>
    `).join('');
}

function showFiche(index) {
    const item = window.currentFiltered ? window.currentFiltered[index] : allData[index];
    const lat = parseFloat(item.Lat);
    const lng = parseFloat(item.Long);

    document.getElementById('ficheNom').textContent = item['prénom nom'];
    
    document.getElementById('modalData').innerHTML = `
        <div class="info-row"><i class="fas fa-user"></i><div><label>Identité</label><span>${item['prénom nom']} (${item.Age || '?'} ans)</span></div></div>
        
        <div class="info-row"><i class="fas fa-baby"></i><div><label>Naissance</label><span>Le ${item['Date de naissance'] || '?'} à ${item['Lieu de naissance'] || item['Ville de naissance'] || '-'} (${item['code postal de naissance'] || ''})</span></div></div>
        
        <div class="info-row"><i class="fas fa-church"></i><div><label>Lieu de sépulture</label><span>${item['Nom du cimetière']}<br>${item.Commune} (${item['code postal.']})</span></div></div>
        
        <div class="info-row"><i class="fas fa-map-signs"></i><div><label>Emplacement</label><span>Secteur ${item.Section} | Rang ${item.Rangée} | N° ${item.Numéro}</span></div></div>
        
        <div style="margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 20px; border: 1px solid #edf2f7;">
            <div class="info-row"><i class="fas fa-tools"></i><div><label>État de la stèle</label><span>${item['Etat de la stèle'] || 'Non renseigné'}</span></div></div>
            <div class="info-row"><i class="fas fa-calendar-check"></i><div><label>Fin de concession</label><span style="color:#ef4444;">${item['date de renouvellement'] || 'N/A'}</span></div></div>
        </div>

        <div class="info-row"><i class="fas fa-location-arrow"></i><div><label>Coordonnées GPS</label><span style="font-family:monospace;">${lat || 'N/A'}, ${lng || 'N/A'}</span></div></div>
    `;

    const photoUrl = getCleanImgUrl(item['Url photo stèle']);
    document.getElementById('modalPhoto').innerHTML = photoUrl ? `<img src="${photoUrl}">` : `<div class="no-photo-box">Pas de photo</div>`;

    document.getElementById('detailModal').style.display = "block";

    setTimeout(() => {
        if (map) { map.remove(); map = null; }
        if (!isNaN(lat) && !isNaN(lng)) {
            map = L.map('map').setView([lat, lng], 19);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            L.marker([lat, lng]).addTo(map);
            map.invalidateSize();
        }
    }, 450);
}

document.getElementById('searchForm').onsubmit = (e) => {
    e.preventDefault();
    const q = document.getElementById('searchInput').value.toLowerCase();
    const s = document.getElementById('steleSelect').value.toLowerCase();
    const filtered = allData.filter(i => {
        const nom = (i['prénom nom'] || "").toLowerCase();
        const etat = (i['Etat de la stèle'] || "").toLowerCase();
        return nom.includes(q) && (s === "" || etat === s);
    });
    window.currentFiltered = filtered;
    render(filtered);
    document.getElementById('resultsCount').textContent = filtered.length + " résultat(s) trouvé(s)";
};

document.querySelector('.close-btn').onclick = () => { document.getElementById('detailModal').style.display = "none"; };
window.onclick = (e) => { if (e.target == document.getElementById('detailModal')) document.getElementById('detailModal').style.display = "none"; };

init();
