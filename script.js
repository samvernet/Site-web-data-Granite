
// CONFIGURATION : Remplacez par votre URL de déploiement Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPTY4xhnCJKfgrv1yuSunibj4w7TG6Do0tsKTK7a04GvkLVI0jEMR-Z3z8fnjA7lh6/exec'; 

let allData = [];
let map = null;

// 1. CHARGEMENT DES DONNÉES
async function loadData() {
    try {
        const response = await fetch(SCRIPT_URL);
        allData = await response.json();
        document.getElementById('resultsCount').textContent = "Base de données chargée. Prêt pour la recherche.";
    } catch (e) {
        console.error("Erreur de chargement :", e);
        document.getElementById('resultsCount').textContent = "Erreur lors de la récupération des données.";
    }
}

// 2. NETTOYAGE DES LIENS PHOTOS (Drive, Base64, Web)
function getCleanImgUrl(url) {
    if (!url || url.trim() === "") return null;
    
    // Cas du Base64 (on ajoute le header s'il manque)
    if (url.startsWith('data:image')) return url;
    if (url.length > 500 && !url.includes('http')) {
        return `data:image/jpeg;base64,${url}`;
    }

    // Cas Google Drive : Transformation en lien direct
    if (url.includes('drive.google.com')) {
        let fileId = "";
        if (url.includes('/d/')) {
            fileId = url.split('/d/')[1].split('/')[0];
        } else if (url.includes('id=')) {
            fileId = url.split('id=')[1].split('&')[0];
        }
        return `https://docs.google.com/uc?export=view&id=${fileId}`;
    }

    return url; // Lien web standard
}

// 3. AFFICHAGE DES RÉSULTATS DANS LA GRILLE
function render(data) {
    const grid = document.getElementById('resultsGrid');
    document.getElementById('resultsCount').textContent = `${data.length} résultat(s) trouvé(s)`;
    
    grid.innerHTML = data.map((item, index) => `
        <div class="card" onclick="showFiche(${index})">
            <h3>${item['prénom nom'] || (item.Prénom + ' ' + item.Nom)}</h3>
            <p><strong>Section :</strong> ${item.Section || '-'}</p>
            <p><strong>Emplacement :</strong> ${item.Numéro || '-'}</p>
        </div>
    `).join('');
}

// 4. OUVERTURE DE LA FICHE DÉTAILLÉE
function showFiche(index) {
    // On récupère l'item soit dans les résultats filtrés, soit dans la liste globale
    const item = window.currentFiltered ? window.currentFiltered[index] : allData[index];
    const dataContainer = document.getElementById('modalData');
    
    // Coordonnées X (Lat) et Y (Long)
    const lat = parseFloat(item.Lat || item.X);
    const lng = parseFloat(item.Long || item.Y);

    // Remplissage des textes (Ajout Renouvellement et Coordonnées)
    dataContainer.innerHTML = `
        <div class="info-row"><label>Défunt</label><span>${item['prénom nom'] || (item.Prénom + ' ' + item.Nom)}</span></div>
        <div class="info-row"><label>Dates</label><span>${item['Date de naissance'] || '?'} — ${item['Date de décés'] || '?'}</span></div>
        <div class="info-row"><label>Date de Renouvellement</label><span style="color:red;">${item['Date de renouvellement'] || 'À PRÉVOIR'}</span></div>
        <div class="info-row"><label>Emplacement</label><span>Section ${item.Section || '-'} | Rang ${item.Rangée || '-'} | N° ${item.Numéro || '-'}</span></div>
        <div class="info-row"><label>Coordonnées GPS (X/Y)</label><span>${lat || 'N/A'} , ${lng || 'N/A'}</span></div>
    `;

    // Gestion de la photo avec le correctif
    const rawPhotoUrl = item['Url photo stèle'];
    const cleanPhotoUrl = getCleanImgUrl(rawPhotoUrl);

    if (cleanPhotoUrl) {
        document.getElementById('modalPhoto').innerHTML = `<img src="${cleanPhotoUrl}" style="max-height:280px; width:100%; object-fit:contain; border:1px solid #ddd; margin-bottom:15px;">`;
    } else {
        document.getElementById('modalPhoto').innerHTML = `<div style="padding:20px; background:#f5f5f5; text-align:center; color:#999; margin-bottom:15px;">Aucune photo disponible</div>`;
    }

    // Affichage de la modale
    document.getElementById('detailModal').style.display = "block";

    // 5. INITIALISATION OPENSTREETMAP (Correctif de stabilité)
    setTimeout(() => {
        // Nettoyage de l'ancienne carte si elle existe
        if (map) { 
            map.remove(); 
            map = null; 
        }
        
        if (!isNaN(lat) && !isNaN(lng)) {
            // Création de la carte Leaflet utilisant OpenStreetMap
            map = L.map('map').setView([lat, lng], 19);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 20,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            L.marker([lat, lng]).addTo(map);
            
            // INDISPENSABLE : Force le rafraîchissement car la modale change la visibilité du div
            map.invalidateSize();
        } else {
            document.getElementById('map').innerHTML = "<p style='padding:20px; text-align:center;'>Coordonnées GPS manquantes pour la carte.</p>";
        }
    }, 300); // Délai pour laisser la modale s'ouvrir graphiquement
}

// 6. GESTION DES ÉVÉNEMENTS
document.querySelector('.close-btn').onclick = () => {
    document.getElementById('detailModal').style.display = "none";
};

// Recherche
document.getElementById('searchForm').onsubmit = (e) => {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = allData.filter(item => {
        const nomComplet = (item['prénom nom'] || (item.Prénom + " " + item.Nom)).toLowerCase();
        return nomComplet.includes(query);
    });
    
    window.currentFiltered = filtered;
    render(filtered);
};

// Lancement au démarrage
loadData();
