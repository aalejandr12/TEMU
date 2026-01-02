// ==============================================
// CONFIGURACIÓN DE OAUTH 2.0 GOOGLE
// ==============================================

// CLIENT ID de Google OAuth (obtener en Google Cloud Console)
// Este es público y puede estar en el código del frontend
const GOOGLE_CLIENT_ID = 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com';

// ID del Google Sheet
const SHEET_ID = '1vQGDZI70YYqCd5-eOcGXgguxjhvvJZWn3sc0cpAXatA274963QQqW1SGk5AWY8jtZdnbqs6kFy4F-W_';
const RANGE = 'A1:H500';

// Dominio permitido (solo usuarios de este dominio pueden acceder)
const ALLOWED_DOMAIN = 'aeropost.com';

// Scopes necesarios para Google Sheets
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

// ==============================================
// VARIABLES GLOBALES
// ==============================================

let tokenClient;
let accessToken = null;
let currentShipments = [];
let currentPage = 1;
let totalPages = 1;

// ==============================================
// INICIALIZAR GOOGLE IDENTITY SERVICES
// ==============================================

function initGoogleAuth() {
    // Cargar la librería de Google Identity Services
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.error) {
                console.error('Error de autenticación:', response);
                showError('Error al autenticar. Por favor, intenta de nuevo.');
                showLoginButton();
                return;
            }
            
            accessToken = response.access_token;
            
            // Verificar el dominio del usuario
            verifyUserDomain();
        },
        error_callback: (error) => {
            console.error('Error en OAuth:', error);
            showError('Error de autenticación');
            showLoginButton();
        }
    });
}

// ==============================================
// VERIFICAR DOMINIO DEL USUARIO
// ==============================================

async function verifyUserDomain() {
    try {
        // Obtener información del usuario autenticado
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('No se pudo verificar el usuario');
        }
        
        const userInfo = await response.json();
        const userEmail = userInfo.email;
        const userDomain = userEmail.split('@')[1];
        
        console.log('Usuario autenticado:', userEmail);
        
        // Verificar que el usuario sea del dominio permitido
        if (userDomain !== ALLOWED_DOMAIN) {
            showError(`Acceso denegado. Solo usuarios de @${ALLOWED_DOMAIN} pueden acceder.`);
            logout();
            return;
        }
        
        // Usuario válido, guardar info y cargar dashboard
        saveUserSession(userInfo);
        hideLoginButton();
        showUserInfo(userInfo);
        initDashboard();
        
    } catch (error) {
        console.error('Error al verificar dominio:', error);
        showError('Error al verificar usuario');
        logout();
    }
}

// ==============================================
// GUARDAR SESIÓN DEL USUARIO
// ==============================================

function saveUserSession(userInfo) {
    const sessionData = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('aeropost_user_session', JSON.stringify(sessionData));
    localStorage.setItem('aeropost_access_token', accessToken);
}

// ==============================================
// CARGAR SESIÓN GUARDADA
// ==============================================

function loadSavedSession() {
    const savedToken = localStorage.getItem('aeropost_access_token');
    const savedSession = localStorage.getItem('aeropost_user_session');
    
    if (savedToken && savedSession) {
        accessToken = savedToken;
        const userInfo = JSON.parse(savedSession);
        
        // Verificar que el token aún sea válido
        verifyTokenValidity().then(isValid => {
            if (isValid) {
                hideLoginButton();
                showUserInfo(userInfo);
                initDashboard();
            } else {
                // Token expirado, limpiar y mostrar login
                logout();
            }
        });
    } else {
        showLoginButton();
    }
}

// ==============================================
// VERIFICAR VALIDEZ DEL TOKEN
// ==============================================

async function verifyTokenValidity() {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        return response.ok;
    } catch (error) {
        return false;
    }
}

// ==============================================
// MOSTRAR INFORMACIÓN DEL USUARIO
// ==============================================

