# Solución al Problema de Caché

## 🔧 Problema Identificado

Cuando se consume un Google Sheet "publicado" como CSV, los datos pueden tardar en actualizarse debido al caché del navegador y/o de Google. Aunque AppSheet y Google Sheet ya tengan los datos nuevos, el enlace público puede servir versiones antiguas durante varios minutos.

## ✅ Soluciones Implementadas

### 1. Cache Buster con Timestamp

Se agregó un parámetro único (timestamp) al URL cada vez que se hace fetch:

```javascript
async function fetchSheetData() {
    try {
        // Agregar cache buster (timestamp) para evitar caché
        const urlBase = SHEET_URL;
        const url = urlBase + (urlBase.includes("?") ? "&" : "?") + "t=" + Date.now();
        
        // Fetch del CSV publicado con cache: no-store
        const response = await fetch(url, { cache: "no-store" });
        // ...
    }
}
```

**Beneficios:**
- Cada petición tiene un URL único (con el timestamp actual)
- Google y el navegador no pueden reutilizar respuestas viejas
- Se agrega `cache: "no-store"` para reforzar que no se use caché local

### 2. Botón de Actualización Manual

Se agregó un botón 🔄 en el header que permite al usuario refrescar los datos cuando lo necesite:

**Ubicación:** Header superior, junto al botón de cambio de tema

**Características:**
- Animación de rotación al hacer click
- Actualiza los datos inmediatamente
- Muestra feedback visual al usuario

### 3. Refresco Automático cada 60 segundos

Se implementó un sistema de actualización automática que refresca los datos cada minuto:

```javascript
function setupAutoRefresh() {
    autoRefreshInterval = setInterval(() => {
        console.log('Refrescando datos automáticamente...');
        refreshData();
    }, 60000); // 60 segundos
}
```

**Características:**
- Actualización transparente en segundo plano
- Mantiene los filtros y el estado actual de la aplicación
- Actualiza el indicador "Última actualización" con la hora exacta
- Logs en consola para debugging

## 📊 Flujo de Actualización

1. **Carga Inicial:** Al abrir la página, se cargan los datos con cache buster
2. **Refresco Automático:** Cada 60 segundos, se actualizan automáticamente
3. **Refresco Manual:** El usuario puede forzar una actualización con el botón 🔄
4. **Cache Buster:** Cada petición incluye `?t=<timestamp>` para evitar caché

## 🔍 Debugging

Para verificar que funciona correctamente:

1. Abre la consola del navegador (F12)
2. Busca mensajes como:
   - `"Refresco automático activado (cada 60 segundos)"`
   - `"Refrescando datos automáticamente..."`
   - `"Datos actualizados exitosamente"`

3. Observa el indicador "Última actualización" en el header

## ⚙️ Configuración

Si necesitas ajustar la frecuencia de actualización, modifica el valor en `setupAutoRefresh()`:

```javascript
setInterval(() => {
    refreshData();
}, 60000); // Cambiar este valor (en milisegundos)
```

Ejemplos:
- 30 segundos: `30000`
- 60 segundos: `60000` (actual)
- 2 minutos: `120000`
- 5 minutos: `300000`

## 📝 Notas Técnicas

- Se removió el refresh antiguo de 5 minutos para evitar conflictos
- La función `refreshData()` mantiene el estado de filtros actual
- El botón manual proporciona feedback inmediato al usuario
- El cache buster es compatible con URLs que ya tienen parámetros
