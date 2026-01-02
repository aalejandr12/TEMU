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
// VARIABLES GLOBALES PARA FILTROS
// ==============================================

let allShipments = []; // Todos los datos sin filtrar

// Filtro global de año (aplica a ambos gráficos)
let globalYearFilter = 'all';

// Filtros independientes para gráfico de distribución
let distributionFilters = {
    status: 'all',
    dateFrom: null,
    dateTo: null
};

// Filtros independientes para gráfico de barras
let barFilters = {
    status: 'all',
    dateFrom: null,
    dateTo: null
};

// ==============================================
// FUNCIÓN PARA PARSEAR FECHA
// ==============================================

function parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;
    
    // Intenta varios formatos: DD/MM/YYYY, D/M/YYYY, etc.
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Meses en JS empiezan en 0
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    return null;
}

// ==============================================
// FUNCIÓN PARA APLICAR FILTROS
// ==============================================

function applyFilters() {
    let filtered = [...allShipments];
    
    // Filtro GLOBAL por año (basado en Prealerta) - afecta a todos
    if (globalYearFilter && globalYearFilter !== 'all') {
        filtered = filtered.filter(shipment => {
            const prealertaDate = parseDate(shipment.prealerta);
            // Si no tiene fecha, incluirlo de todos modos
            if (!prealertaDate) return true;
            return prealertaDate.getFullYear().toString() === globalYearFilter;
        });
    }
    
    // Aplicar filtros del gráfico de distribución
    let filteredDistribution = [...filtered];
    
    if (distributionFilters.status && distributionFilters.status !== 'all') {
        filteredDistribution = filteredDistribution.filter(shipment => 
            shipment.status.toLowerCase().includes(distributionFilters.status.toLowerCase())
        );
    }
    
    if (distributionFilters.dateFrom) {
        const fromDate = new Date(distributionFilters.dateFrom);
        filteredDistribution = filteredDistribution.filter(shipment => {
            const arriboDate = parseDate(shipment.arribo);
            if (!arriboDate) return false;
            return arriboDate >= fromDate;
        });
    }
    
    if (distributionFilters.dateTo) {
        const toDate = new Date(distributionFilters.dateTo);
        filteredDistribution = filteredDistribution.filter(shipment => {
            const arriboDate = parseDate(shipment.arribo);
            if (!arriboDate) return false;
            return arriboDate <= toDate;
        });
    }
    
    // Aplicar filtros del gráfico de barras
    let filteredBar = [...filtered];
    
    if (barFilters.status && barFilters.status !== 'all') {
        filteredBar = filteredBar.filter(shipment => 
            shipment.status.toLowerCase().includes(barFilters.status.toLowerCase())
        );
    }
    
    if (barFilters.dateFrom) {
        const fromDate = new Date(barFilters.dateFrom);
        filteredBar = filteredBar.filter(shipment => {
            const arriboDate = parseDate(shipment.arribo);
            if (!arriboDate) return false;
            return arriboDate >= fromDate;
        });
    }
    
    if (barFilters.dateTo) {
        const toDate = new Date(barFilters.dateTo);
        filteredBar = filteredBar.filter(shipment => {
            const arriboDate = parseDate(shipment.arribo);
            if (!arriboDate) return false;
            return arriboDate <= toDate;
        });
    }
    
    // Actualizar dashboard
    currentShipments = filtered; // Para la tabla usamos solo el filtro de año
    const statsDistribution = calculateStats(filteredDistribution);
    const statsBar = calculateStats(filteredBar);
    
    renderStatsCards(statsDistribution);
    renderDistributionChart(statsDistribution);
    renderBarChart(statsBar);
    renderShipmentsTable(filtered, 1, 10);
    
    console.log(`Filtro de año: ${filtered.length} registros`);
    console.log(`Gráfico distribución: ${filteredDistribution.length} registros`);
    console.log(`Gráfico barras: ${filteredBar.length} registros`);
}

// ==============================================
// SINCRONIZAR FILTRO DE AÑO (SOLO)
// ==============================================

function syncYearFilter() {
    // Solo sincronizar el año entre ambos menús
    document.getElementById('filter-year').value = globalYearFilter;
    document.getElementById('filter-year-bar').value = globalYearFilter;
}

// ==============================================
// RESETEAR FILTROS
// ==============================================

