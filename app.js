// ==============================================
// CONFIGURACIÓN DE GOOGLE SHEETS
// ==============================================

// URL del Google Sheet publicado (CSV export)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYnuk6-GJMrz-g1KE7uwImL4XfhOkyTegMbWMhkrFjKj1yWflxoGApozkV-b5j3rNMGx0fKyf_B4IN/pub?output=csv';

// ID de la hoja (gid) - Por defecto es 0 para la primera hoja
const SHEET_GID = '0';

// ==============================================
// FUNCIÓN PARA OBTENER DATOS DE GOOGLE SHEETS
// ==============================================

async function fetchSheetData() {
    try {
        // Fetch del CSV publicado
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        return parseSheetData(rows);
    } catch (error) {
        console.error('Error al obtener datos del sheet:', error);
        showError('No se pudieron cargar los datos del Google Sheet. Verifica que esté publicado correctamente.');
        return { shipments: [], stats: getEmptyStats() };
    }
}

// ==============================================
// PARSEAR CSV A ARRAY
// ==============================================

function parseCSV(text) {
    const rows = [];
    const lines = text.split('\n');
    
    for (let line of lines) {
        if (!line.trim()) continue;
        
        // Simple CSV parser (maneja comillas básicas)
        const row = [];
        let cell = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(cell.trim());
                cell = '';
            } else {
                cell += char;
            }
        }
        row.push(cell.trim());
        rows.push(row);
    }
    
    return rows;
}

// ==============================================
// ESTADÍSTICAS VACÍAS
// ==============================================

function getEmptyStats() {
    return {
        review: 0,
        pending: 0,
        transmissions: 0,
        inspection: 0,
        released: 0,
        total: 0,
        reviewPercent: 0,
        pendingPercent: 0,
        transmissionsPercent: 0,
        inspectionPercent: 0,
        releasedPercent: 0
    };
}

// ==============================================
// PARSEAR DATOS DEL SHEET
// ==============================================

function parseSheetData(rows) {
    if (!rows || rows.length === 0) {
        console.warn('No hay datos en el Google Sheet');
        return { shipments: [], stats: getEmptyStats() };
    }

    // Asume que la primera fila son encabezados
    const headers = rows[0];
    const shipments = [];

    // Mapeo de columnas del Google Sheet:
    // 0: MAWB first leg
    // 1: MAWB second leg
    // 2: Status
    // 3: Start review
    // 4: End review
    // 5: Time to complete
    // 6: Prealerta
    // 7: Arribo
    // 8: Liberacion
    // 9: PO liberados Referencias
    // 10: Comentario
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue; // Salta filas vacías

        const shipment = {
            mawbFirstLeg: row[0] || '',
            mawbSecondLeg: row[1] || '',
            status: row[2] || 'Pending',
            reviewStartDate: row[3] || '',
            reviewEndDate: row[4] || '',
            timeToComplete: row[5] || '',
            prealerta: row[6] || '',
            arribo: row[7] || '',
            liberacion: row[8] || '',
            reference: row[9] || '',
            comments: row[10] || ''
        };

        shipments.push(shipment);
    }

    // Calcular estadísticas
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

    // Calcular porcentajes
    stats.reviewPercent = Math.round((stats.review / stats.total) * 100) || 0;
    stats.pendingPercent = Math.round((stats.pending / stats.total) * 100) || 0;
    stats.transmissionsPercent = Math.round((stats.transmissions / stats.total) * 100) || 0;
    stats.inspectionPercent = Math.round((stats.inspection / stats.total) * 100) || 0;
    stats.releasedPercent = Math.round((stats.released / stats.total) * 100) || 0;

    return stats;
}

// ==============================================
// DATOS DE EJEMPLO ELIMINADOS
// Ya no se usan datos mock, solo datos reales del Google Sheet
// ==============================================

// ==============================================
// RENDERIZAR ESTADÍSTICAS EN CARDS
// ==============================================

function renderStatsCards(stats) {
    document.getElementById('stat-review').textContent = stats.review || 0;
    document.getElementById('stat-pending').textContent = stats.pending || 0;
    document.getElementById('stat-transmissions').textContent = stats.transmissions || 0;
    document.getElementById('stat-inspection').textContent = stats.inspection || 0;
    document.getElementById('stat-released').textContent = stats.released || 0;
}

// ==============================================
// RENDERIZAR GRÁFICO DE DISTRIBUCIÓN
// ==============================================