function showUserInfo(userInfo) {
    const userAvatarEl = document.getElementById('user-avatar');
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    
    if (userAvatarEl) userAvatarEl.src = userInfo.picture;
    if (userNameEl) userNameEl.textContent = userInfo.name || userInfo.email.split('@')[0];
    if (userRoleEl) userRoleEl.textContent = userInfo.email;
}

// ==============================================
// MOSTRAR/OCULTAR BOTÓN DE LOGIN
// ==============================================

function showLoginButton() {
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.classList.remove('hidden');
    }
}

function hideLoginButton() {
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.classList.add('hidden');
    }
}

// ==============================================
// MANEJAR LOGIN
// ==============================================

function handleLogin() {
    if (!tokenClient) {
        showError('Error: Sistema de autenticación no inicializado');
        return;
    }
    
    // Solicitar token de acceso
    tokenClient.requestAccessToken({
        prompt: 'consent',
        hd: ALLOWED_DOMAIN // Hosted domain - sugiere cuentas de este dominio
    });
}

// ==============================================
// CERRAR SESIÓN
// ==============================================

function logout() {
    // Revocar token si existe
    if (accessToken) {
        google.accounts.oauth2.revoke(accessToken, () => {
            console.log('Token revocado');
        });
    }
    
    // Limpiar almacenamiento
    localStorage.removeItem('aeropost_access_token');
    localStorage.removeItem('aeropost_user_session');
    accessToken = null;
    
    // Mostrar pantalla de login
    showLoginButton();
    
    // Limpiar dashboard
    document.getElementById('shipments-tbody').innerHTML = '';
}

// ==============================================
// OBTENER DATOS DE GOOGLE SHEETS CON OAUTH
// ==============================================

async function fetchSheetData() {
    if (!accessToken) {
        console.error('No hay token de acceso');
        showLoginButton();
        return { shipments: [], stats: {} };
    }
    
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            // Token expirado
            console.log('Token expirado, solicitando nuevo login');
            logout();
            return { shipments: [], stats: {} };
        }
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return parseSheetData(data.values);
    } catch (error) {
        console.error('Error al obtener datos del sheet:', error);
        showError('No se pudieron cargar los datos del Google Sheet.');
        return { shipments: [], stats: {} };
    }
}

// ==============================================
// PARSEAR DATOS DEL SHEET
// ==============================================

function parseSheetData(rows) {
    if (!rows || rows.length === 0) {
        return { shipments: [], stats: {} };
    }

    const headers = rows[0];
    const shipments = [];
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue;

        const shipment = {
            mawbFirstLeg: row[0] || '',
            mawbSecondLeg: row[1] || '',
            status: row[2] || 'Pending',
            reviewStartDate: row[3] || '',
            reviewEndDate: row[4] || '',
            timeToComplete: row[5] || '',
            reference: row[6] || '',
            comments: row[7] || ''
        };

        shipments.push(shipment);
    }

    const stats = calculateStats(shipments);
    return { shipments, stats };
}

// ==============================================
// CALCULAR ESTADÍSTICAS
// ==============================================

function calculateStats(shipments) {
    const stats = {
        review: 0,
        pending: 0,
        transmissions: 0,
        inspection: 0,
        released: 0,
        total: shipments.length
    };

    shipments.forEach(shipment => {
        const status = shipment.status.toLowerCase();
        if (status.includes('review')) stats.review++;
        else if (status.includes('pending')) stats.pending++;
        else if (status.includes('transmission')) stats.transmissions++;
        else if (status.includes('inspection')) stats.inspection++;
        else if (status.includes('released')) stats.released++;
    });

    stats.reviewPercent = Math.round((stats.review / stats.total) * 100) || 0;
    stats.pendingPercent = Math.round((stats.pending / stats.total) * 100) || 0;
    stats.transmissionsPercent = Math.round((stats.transmissions / stats.total) * 100) || 0;
    stats.inspectionPercent = Math.round((stats.inspection / stats.total) * 100) || 0;
    stats.releasedPercent = Math.round((stats.released / stats.total) * 100) || 0;

    return stats;
}

