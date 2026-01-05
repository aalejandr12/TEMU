// ==============================================
// CONFIGURACIÓN DE ESTADOS
// ==============================================

const STATUS = {
  Review: { 
    label: "Revisión", 
    color: "chart-blue",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    textClass: "text-chart-blue",
    icon: "visibility"
  },
  Pending: { 
    label: "Pendiente", 
    color: "chart-yellow",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/30", 
    textClass: "text-chart-yellow",
    icon: "hourglass_empty"
  },
  Transmissions: { 
    label: "Transmisión", 
    color: "chart-purple",
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
    textClass: "text-chart-purple",
    icon: "settings_input_antenna"
  },
  Inspection: { 
    label: "Inspección", 
    color: "chart-orange",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
    textClass: "text-chart-orange",
    icon: "fact_check"
  },
  Released: { 
    label: "Liberado", 
    color: "chart-green",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-chart-green",
    icon: "check_circle"
  }
};

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

// Año independiente para el gráfico de barras (PQ Liberados por Mes)
let barChartYear = new Date().getFullYear(); // Por defecto, año actual

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
    renderBarChart(); // Ahora no recibe parámetros, lee directamente allShipments
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
    const colPqLiberados = getColumnIndex(['pq liberados', 'po liberados']);
    const colReference = getColumnIndex(['referencias', 'reference']);
    const colComments = getColumnIndex(['comentario', 'comment']);

    console.log('Columnas detectadas:', {
        mawbFirst: colMawbFirst,
        mawbSecond: colMawbSecond,
        status: colStatus,
        startReview: colStartReview,
        endReview: colEndReview,
        liberacion: colLiberacion,
        pqLiberados: colPqLiberados
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
            pqLiberados: colPqLiberados >= 0 ? (row[colPqLiberados] || '') : '',
            reference: colReference >= 0 ? (row[colReference] || '') : '',
            comments: colComments >= 0 ? (row[colComments] || '') : ''
        };

        shipments.push(shipment);
    }

    console.log(`Cargados ${shipments.length} registros del Google Sheet`);
    
    // Log de ejemplo para verificar mapeo
    if (shipments.length > 0) {
        console.log('Shipment ejemplo:', shipments[0]);
        console.log('Campos clave:', {
            liberacion: shipments[0]?.liberacion,
            pqLiberados: shipments[0]?.pqLiberados
        });
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
// VARIABLES PARA GRÁFICOS LIGHTWEIGHT-CHARTS
// ==============================================

// ==============================================
// RENDERIZAR GRÁFICO DE DISTRIBUCIÓN (DONUT CHART)
// ==============================================

function renderDistributionChart(stats) {
    const canvas = document.getElementById('distribution-chart');
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const total = stats.pending + stats.review + stats.transmissions + stats.inspection + stats.released;
    
    // Actualizar el número total en el centro
    document.getElementById('chart-total').textContent = total;
    
    if (total === 0) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 80;
    const innerRadius = 55;
    
    // Datos en el orden correcto
    const segments = [
        { value: stats.pending, color: '#eab308', label: 'Pendiente' },
        { value: stats.review, color: '#3b82f6', label: 'Revisión' },
        { value: stats.transmissions, color: '#a855f7', label: 'Transmisión' },
        { value: stats.inspection, color: '#f97316', label: 'Inspección' },
        { value: stats.released, color: '#22c55e', label: 'Liberado' }
    ];
    
    let currentAngle = -Math.PI / 2; // Empezar desde arriba
    
    segments.forEach(segment => {
        const sliceAngle = (segment.value / total) * Math.PI * 2;
        
        // Dibujar segmento
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
    
    // Actualizar leyendas
    document.getElementById('legend-pending').textContent = `${STATUS.Pending.label} (${stats.pendingPercent}%)`;
    document.getElementById('legend-review').textContent = `${STATUS.Review.label} (${stats.reviewPercent}%)`;
    document.getElementById('legend-transmission').textContent = `${STATUS.Transmissions.label} (${stats.transmissionsPercent}%)`;
    document.getElementById('legend-inspection').textContent = `${STATUS.Inspection.label} (${stats.inspectionPercent}%)`;
    document.getElementById('legend-released').textContent = `${STATUS.Released.label} (${stats.releasedPercent}%)`;
}

// ==============================================
// RENDERIZAR GRÁFICO DE BARRAS (PQ LIBERADOS POR MES)
// ==============================================

let barChart = null;

function renderBarChart() {
    try {
        const chartElement = document.getElementById('bar-chart');
        if (!chartElement) {
            console.error('Elemento bar-chart no encontrado');
            return;
        }
        
        // Verificar si Chart.js está disponible
        if (typeof Chart === 'undefined') {
            console.error('Chart.js no está cargado');
            return;
        }
        
        const isDark = document.documentElement.classList.contains('dark');
        
        // Destruir gráfico existente
        if (barChart) {
            barChart.destroy();
            barChart = null;
        }
        
        // Usar el año configurado en barChartYear
        const selectedYear = barChartYear;
        
        console.log(`Filtrando datos para año ${selectedYear}`);
        console.log(`Total de envíos: ${allShipments.length}`);
        
        // Filtrar envíos liberados del año seleccionado
        const releasedShipments = allShipments.filter(shipment => {
            if (!shipment.liberacion) return false;
            const liberacionDate = parseDate(shipment.liberacion);
            const matches = liberacionDate && liberacionDate.getFullYear() === selectedYear;
            if (matches) {
                console.log(`Envío liberado en ${selectedYear}:`, shipment.liberacion, 'PQ:', shipment.pqLiberados);
            }
            return matches;
        });
        
        console.log(`Envíos liberados en ${selectedYear}: ${releasedShipments.length}`);
        
        // Agrupar por mes y sumar PQ liberados
        const monthlyData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        // Sumar PQ liberados por mes
        releasedShipments.forEach(shipment => {
            const liberacionDate = parseDate(shipment.liberacion);
            if (liberacionDate) {
                const month = liberacionDate.getMonth();
                // Parse robusto del número (maneja comas y puntos)
                const pqLiberados = parseFloat(String(shipment.pqLiberados ?? '').replace(',', '.')) || 0;
                monthlyData[month] += pqLiberados;
                console.log(`  Mes ${month + 1} (${meses[month]}): +${pqLiberados} = ${monthlyData[month]}`);
            }
        });
        
        console.log('Datos mensuales finales:', monthlyData);
        
        // Crear gráfico con Chart.js
        const ctx = chartElement.getContext('2d');
        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: meses,
                datasets: [{
                    label: 'PQ Liberados',
                    data: monthlyData,
                    backgroundColor: '#22c55e',
                    borderColor: '#16a34a',
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                return `PQ Liberados: ${context.parsed.y.toFixed(3)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: isDark ? '#334155' : '#e2e8f0',
                        },
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#475569',
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: isDark ? '#cbd5e1' : '#475569',
                        }
                    }
                }
            }
        });
        
        // Actualizar leyenda con el año seleccionado
        const legendElement = document.getElementById('bar-chart-legend');
        if (legendElement) {
            legendElement.textContent = `Paquetes Liberados por Mes (${selectedYear})`;
        }
        
        console.log(`Gráfico de barras renderizado correctamente con Chart.js para el año ${selectedYear}`);
    } catch (error) {
        console.error('Error al renderizar gráfico de barras:', error);
    }
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
    const statusInfo = getStatusInfo(shipment.status);
    const statusClass = statusInfo.badgeClass;
    const statusColor = statusInfo.colorName;
    
    if (isHighlighted) {
        tr.className = `bg-${statusColor}-50/50 hover:bg-${statusColor}-50 dark:bg-${statusColor}-900/10 dark:hover:bg-${statusColor}-900/20 transition-colors group ring-1 ring-inset ring-${statusColor}-200 dark:ring-${statusColor}-800`;
    } else {
        tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors';
    }

    tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
            <div class="flex items-center gap-2">
                <span>${shipment.mawbFirstLeg}</span>
                <button onclick="copyToClipboard('${shipment.mawbFirstLeg}')" class="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all" title="Copiar MAWB" aria-label="Copiar MAWB">
                    <span class="material-symbols-outlined text-sm">content_copy</span>
                </button>
            </div>
        </td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-400">${shipment.mawbSecondLeg}</td>
        <td class="px-6 py-4">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                ${statusInfo.label}
            </span>
        </td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-400">
            <div class="flex flex-col text-[11px] leading-tight">
                <span>Inicio: ${shipment.reviewStartDate}</span>
                <span class="text-slate-400">Fin: ${shipment.reviewEndDate}</span>
            </div>
        </td>
        <td class="px-6 py-4 text-center">
            <button class="detail-btn inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-xs font-medium transition-colors focus-ring">
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
// HELPER: OBTENER INFO DE STATUS DESDE OBJETO STATUS
// ==============================================

function getStatusInfo(status) {
    const statusLower = status.toLowerCase();
    let statusKey = null;
    
    if (statusLower.includes('review')) statusKey = 'Review';
    else if (statusLower.includes('pending')) statusKey = 'Pending';
    else if (statusLower.includes('transmission')) statusKey = 'Transmissions';
    else if (statusLower.includes('inspection')) statusKey = 'Inspection';
    else if (statusLower.includes('released')) statusKey = 'Released';
    
    if (statusKey && STATUS[statusKey]) {
        const info = STATUS[statusKey];
        return {
            label: info.label,
            colorName: info.color.replace('chart-', ''),
            badgeClass: getBadgeClass(statusKey)
        };
    }
    
    return {
        label: status,
        colorName: 'slate',
        badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
    };
}

function getBadgeClass(statusKey) {
    const classes = {
        'Review': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
        'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
        'Transmissions': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
        'Inspection': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
        'Released': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800'
    };
    return classes[statusKey] || 'bg-slate-100 text-slate-800';
}

// Mantener para compatibilidad
function getStatusClass(status) {
    return getStatusInfo(status).badgeClass;
}

function getStatusColor(status) {
    return getStatusInfo(status).colorName;
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
        Mostrando <span class="font-medium text-slate-900 dark:text-white">${start}</span> a 
        <span class="font-medium text-slate-900 dark:text-white">${end}</span> de 
        <span class="font-medium text-slate-900 dark:text-white">${totalItems}</span> resultados
    `;

    // Actualizar número de página
    document.getElementById('current-page-btn').textContent = page;

    // Actualizar botones
    document.getElementById('btn-prev').disabled = page === 1;
    document.getElementById('btn-next').disabled = page === totalPages;
}

// ==============================================
// COPIAR AL PORTAPAPELES
// ==============================================

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Mostrar notificación de éxito
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in flex items-center gap-2';
        notification.innerHTML = `
            <span class="material-symbols-outlined text-sm">check_circle</span>
            <span>Copiado: ${text}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
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
    document.getElementById('last-updated').textContent = `Última actualización: ${timeString}`;
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
        
        // Detectar qué años hay en los datos de liberación
        const yearsInData = new Set();
        shipments.forEach(shipment => {
            if (shipment.liberacion) {
                const liberacionDate = parseDate(shipment.liberacion);
                if (liberacionDate) {
                    yearsInData.add(liberacionDate.getFullYear());
                }
            }
        });
        console.log('Años con datos de liberación:', Array.from(yearsInData).sort());
        
        // Establecer el año más reciente como predeterminado
        if (yearsInData.size > 0) {
            const latestYear = Math.max(...Array.from(yearsInData));
            barChartYear = latestYear;
            console.log(`Año por defecto para gráfico: ${latestYear}`);
            
            // Actualizar el selector en el HTML
            const yearSelect = document.getElementById('filter-year-chart-bar');
            if (yearSelect) {
                yearSelect.value = latestYear.toString();
            }
        }
        
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
    
    console.log('Botón filtro barras:', filterMenuBtnBar);
    console.log('Menú filtro barras:', filterMenuBar);
    
    if (filterMenuBtnBar && filterMenuBar) {
        filterMenuBtnBar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isHidden = filterMenuBar.classList.contains('hidden');
            console.log('Toggle menú barras - Estado actual:', isHidden ? 'oculto' : 'visible');
            filterMenuBar.classList.toggle('hidden');
            console.log('Toggle menú barras - Nuevo estado:', filterMenuBar.classList.contains('hidden') ? 'oculto' : 'visible');
        });
    }
    
    // Cerrar menú al hacer click fuera (usando setTimeout para evitar conflicto)
    setTimeout(() => {
        document.addEventListener('click', (e) => {
            if (filterMenuBar && filterMenuBtnBar) {
                const isClickInsideMenu = filterMenuBar.contains(e.target);
                const isClickOnButton = filterMenuBtnBar.contains(e.target);
                
                if (!isClickInsideMenu && !isClickOnButton && !filterMenuBar.classList.contains('hidden')) {
                    console.log('Click fuera - cerrando menú');
                    filterMenuBar.classList.add('hidden');
                }
            }
        });
    }, 100);
    
    // Aplicar filtro de año del gráfico de barras (independiente)
    const applyYearBtn = document.getElementById('apply-year-filter-chart-bar');
    console.log('Botón aplicar año:', applyYearBtn);
    
    if (applyYearBtn) {
        applyYearBtn.addEventListener('click', () => {
            const yearSelect = document.getElementById('filter-year-chart-bar');
            if (yearSelect) {
                barChartYear = parseInt(yearSelect.value);
                console.log('Año seleccionado:', barChartYear);
                renderBarChart(); // Solo re-renderiza el gráfico de barras
                filterMenuBar?.classList.add('hidden');
            }
        });
    }

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
    
    // Status badge con label en español
    const statusInfo = getStatusInfo(shipment.status);
    const statusBadge = document.getElementById('modal-status-badge');
    statusBadge.textContent = statusInfo.label;
    statusBadge.className = `inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.badgeClass}`;
    
    // Dates
    document.getElementById('modal-start-date').textContent = shipment.reviewStartDate || '-';
    document.getElementById('modal-end-date').textContent = shipment.reviewEndDate || '-';
    document.getElementById('modal-time-complete').textContent = shipment.timeToComplete || '-';
    document.getElementById('modal-prealerta').textContent = shipment.prealerta || '-';
    document.getElementById('modal-arribo').textContent = shipment.arribo || '-';
    document.getElementById('modal-liberacion').textContent = shipment.liberacion || '-';
    
    // Reference & Comments
    document.getElementById('modal-reference').textContent = shipment.reference || '-';
    document.getElementById('modal-comments').textContent = shipment.comments || 'Sin comentarios disponibles';
    
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


