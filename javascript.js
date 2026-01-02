// URL de votre Web App Google Apps Script (à remplacer après déploiement)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbysWQY-ZWTsd-m_OHo4wYYlw3Lfx2g5NVP5_f3ogfOd8tGlMFVhm_8cP1Zwh30kpA9Z/exec';

// Variables globales
let allContacts = [];
let filteredContacts = [];
let currentPage = 1;
const resultsPerPage = 10;
let currentContact = null;
let map = null;
let marker = null;
let originalContactData = {};

// Éléments DOM
const connectionStatus = document.getElementById('connectionStatus');
const loading = document.getElementById('loading');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const locationInput = document.getElementById('locationInput');
const statusSelect = document.getElementById('statusSelect');
const resetBtn = document.getElementById('resetBtn');
const resultsContainer = document.getElementById('resultsContainer');
const resultsCount = document.getElementById('resultsCount');
const pagination = document.getElementById('pagination');

// Éléments du modal
const detailModal = document.getElementById('detailModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const printBtn = document.getElementById('printBtn');
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const modalActions = document.getElementById('modalActions');

// Fonction pour tester la connexion
async function testConnection() {
    try {
        loading.classList.add('active');
        
        const response = await fetch(`${SCRIPT_URL}?method=test`);
        const result = await response.json();
        
        if (result.success) {
            connectionStatus.textContent = `✓ Connecté à Google Sheets (${result.count} enregistrements)`;
            connectionStatus.className = 'connection-status connected';
            
            // Charger les données
            await loadData();
        } else {
            connectionStatus.textContent = `✗ Erreur de connexion: ${result.message}`;
            connectionStatus.className = 'connection-status error';
        }
    } catch (error) {
        connectionStatus.textContent = `✗ Erreur de connexion: ${error.message}`;
        connectionStatus.className = 'connection-status error';
    } finally {
        loading.classList.remove('active');
    }
}

// Fonction pour charger les données depuis Google Sheets
async function loadData() {
    try {
        loading.classList.add('active');
        
        const response = await fetch(`${SCRIPT_URL}?path=data`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        allContacts = Array.isArray(data) ? data : [];
        filteredContacts = [...allContacts];
        
        // Afficher les premiers résultats
        displayResults(filteredContacts);
        
    } catch (error) {
        console.error('Erreur de chargement:', error);
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur de chargement</h3>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        loading.classList.remove('active');
    }
}

// Fonction pour rechercher des données
async function searchContacts() {
    const searchTerm = searchInput.value.trim();
    const locationTerm = locationInput.value.trim();
    const statusTerm = statusSelect.value;
    
    try {
        loading.classList.add('active');
        
        const url = new URL(`${SCRIPT_URL}/search`);
        if (searchTerm) url.searchParams.append('searchTerm', searchTerm);
        if (locationTerm) url.searchParams.append('locationTerm', locationTerm);
        if (statusTerm) url.searchParams.append('statusTerm', statusTerm);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        filteredContacts = Array.isArray(data) ? data : [];
        currentPage = 1;
        displayResults(filteredContacts);
        
    } catch (error) {
        console.error('Erreur de recherche:', error);
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur de recherche</h3>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        loading.classList.remove('active');
    }
}

// Fonction pour afficher les résultats
function displayResults(results) {
    // Mettre à jour le compteur
    resultsCount.textContent = `${results.length} résultat${results.length !== 1 ? 's' : ''}`;
    
    // Si aucun résultat
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Aucun résultat trouvé</h3>
                <p>Essayez de modifier vos critères de recherche.</p>
            </div>
        `;
        pagination.style.display = 'none';
        return;
    }
    
    // Calculer la pagination
    const totalPages = Math.ceil(results.length / resultsPerPage);
    currentPage = Math.min(currentPage, totalPages);
    
    // Déterminer les résultats à afficher pour la page actuelle
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = Math.min(startIndex + resultsPerPage, results.length);
    const pageResults = results.slice(startIndex, endIndex);
    
    // Générer le HTML du tableau
    let tableHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Nom complet</th>
                    <th>Lieu de naissance</th>
                    <th>Date de décès</th>
                    <th>Genre</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    pageResults.forEach(contact => {
        const genderIcon = contact['Genre'] === 'Homme' 
            ? '<span class="gender-icon gender-homme"><i class="fas fa-mars"></i></span>' 
            : contact['Genre'] === 'Femme'
            ? '<span class="gender-icon gender-femme"><i class="fas fa-venus"></i></span>'
            : '';
        
        const status = contact['Emplacement'] || contact['Etat'] || '';
        const statusClass = status === 'Attribué' ? 'status-attribue' : 
                           status === 'Réservé' ? 'status-reserve' : 
                           status === 'Non attribué' ? 'status-non-attribue' : '';
        
        tableHTML += `
            <tr data-id="${contact['fid'] || ''}">
                <td>
                    <div class="person-name">${contact['prénom nom'] || 'Non renseigné'}</div>
                    <div class="person-details">${contact['Prénom'] || ''} ${contact['Nom'] || ''}</div>
                </td>
                <td>
                    <div>${contact['Ville de naissance'] || ''}</div>
                    <div class="person-details">${contact['Lieu de naissance'] || ''}</div>
                </td>
                <td>${contact['Date de décés'] || 'Non renseignée'}</td>
                <td>${genderIcon} ${contact['Genre'] || ''}</td>
                <td><span class="status-badge ${statusClass}">${status || 'Non défini'}</span></td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    resultsContainer.innerHTML = tableHTML;
    
    // Ajouter les événements aux lignes du tableau
    document.querySelectorAll('.results-table tbody tr').forEach(row => {
        row.addEventListener('click', function() {
            const contactId = this.getAttribute('data-id');
            const contact = filteredContacts.find(c => c['fid'] == contactId);
            if (contact) {
                showContactDetails(contact);
            }
        });
    });
    
    // Générer la pagination
    generatePagination(totalPages);
}

// Fonction pour afficher les détails d'un contact
function showContactDetails(contact) {
    currentContact = contact;
    originalContactData = {...contact};
    
    const fullName = contact['prénom nom'] || `${contact['Prénom'] || ''} ${contact['Nom'] || ''}`.trim();
    modalTitle.textContent = `Fiche de ${fullName || 'Personne'}`;
    
    // Générer le contenu du modal
    let modalContent = '';
    
    // Photo
    const photoUrl = contact['Url photo stèle'] || '';
    if (photoUrl) {
        if (photoUrl.startsWith('data:image') || photoUrl.includes('drive.google.com') || photoUrl.includes('http')) {
            modalContent += `
                <div class="detail-photo">
                    <img src="${photoUrl}" alt="Photo de ${fullName}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\"detail-photo-placeholder\"><i class=\"fas fa-user\"></i><p>Aucune photo disponible</p></div>'">
                </div>
            `;
        } else {
            modalContent += `
                <div class="detail-photo">
                    <div class="detail-photo-placeholder">
                        <i class="fas fa-user"></i>
                        <p>Photo disponible (lien externe)</p>
                        <p><small><a href="${photoUrl}" target="_blank">Voir la photo</a></small></p>
                    </div>
                </div>
            `;
        }
    } else {
        modalContent += `
            <div class="detail-photo">
                <div class="detail-photo-placeholder">
                    <i class="fas fa-user"></i>
                    <p>Aucune photo disponible</p>
                </div>
            </div>
        `;
    }
    
    // Définir les champs à afficher
    const fields = [
        { label: 'ID', key: 'fid', editable: false },
        { label: 'Nom complet', key: 'prénom nom', editable: true },
        { label: 'Prénom', key: 'Prénom', editable: true },
        { label: 'Nom', key: 'Nom', editable: true },
        { label: 'Titre', key: 'Gentilé', editable: true },
        { label: 'Genre', key: 'Genre', editable: true },
        { label: 'Date de naissance', key: 'Date de naissance', editable: true },
        { label: 'Lieu de naissance', key: 'Lieu de naissance', editable: true },
        { label: 'Ville de naissance', key: 'Ville de naissance', editable: true },
        { label: 'Code postal', key: 'code postal de naissance', editable: true },
        { label: 'Date de décès', key: 'Date de décés', editable: true },
        { label: 'Email', key: 'mail', editable: true },
        { label: 'Âge', key: 'Age', editable: true },
        { label: 'Téléphone', key: 'Téléphone', editable: true },
        { label: 'Numéro', key: 'Numéro', editable: true },
        { label: 'Emplacement', key: 'Emplacement', editable: true },
        { label: 'Type de concession', key: 'Type de concession', editable: true },
        { label: 'État', key: 'Etat', editable: true },
        { label: 'Latitude', key: 'Lat', editable: true },
        { label: 'Longitude', key: 'Long', editable: true }
    ];
    
    // Détails
    modalContent += `
        <div>
            <div class="details-grid">
                ${fields.map(field => `
                    <div class="detail-item">
                        <div class="detail-label">${field.label}</div>
                        <div class="detail-value ${field.editable ? 'editable' : ''}" 
                             data-field="${field.key}" 
                             contenteditable="false">
                            ${contact[field.key] || ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="map-container">
                <div id="detailMap"></div>
            </div>
            
            <div class="print-only">
                <p>Fiche imprimée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
        </div>
    `;
    
    modalBody.innerHTML = modalContent;
    
    // Initialiser la carte si des coordonnées sont disponibles
    const lat = parseFloat(contact['Lat']);
    const lon = parseFloat(contact['Long']);
    
    if (!isNaN(lat) && !isNaN(lon)) {
        setTimeout(() => {
            initMap(lat, lon);
        }, 100);
    } else {
        document.getElementById('detailMap').innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; color: #6c757d;">
                <div style="text-align: center;">
                    <i class="fas fa-map-marked-alt" style="font-size: 3rem; margin-bottom: 10px;"></i>
                    <p>Aucune coordonnée GPS disponible</p>
                </div>
            </div>
        `;
    }
    
    // Sortir du mode édition s'il est activé
    exitEditMode();
    
    // Afficher le modal
    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Initialiser la carte OpenStreetMap
function initMap(lat, lon) {
    // Supprimer la carte existante
    if (map) {
        map.remove();
    }
    
    // Créer une nouvelle carte
    map = L.map('detailMap').setView([lat, lon], 18);
    
    // Ajouter la couche OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Ajouter un marqueur
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker([lat, lon]).addTo(map)