// ==============================================
// RENDERIZAR ESTADÍSTICAS
// ==============================================

function renderStatsCards(stats) {
    document.getElementById('stat-review').textContent = stats.review;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-transmissions').textContent = stats.transmissions;
    document.getElementById('stat-inspection').textContent = stats.inspection;
    document.getElementById('stat-released').textContent = stats.released;
}

// ==============================================
// RENDERIZAR GRÁFICO DE DISTRIBUCIÓN
// ==============================================

function renderDistributionChart(stats) {
    const chartElement = document.getElementById('distribution-chart');
    const gradient = `conic-gradient(
        #22c55e 0% ${stats.releasedPercent}%, 
        #3b82f6 ${stats.releasedPercent}% ${stats.releasedPercent + stats.reviewPercent}%, 
        #a855f7 ${stats.releasedPercent + stats.reviewPercent}% ${stats.releasedPercent + stats.reviewPercent + stats.transmissionsPercent}%, 
        #eab308 ${stats.releasedPercent + stats.reviewPercent + stats.transmissionsPercent}% ${stats.releasedPercent + stats.reviewPercent + stats.transmissionsPercent + stats.pendingPercent}%, 
        #f97316 ${stats.releasedPercent + stats.reviewPercent + stats.transmissionsPercent + stats.pendingPercent}% 100%
    )`;
    chartElement.style.background = gradient;

    document.getElementById('chart-total').textContent = stats.total;
    document.getElementById('legend-released').textContent = `Released (${stats.releasedPercent}%)`;
    document.getElementById('legend-review').textContent = `Review (${stats.reviewPercent}%)`;
    document.getElementById('legend-transmission').textContent = `Transmission (${stats.transmissionsPercent}%)`;
    document.getElementById('legend-pending').textContent = `Pending (${stats.pendingPercent}%)`;
    document.getElementById('legend-inspection').textContent = `Inspection (${stats.inspectionPercent}%)`;
}

// ==============================================
// RENDERIZAR GRÁFICO DE BARRAS
// ==============================================

function renderBarChart(stats) {
    const maxValue = Math.max(stats.review, stats.pending, stats.transmissions, stats.inspection, stats.released);
    
    document.getElementById('bar-review').style.height = `${(stats.review / maxValue) * 100}%`;
    document.getElementById('bar-pending').style.height = `${(stats.pending / maxValue) * 100}%`;
    document.getElementById('bar-transmissions').style.height = `${(stats.transmissions / maxValue) * 100}%`;
    document.getElementById('bar-inspection').style.height = `${(stats.inspection / maxValue) * 100}%`;
    document.getElementById('bar-released').style.height = `${(stats.released / maxValue) * 100}%`;

    document.getElementById('tooltip-review').textContent = stats.review;
    document.getElementById('tooltip-pending').textContent = stats.pending;
    document.getElementById('tooltip-transmissions').textContent = stats.transmissions;
    document.getElementById('tooltip-inspection').textContent = stats.inspection;
    document.getElementById('tooltip-released').textContent = stats.released;
}

// ==============================================
// RENDERIZAR TABLA
// ==============================================

function renderShipmentsTable(shipments, page = 1, perPage = 10) {
    const tbody = document.getElementById('shipments-tbody');
    tbody.innerHTML = '';

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedShipments = shipments.slice(start, end);

    paginatedShipments.forEach((shipment, index) => {
        const row = createShipmentRow(shipment, start + index === 0);
        tbody.appendChild(row);
    });

    updatePagination(shipments.length, page, perPage);
}

