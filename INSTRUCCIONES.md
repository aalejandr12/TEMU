# 📖 Instrucciones Paso a Paso - LogiTrack Dashboard

## 🎯 Objetivo
Conectar el dashboard de LogiTrack con tu Google Sheet para visualizar datos en tiempo real.

---

## 📝 PASO 1: Preparar tu Google Sheet

### 1.1 Estructura del Sheet
Tu Google Sheet debe tener **exactamente** estos encabezados en la **primera fila**:

```
| MAWB First Leg | MAWB Second Leg | Status | Review Start Date | Review End Date | Time to Complete | Reference | Comments |
```

### 1.2 Ejemplo de datos:
```
369-95503730 | 810-40481420 | Review | 15/08/2025 | 15/08/2025 | 4 H, 41 M | 70 | AWB working before having air waybill
936-00819700 | 810-42036875 | Pending | 15/08/2025 | 15/08/2025 | 4 H, 41 M | 30 | Waiting for customs clearance
160-87627540 | 810-42036886 | Transmissions | 15/08/2025 | 15/08/2025 | 4 H, 41 M | 60 | In transit to warehouse
```

### 1.3 Estados válidos:
- `Review` - En revisión
- `Pending` - Pendiente
- `Transmissions` - En transmisión
- `Inspection` - En inspección
- `Released` - Liberado

### 1.4 Hacer público el Sheet (Opción 1 - Más simple):
1. Abre tu Google Sheet
2. Haz clic en **Archivo > Compartir > Publicar en la web**
3. En "Vincular", selecciona la hoja que quieres publicar
4. Haz clic en **Publicar**
5. Copia la URL generada

### 1.5 Obtener ID del Sheet:
De la URL: `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`

Copia la parte: `ESTE_ES_EL_ID`

---

## 🔑 PASO 2: Configurar Google Cloud (API Key)

### 2.1 Crear un proyecto en Google Cloud:

1. Ve a: https://console.cloud.google.com
2. Haz clic en el selector de proyectos (arriba izquierda)
3. Clic en **Nuevo Proyecto**
4. Ponle un nombre (ej: "LogiTrack Dashboard")
5. Haz clic en **Crear**

### 2.2 Habilitar Google Sheets API:

1. En el menú lateral, ve a: **APIs y Servicios > Biblioteca**
2. Busca: "Google Sheets API"
3. Haz clic en el resultado
4. Presiona el botón **Habilitar**

### 2.3 Crear API Key:

1. Ve a: **APIs y Servicios > Credenciales**
2. Haz clic en **+ Crear credenciales**
3. Selecciona **Clave de API**
4. Copia la clave generada (guárdala en un lugar seguro)

### 2.4 Restringir la API Key (Recomendado):

1. Haz clic en **Editar API Key** (icono de lápiz)
2. En "Restricciones de la aplicación", selecciona:
   - Si es para sitio web: **Referentes HTTP (sitios web)**
   - Agrega tu dominio (ej: `http://localhost:*` o `https://tu-sitio.com/*`)
3. En "Restricciones de API", selecciona:
   - **Restringir clave**
   - Marca solo **Google Sheets API**
4. Haz clic en **Guardar**

---

## ⚙️ PASO 3: Configurar el Dashboard

### 3.1 Abrir app.js:

1. Abre el archivo `app.js` en tu editor de código
2. Encuentra las líneas al inicio:

```javascript
const SHEET_ID = 'TU_SHEET_ID_AQUI';
const API_KEY = 'TU_API_KEY_AQUI';
const RANGE = 'A1:H500';
```

### 3.2 Reemplazar valores:

```javascript
// Reemplaza con tu ID del Sheet
const SHEET_ID = '1vQGDZI70YYqCd5-eOcGXgguxjhvvJZWn3sc0cpAXatA274963';

// Reemplaza con tu API Key
const API_KEY = 'AIzaSyC1234567890abcdefGHIJKLMNOPQRSTUVWXYZ';

// Ajusta el rango según la cantidad de datos
const RANGE = 'A1:H500'; // Lee hasta la fila 500
```

### 3.3 Guardar cambios:
- Presiona `Ctrl + S` (Windows) o `Cmd + S` (Mac)

---

## 🚀 PASO 4: Ejecutar el Dashboard

### Opción A: Abrir directamente en el navegador

