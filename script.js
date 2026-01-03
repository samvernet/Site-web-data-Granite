// CONFIGURATION : Collez votre URL ici
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPTY4xhnCJKfgrv1yuSunibj4w7TG6Do0tsKTK7a04GvkLVI0jEMR-Z3z8fnjA7lh6/exec';

let allContacts = [];

// Sélection des éléments
const searchForm = document.getElementById('searchForm');
const resultsContainer = document.getElementById('resultsTableContainer');
const resultsCount = document.getElementById('resultsCount');
const statusBadge = document.getElementById('connectionStatus');
const loading = document.getElementById('loading');

// 1. Fonction pour normaliser le texte (ignore les accents)
function normalizeText(text) {
    if (!text) return "";
    return text.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// 2. Charger les données au démarrage
async function fetchSheetData() {
    loading.style.display = 'block';
    resultsContainer.innerHTML = '';
    
    try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) throw new Error('Erreur réseau');
        
        allContacts = await response.json();
        
        statusBadge.textContent = "✓ Connecté au registre";
        statusBadge.className = "status-bar connected";
        
        // Optionnel : Afficher tout au début ? 
        // displayResults(allContacts); 
        
    } catch (error) {
        console.error(error);
        statusBadge.textContent = "✗ Erreur : Impossible de joindre Google Sheets";
        statusBadge.className = "status-bar error";
    } finally {
        loading.style.display = 'none';
    }
}

// 3. Logique de filtrage
function filterData(e) {
    if(e) e.preventDefault();

    const nameQuery = normalizeText(document.getElementById('searchInput').value);
    const locQuery = normalizeText(document.getElementById('locationInput').value);
    const statusQuery = document.getElementById('statusSelect').value;

    const filtered = allContacts.filter(item => {
        // On fusionne nom et prénom pour chercher dans les deux
        const combinedName = normalizeText(`${item['prénom nom']} ${item['Nom']} ${item['Prénom']}`);
        const city = normalizeText(item['Ville de naissance'] || item['Lieu de naissance']);
        const currentStatus = item['Etat'] || item['État'] || item['Emplacement'] || "";

        const matchesName = !nameQuery || combinedName.includes(nameQuery);
        const matchesLoc = !locQuery || city.includes(locQuery);
        const matchesStatus = !statusQuery || currentStatus.toLowerCase().includes(statusQuery.toLowerCase());

        return matchesName && matchesLoc && matchesStatus;
    });

    displayResults(filtered);
}

// 4. Affichage du tableau
function displayResults(data) {
    resultsCount.textContent = `${data.length} résultat${data.length > 1 ? 's' : ''}`;

    if (data.length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Aucun résultat trouvé pour ces critères.</p></div>';
        return;
    }

    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Défunt</th>
                    <th>Naissance</th>
                    <th>Décès</th>
                    <th>État</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(item => {
        const etat = item['Etat'] || item['État'] || item['Emplacement'] || "-";
        const badgeClass = etat.includes("Attrib") ? "badge-attribue" : (etat.includes("Réserv") ? "badge-reserve" : "");
        
        tableHtml += `
            <tr>
                <td><strong>${item['prénom nom'] || (item['Prénom'] + ' ' + item['Nom'])}</strong></td>
                <td>${item['Ville de naissance'] || '-'}</td>
                <td>${item['Date de décés'] || item['Date de décès'] || '-'}</td>
                <td><span class="status-badge ${badgeClass}">${etat}</span></td>
            </tr>
        `;
    });

    tableHtml += '</tbody></table>';
    resultsContainer.innerHTML = tableHtml;
}

// Événements
searchForm.addEventListener('submit', filterData);
document.getElementById('resetBtn').addEventListener('click', () => {
    searchForm.reset();
    displayResults([]);
});

// Lancement
fetchSheetData();