function createShipmentRow(shipment, isHighlighted = false) {
    const tr = document.createElement('tr');
    const statusClass = getStatusClass(shipment.status);
    
    if (isHighlighted) {
        tr.className = 'bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 transition-colors';
    } else {
        tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors';
    }

    tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">${shipment.mawbFirstLeg}</td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-400">${shipment.mawbSecondLeg}</td>
        <td class="px-6 py-4">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                ${shipment.status}
            </span>
        </td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-400">
            <div class="flex flex-col text-[11px] leading-tight">
                <span>Start: ${shipment.reviewStartDate}</span>
                <span class="text-slate-400">End: ${shipment.reviewEndDate}</span>
            </div>
        </td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-400">${shipment.timeToComplete}</td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-400">${shipment.reference}</td>
        <td class="px-6 py-4 text-slate-500 dark:text-slate-500 truncate max-w-xs text-xs" title="${shipment.comments}">${shipment.comments}</td>
    `;

    return tr;
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('review')) {
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    } else if (statusLower.includes('pending')) {
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
    } else if (statusLower.includes('transmission')) {
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
    } else if (statusLower.includes('inspection')) {
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
    } else if (statusLower.includes('released')) {
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800';
    }
    return 'bg-slate-100 text-slate-800';
}

// ==============================================
// PAGINACIÓN
// ==============================================

function updatePagination(totalItems, page, perPage) {
    currentPage = page;
    totalPages = Math.ceil(totalItems / perPage);

    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, totalItems);

    document.getElementById('pagination-info').innerHTML = `
        Showing <span class="font-medium text-slate-900 dark:text-white">${start}</span> to 
        <span class="font-medium text-slate-900 dark:text-white">${end}</span> of 
        <span class="font-medium text-slate-900 dark:text-white">${totalItems}</span> results
    `;

    document.getElementById('btn-prev').disabled = page === 1;
    document.getElementById('btn-next').disabled = page === totalPages;
}

// ==============================================
// BÚSQUEDA
// ==============================================

function searchShipments(query) {
    const filtered = currentShipments.filter(shipment => {
        const searchString = `${shipment.mawbFirstLeg} ${shipment.mawbSecondLeg} ${shipment.status} ${shipment.reference}`.toLowerCase();
        return searchString.includes(query.toLowerCase());
    });

    renderShipmentsTable(filtered, 1, 10);
}

// ==============================================
// MOSTRAR ERROR
// ==============================================

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="material-symbols-outlined">error</span>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ==============================================
// ACTUALIZAR ÚLTIMA ACTUALIZACIÓN
// ==============================================

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleString('es-ES', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    });
    document.getElementById('last-updated').textContent = `Última actualización: ${timeString}`;
}

// ==============================================
// INICIALIZAR DASHBOARD
// ==============================================

async function initDashboard() {
    try {
        console.log('Cargando datos del dashboard...');

        const { shipments, stats } = await fetchSheetData();
        
        if (shipments.length === 0) {
            showError('No hay datos disponibles en el Google Sheet');
            return;
        }
        
        currentShipments = shipments;

        renderStatsCards(stats);
        renderDistributionChart(stats);
        renderBarChart(stats);
        renderShipmentsTable(shipments, 1, 10);
        updateLastUpdated();

        console.log('Dashboard cargado exitosamente');
    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
        showError('Error al cargar el dashboard');
    }
}

// ==============================================
// EVENT LISTENERS
// ==============================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Google Auth cuando la librería esté lista
    if (typeof google !== 'undefined' && google.accounts) {
        initGoogleAuth();
        loadSavedSession();
    } else {
        console.error('Google Identity Services no está cargado');
        showError('Error al cargar sistema de autenticación');
    }

    // Botón de login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    // Botón de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (currentShipments.length > 0) {
                searchShipments(e.target.value);
            }
        });
    }

    // Paginación
    document.getElementById('btn-prev')?.addEventListener('click', () => {
        if (currentPage > 1) {
            renderShipmentsTable(currentShipments, currentPage - 1, 10);
        }
    });

    document.getElementById('btn-next')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            renderShipmentsTable(currentShipments, currentPage + 1, 10);
        }
    });

    // Refresh manual
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (accessToken) {
                initDashboard();
            }
        });
    }

    // Auto-refresh cada 5 minutos
    setInterval(() => {
        if (accessToken) {
            initDashboard();
        }
    }, 5 * 60 * 1000);
});