1. Busca el archivo `index.html` en tu explorador de archivos
2. Haz doble clic para abrirlo en tu navegador
3. ✅ ¡El dashboard debería cargar los datos!

### Opción B: Usar un servidor local (Recomendado)

#### Con Python (si lo tienes instalado):
```powershell
cd "c:\Users\Alejandro Garcia\Downloads\TEMU"
python -m http.server 8000
```
Luego abre: http://localhost:8000

#### Con Node.js:
```powershell
cd "c:\Users\Alejandro Garcia\Downloads\TEMU"
npx http-server -p 8000
```
Luego abre: http://localhost:8000

#### Con VS Code (Live Server):
1. Instala la extensión "Live Server"
2. Haz clic derecho en `index.html`
3. Selecciona "Open with Live Server"

---

## ✅ PASO 5: Verificar que funciona

### 5.1 El dashboard debe mostrar:
- ✅ Tarjetas con números actualizados (Review, Pending, etc.)
- ✅ Gráfico circular con distribución
- ✅ Gráfico de barras
- ✅ Tabla con tus envíos

### 5.2 Si ves "datos de ejemplo":
- Significa que está usando datos mock
- Revisa la consola del navegador (F12) para ver errores
- Verifica que el SHEET_ID y API_KEY sean correctos

### 5.3 Consola del navegador (para debug):
1. Presiona `F12` en el navegador
2. Ve a la pestaña **Console**
3. Busca mensajes de error en rojo

---

## 🔍 PASO 6: Probar funcionalidades

### Búsqueda:
- Escribe un MAWB en el campo de búsqueda (arriba derecha)
- La tabla se filtrará automáticamente

### Paginación:
- Usa las flechas para navegar entre páginas

### Modo oscuro:
- Haz clic en el icono de luna/sol (arriba derecha)

### Actualización manual:
- Haz clic en el icono de refresh (arriba derecha)

### Actualización automática:
- El dashboard se actualiza solo cada 5 minutos

---

## ❗ Solución de Problemas

### Error: "Access to fetch blocked by CORS"
**Causa**: Abriste el HTML directamente sin servidor.

**Solución**: Usa un servidor local (ver Paso 4, Opción B)

---

### Error: "API key not valid"
**Causa**: La API Key es incorrecta o está restringida.

**Solución**:
1. Verifica que copiaste la API Key completa
2. Asegúrate de que Google Sheets API esté habilitada
3. Revisa las restricciones de la API Key

---

### Error: "Requested entity was not found"
**Causa**: El SHEET_ID es incorrecto o el Sheet no es accesible.

**Solución**:
1. Verifica el SHEET_ID en la URL de tu Sheet
2. Asegúrate de que el Sheet esté publicado o sea público
3. Intenta acceder al Sheet desde un navegador sin sesión

---

### No se muestran datos / Muestra datos de ejemplo
**Causa**: Error de conexión con Google Sheets.

**Solución**:
1. Abre la consola del navegador (F12)
2. Busca mensajes de error
3. Verifica configuración de SHEET_ID y API_KEY
4. Asegúrate de que el Sheet tenga datos

---

### Los datos no se actualizan
**Causa**: Caché del navegador o configuración incorrecta.

**Solución**:
1. Presiona `Ctrl + F5` para recargar sin caché
2. Haz clic en el botón de refresh del dashboard
3. Verifica que estés editando el Sheet correcto

---

## 📞 Necesitas más ayuda?

### Recursos útiles:
- 📚 [Documentación de Google Sheets API](https://developers.google.com/sheets/api)
- 🎥 [Tutorial en video: Cómo obtener API Key](https://www.youtube.com/results?search_query=google+sheets+api+key)
- 💬 [Stack Overflow](https://stackoverflow.com/questions/tagged/google-sheets-api)

### Checklist final:
- [ ] Google Sheet tiene los encabezados correctos
- [ ] Google Sheet tiene datos de prueba
- [ ] Google Sheet está publicado/público
- [ ] Obtuve el SHEET_ID correcto
- [ ] Creé un proyecto en Google Cloud
- [ ] Habilité Google Sheets API
- [ ] Creé una API Key
- [ ] Configuré SHEET_ID y API_KEY en app.js
- [ ] Estoy usando un servidor local (no abro HTML directamente)
- [ ] La consola del navegador no muestra errores

---

**¡Listo! 🎉 Ahora tienes un dashboard profesional conectado a Google Sheets.**
