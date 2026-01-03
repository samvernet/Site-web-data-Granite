const SCRIPT_URL = 'VOTRE_URL_ICI';
let allData = [];
let map = null;

async function init() {
    try {
        const resp = await fetch(SCRIPT_URL);
        allData = await resp.json();
        console.log("Données chargées");
    } catch (e) { alert("Erreur de chargement"); }
}

function render(data) {
    const grid = document.getElementById('resultsGrid');
    document.getElementById('resultsCount').textContent = `${data.length} enregistrement(s) trouvé(s)`;
    window.currentFiltered = data;
    grid.innerHTML = data.map((item, i) => `
        <div class="card" onclick="openFiche(${i})">
            <h3>${item['prénom nom'] || (item.Prénom + ' ' + item.Nom)}</h3>
            <p><strong>Section :</strong> ${item.Section || '-'}</p>
            <p><strong>Décès :</strong> ${item['Date de décés'] || '-'}</p>
        </div>
    `).join('');
}

function openFiche(index) {
    const item = window.currentFiltered[index];
    const lat = parseFloat(item.Lat || item.X);
    const lng = parseFloat(item.Long || item.Y);

    document.getElementById('modalData').innerHTML = `
        <div class="info-item"><label>Défunt</label><span>${item['prénom nom'] || (item.Prénom + ' ' + item.Nom)}</span></div>
        <div class="info-item"><label>Né le</label><span>${item['Date de naissance'] || '-'} à ${item['Ville de naissance'] || '-'}</span></div>
        <div class="info-item"><label>Décédé le</label><span>${item['Date de décés'] || '-'}</span></div>
        <div class="info-item"><label>Renouvellement le</label><span style="color:red">${item['Date de renouvellement'] || 'À prévoir'}</span></div>
        <div class="info-item"><label>Localisation</label><span>Section ${item.Section || '-'} / Rang ${item.Rangée || '-'} / N° ${item.Numéro || '-'}</span></div>
        <div class="info-item"><label>GPS</label><span>${lat || 'N/A'}, ${lng || 'N/A'}</span></div>
    `;

    const photoUrl = item['Url photo stèle'];
    document.getElementById('modalPhoto').innerHTML = photoUrl ? `<img src="${photoUrl}">` : `<div style="padding:20px; background:#f0f0f0; border-radius:12px; text-align:center">Pas de photo</div>`;

    document.getElementById('detailModal').style.display = "block";

    setTimeout(() => {
        if (map) map.remove();
        if(!isNaN(lat)) {
            map = L.map('map').setView([lat, lng], 19);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            L.marker([lat, lng]).addTo(map);
        }
    }, 300);
}

document.querySelector('.close-modal').onclick = () => document.getElementById('detailModal').style.display = "none";
document.getElementById('searchForm').onsubmit = (e) => {
    e.preventDefault();
    const q = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allData.filter(c => (c['prénom nom'] || "").toLowerCase().includes(q));
    render(filtered);
};

init();