function resetDistributionFilters() {
    globalYearFilter = 'all';
    distributionFilters = {
        status: 'all',
        dateFrom: null,
        dateTo: null
    };
    
    document.getElementById('filter-year').value = 'all';
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    
    syncYearFilter();
    applyFilters();
}

function resetBarFilters() {
    globalYearFilter = 'all';
    barFilters = {
        status: 'all',
        dateFrom: null,
        dateTo: null
    };
    
    document.getElementById('filter-year-bar').value = 'all';
    document.getElementById('filter-status-bar').value = 'all';
    document.getElementById('filter-date-from-bar').value = '';
    document.getElementById('filter-date-to-bar').value = '';
    
    syncYearFilter();
    applyFilters();
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

    // Leer encabezados de la primera fila
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const shipments = [];

    // Crear mapeo de nombres de columna a índices
    const getColumnIndex = (names) => {
        for (let name of names) {
            const index = headers.findIndex(h => h.includes(name.toLowerCase()));
            if (index !== -1) return index;
        }
        return -1;
    };

    // Encontrar índices de columnas por nombre (con alternativas)
    const colMawbFirst = getColumnIndex(['mawb first', 'first leg']);
    const colMawbSecond = getColumnIndex(['mawb second', 'second leg']);
    const colStatus = getColumnIndex(['status']);
    const colStartReview = getColumnIndex(['start review']);
    const colEndReview = getColumnIndex(['end review']);
    const colTimeComplete = getColumnIndex(['time to complete']);
    const colPrealerta = getColumnIndex(['prealerta']);
    const colArribo = getColumnIndex(['arribo']);
    const colLiberacion = getColumnIndex(['liberacion', 'liberación']);
    const colReference = getColumnIndex(['po liberados', 'referencias', 'reference']);
    const colComments = getColumnIndex(['comentario', 'comment']);

    console.log('Columnas detectadas:', {
        mawbFirst: colMawbFirst,
        mawbSecond: colMawbSecond,
        status: colStatus,
        startReview: colStartReview,
        endReview: colEndReview
    });
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Validar que la fila tenga al menos el MAWB first leg
        if (!row[colMawbFirst] || !row[colMawbFirst].toString().trim()) continue;

        const shipment = {
            mawbFirstLeg: colMawbFirst >= 0 ? (row[colMawbFirst] || '') : '',
            mawbSecondLeg: colMawbSecond >= 0 ? (row[colMawbSecond] || '') : '',
            status: colStatus >= 0 ? (row[colStatus] || 'Pending') : 'Pending',
            reviewStartDate: colStartReview >= 0 ? (row[colStartReview] || '') : '',
            reviewEndDate: colEndReview >= 0 ? (row[colEndReview] || '') : '',
            timeToComplete: colTimeComplete >= 0 ? (row[colTimeComplete] || '') : '',
            prealerta: colPrealerta >= 0 ? (row[colPrealerta] || '') : '',
            arribo: colArribo >= 0 ? (row[colArribo] || '') : '',
            liberacion: colLiberacion >= 0 ? (row[colLiberacion] || '') : '',
            reference: colReference >= 0 ? (row[colReference] || '') : '',
            comments: colComments >= 0 ? (row[colComments] || '') : ''
        };

        shipments.push(shipment);
    }

    console.log(`Cargados ${shipments.length} registros del Google Sheet`);

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
        <td class="px-6 py-4 text-center">
            <button class="detail-btn inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-xs font-medium transition-colors">
                <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
                Ver
            </button>
        </td>
    `;

    // Agregar evento click al botón
    const detailBtn = tr.querySelector('.detail-btn');
    detailBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDetailModal(shipment);
    });

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
            allShipments = [];
            currentShipments = [];
            renderStatsCards(getEmptyStats());
            renderDistributionChart(getEmptyStats());
            renderBarChart(getEmptyStats());
            document.getElementById('shipments-tbody').innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">No hay datos disponibles</td></tr>';
            return;
        }
        
        // Guardar todos los datos
        allShipments = shipments;
        
        // Aplicar filtro por defecto (año actual 2026)
        applyFilters();
        updateLastUpdated();

        console.log(`Dashboard cargado exitosamente con ${shipments.length} registros totales`);
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
            renderShipmentsTable(currentShipments, currentPage - 1, 10);
        }
    });

    document.getElementById('btn-next')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            renderShipmentsTable(currentShipments, currentPage + 1, 10);
        }
    });

    // Menú de filtros (gráfico de distribución)
    const filterMenuBtn = document.getElementById('filter-menu-btn');
    const filterMenu = document.getElementById('filter-menu');
    
    filterMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        filterMenu.classList.toggle('hidden');
    });
    
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!filterMenu?.contains(e.target) && e.target !== filterMenuBtn) {
            filterMenu?.classList.add('hidden');
        }
    });
    
    // Aplicar filtros del gráfico de distribución
    document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
        globalYearFilter = document.getElementById('filter-year').value;
        distributionFilters.status = document.getElementById('filter-status').value;
        distributionFilters.dateFrom = document.getElementById('filter-date-from').value;
        distributionFilters.dateTo = document.getElementById('filter-date-to').value;
        
        // Sincronizar solo el año con el otro menú
        syncYearFilter();
        
        applyFilters();
        filterMenu?.classList.add('hidden');
    });
    
    // Resetear filtros de distribución
    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
        resetDistributionFilters();
        filterMenu?.classList.add('hidden');
    });

    // ===== Menú de filtros (gráfico de barras) =====
    const filterMenuBtnBar = document.getElementById('filter-menu-btn-bar');
    const filterMenuBar = document.getElementById('filter-menu-bar');
    
    filterMenuBtnBar?.addEventListener('click', (e) => {
        e.stopPropagation();
        filterMenuBar.classList.toggle('hidden');
    });
    
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!filterMenuBar?.contains(e.target) && e.target !== filterMenuBtnBar) {
            filterMenuBar?.classList.add('hidden');
        }
    });
    
    // Aplicar filtros del gráfico de barras
    document.getElementById('apply-filters-btn-bar')?.addEventListener('click', () => {
        globalYearFilter = document.getElementById('filter-year-bar').value;
        barFilters.status = document.getElementById('filter-status-bar').value;
        barFilters.dateFrom = document.getElementById('filter-date-from-bar').value;
        barFilters.dateTo = document.getElementById('filter-date-to-bar').value;
        
        // Sincronizar solo el año con el otro menú
        syncYearFilter();
        
        applyFilters();
        filterMenuBar?.classList.add('hidden');
    });
    
    // Resetear filtros del gráfico de barras
    document.getElementById('reset-filters-btn-bar')?.addEventListener('click', () => {
        resetBarFilters();
        filterMenuBar?.classList.add('hidden');
    });

    // Refresh cada 5 minutos
    setInterval(() => {
        initDashboard();
    }, 5 * 60 * 1000);
});

// ==============================================
// MODAL DE DETALLES
// ==============================================

function openDetailModal(shipment) {
    const modal = document.getElementById('detail-modal');
    
    // Rellenar datos
    document.getElementById('modal-mawb-title').textContent = `${shipment.mawbFirstLeg} / ${shipment.mawbSecondLeg}`;
    document.getElementById('modal-mawb-first').textContent = shipment.mawbFirstLeg || '-';
    document.getElementById('modal-mawb-second').textContent = shipment.mawbSecondLeg || '-';
    
    // Status badge
    const statusClass = getStatusClass(shipment.status);
    const statusBadge = document.getElementById('modal-status-badge');
    statusBadge.textContent = shipment.status || '-';
    statusBadge.className = `inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusClass}`;
    
    // Dates
    document.getElementById('modal-start-date').textContent = shipment.reviewStartDate || '-';
    document.getElementById('modal-end-date').textContent = shipment.reviewEndDate || '-';
    document.getElementById('modal-time-complete').textContent = shipment.timeToComplete || '-';
    document.getElementById('modal-prealerta').textContent = shipment.prealerta || '-';
    document.getElementById('modal-arribo').textContent = shipment.arribo || '-';
    document.getElementById('modal-liberacion').textContent = shipment.liberacion || '-';
    
    // Reference & Comments
    document.getElementById('modal-reference').textContent = shipment.reference || '-';
    document.getElementById('modal-comments').textContent = shipment.comments || 'No comments available';
    
    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Cerrar modal al hacer click en el backdrop
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('detail-modal');
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDetailModal();
        }
    });
    
    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDetailModal();
        }
    });
});