function renderDistributionChart(stats) {
    const chartElement = document.getElementById('distribution-chart');
    
    if (stats.total === 0) {
        chartElement.style.background = '#f1f5f9'; // slate-100
        document.getElementById('chart-total').textContent = '0';
    } else {
        const gradient = `conic-gradient(
            #22c55e 0% ${stats.releasedPercent}%, 
            #3b82f6 ${stats.releasedPercent}% ${stats.releasedPercent + stats.reviewPercent}%, 
            #a855f7 ${stats.releasedPercent + stats.reviewPercent}% ${stats.releasedPercent + stats.reviewPercent + stats.transmissionsPercent}%, 
            #eab308 ${stats.releasedPercent + stats.reviewPercent + stats.transmissionsPercent}% ${stats.releasedPercent + stats.reviewPercent + stats.transmissionsPercent + stats.pendingPercent}%, 
            #f97316 ${stats.releasedPercent + stats.reviewPercent + stats.transmissionsPercent + stats.pendingPercent}% 100%
        )`;
        chartElement.style.background = gradient;
        document.getElementById('chart-total').textContent = stats.total;
    }

    // Actualizar leyendas
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
    const maxValue = Math.max(stats.review, stats.pending, stats.transmissions, stats.inspection, stats.released, 1);
    
    document.getElementById('bar-review').style.height = maxValue > 0 ? `${(stats.review / maxValue) * 100}%` : '0%';
    document.getElementById('bar-pending').style.height = maxValue > 0 ? `${(stats.pending / maxValue) * 100}%` : '0%';
    document.getElementById('bar-transmissions').style.height = maxValue > 0 ? `${(stats.transmissions / maxValue) * 100}%` : '0%';
    document.getElementById('bar-inspection').style.height = maxValue > 0 ? `${(stats.inspection / maxValue) * 100}%` : '0%';
    document.getElementById('bar-released').style.height = maxValue > 0 ? `${(stats.released / maxValue) * 100}%` : '0%';

    // Tooltips
    document.getElementById('tooltip-review').textContent = stats.review || 0;
    document.getElementById('tooltip-pending').textContent = stats.pending || 0;
    document.getElementById('tooltip-transmissions').textContent = stats.transmissions || 0;
    document.getElementById('tooltip-inspection').textContent = stats.inspection || 0;
    document.getElementById('tooltip-released').textContent = stats.released || 0;
}

// ==============================================
// RENDERIZAR TABLA DE ENVÍOS
// ==============================================

function renderShipmentsTable(shipments, page = 1, perPage = 5) {
    const tbody = document.getElementById('shipments-tbody');
    tbody.innerHTML = '';

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedShipments = shipments.slice(start, end);

    paginatedShipments.forEach((shipment, index) => {
        const row = createShipmentRow(shipment, start + index === 0);
        tbody.appendChild(row);
    });

    // Actualizar paginación
    updatePagination(shipments.length, page, perPage);
}

// ==============================================
// CREAR FILA DE ENVÍO
// ==============================================

function createShipmentRow(shipment, isHighlighted = false) {
    const tr = document.createElement('tr');
    const statusClass = getStatusClass(shipment.status);
    const statusColor = getStatusColor(shipment.status);
    
    if (isHighlighted) {
        tr.className = `bg-${statusColor}-50/50 hover:bg-${statusColor}-50 dark:bg-${statusColor}-900/10 dark:hover:bg-${statusColor}-900/20 transition-colors group ring-1 ring-inset ring-${statusColor}-200 dark:ring-${statusColor}-800`;
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
    `;

    return tr;
}

// ==============================================
// HELPER: OBTENER CLASE DE STATUS
// ==============================================

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

function getStatusColor(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('review')) return 'blue';
    if (statusLower.includes('pending')) return 'yellow';
    if (statusLower.includes('transmission')) return 'purple';
    if (statusLower.includes('inspection')) return 'orange';
    if (statusLower.includes('released')) return 'green';
    return 'slate';
}

// ==============================================
// ACTUALIZAR PAGINACIÓN
// ==============================================

let currentPage = 1;
let totalPages = 1;
let currentShipments = [];

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

    // Actualizar número de página
    document.getElementById('current-page-btn').textContent = page;

    // Actualizar botones
    document.getElementById('btn-prev').disabled = page === 1;
    document.getElementById('btn-next').disabled = page === totalPages;
}

// ==============================================
// BÚSQUEDA DE ENVÍOS
// ==============================================

function searchShipments(query) {
    const filtered = currentShipments.filter(shipment => {
        const searchString = `${shipment.mawbFirstLeg} ${shipment.mawbSecondLeg} ${shipment.status} ${shipment.reference}`.toLowerCase();
        return searchString.includes(query.toLowerCase());
    });

    renderShipmentsTable(filtered, 1, 5);
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
    document.getElementById('last-updated').textContent = `Last updated: ${timeString}`;
}

// ==============================================
// INICIALIZAR DASHBOARD
// ==============================================

async function initDashboard() {
    try {
        console.log('Cargando datos desde Google Sheets...');

        // Obtener datos
        const { shipments, stats } = await fetchSheetData();
        
        if (shipments.length === 0) {
            showError('No se encontraron datos en el Google Sheet. Verifica que el Sheet tenga datos y esté configurado correctamente.');
            currentShipments = [];
            renderStatsCards(getEmptyStats());
            renderDistributionChart(getEmptyStats());
            renderBarChart(getEmptyStats());
            document.getElementById('shipments-tbody').innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-500">No hay datos disponibles</td></tr>';
            return;
        }
        
        currentShipments = shipments;

        // Renderizar todo
        renderStatsCards(stats);
        renderDistributionChart(stats);
        renderBarChart(stats);
        renderShipmentsTable(shipments, 1, 10);
        updateLastUpdated();

        console.log(`Dashboard cargado exitosamente con ${shipments.length} registros`);
    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
        showError('Error al cargar el dashboard. Revisa la consola para más detalles.');
    }
}

// ==============================================
// EVENT LISTENERS
// ==============================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar dashboard
    initDashboard();

    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchShipments(e.target.value);
        });
    }

    // Paginación
    document.getElementById('btn-prev')?.addEventListener('click', () => {
        if (currentPage > 1) {
            renderShipmentsTable(currentShipments, currentPage - 1, 5);
        }
    });

    document.getElementById('btn-next')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            renderShipmentsTable(currentShipments, currentPage + 1, 5);
        }
    });

    // Refresh cada 5 minutos
    setInterval(() => {
        initDashboard();
    }, 5 * 60 * 1000);
});
