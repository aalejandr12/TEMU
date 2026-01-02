// ==============================================
// ARCHIVO DE CONFIGURACIÓN DE EJEMPLO
// ==============================================
// 1. Copia este archivo y renómbralo a "config.js"
// 2. Completa los valores con tu información
// 3. Importa config.js en lugar de las constantes en app.js

const CONFIG = {
    // ID de tu Google Sheet (obtener de la URL)
    // Ejemplo: docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
    SHEET_ID: 'TU_SHEET_ID_AQUI',
    
    // Tu API Key de Google Cloud Console
    // Instrucciones: https://console.cloud.google.com/apis/credentials
    API_KEY: 'TU_API_KEY_AQUI',
    
    // Rango de celdas a leer (notación A1)
    // Ejemplos:
    // - 'A1:H100' - Lee desde A1 hasta H100
    // - 'Sheet1!A1:H' - Lee toda la columna H de Sheet1
    // - 'A:H' - Lee todas las filas de columnas A hasta H
    RANGE: 'A1:H500',
    
    // Nombre de la hoja (si tienes múltiples hojas)
    SHEET_NAME: 'Sheet1',
    
    // Intervalo de actualización automática (en minutos)
    AUTO_REFRESH_MINUTES: 5,
    
    // Número de registros por página
    RECORDS_PER_PAGE: 5,
    
    // Mapeo de columnas (0-indexed)
    // Ajusta estos índices si tus columnas están en diferente orden
    COLUMN_MAPPING: {
        mawbFirstLeg: 0,    // Columna A
        mawbSecondLeg: 1,   // Columna B
        status: 2,          // Columna C
        reviewStart: 3,     // Columna D
        reviewEnd: 4,       // Columna E
        timeToComplete: 5,  // Columna F
        reference: 6,       // Columna G
        comments: 7         // Columna H
    },
    
    // Estados válidos y sus variantes
    // El sistema buscará estas palabras clave en la columna Status
    STATUS_KEYWORDS: {
        review: ['review', 'revisión', 'revision'],
        pending: ['pending', 'pendiente', 'espera'],
        transmissions: ['transmission', 'transmisión', 'transmision', 'enviado'],
        inspection: ['inspection', 'inspección', 'inspeccion'],
        released: ['released', 'liberado', 'completado', 'entregado']
    },
    
    // Formato de fecha esperado en el Sheet
    DATE_FORMAT: 'DD/MM/YYYY',
    
    // Habilitar modo debug (muestra logs en consola)
    DEBUG_MODE: true,
    
    // Usar datos de ejemplo si falla la conexión
    USE_FALLBACK_DATA: true,
    
    // URL base de la API de Google Sheets
    API_BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets'
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
