# 📦 LogiTrack - Cargo Status Dashboard

Dashboard moderno y dinámico para seguimiento de envíos de carga, conectado con **Google Sheets** como base de datos.

## 🚀 Características

- ✅ Dashboard interactivo con estadísticas en tiempo real
- 📊 Gráficos de distribución y volumen por estado
- 🔍 Búsqueda de envíos por MAWB
- 🌓 Modo oscuro/claro
- 📱 Diseño responsive
- ⚡ Actualización automática cada 5 minutos
- 📤 Exportación de datos

## 📋 Requisitos Previos

1. **Google Sheet configurado** con las siguientes columnas:
   - MAWB First Leg
   - MAWB Second Leg
   - Status (Review, Pending, Transmissions, Inspection, Released)
   - Review Start Date
   - Review End Date
   - Time to Complete
   - Reference
   - Comments

2. **Google Cloud API Key** (ver instrucciones abajo)

## 🔧 Configuración

### Paso 1: Preparar tu Google Sheet

1. Abre tu Google Sheet
2. Asegúrate de que tenga los encabezados correctos en la primera fila
3. Haz clic en **Archivo > Compartir > Publicar en la web**
4. Selecciona "Hoja 1" (o la hoja que quieras usar)
5. Elige "Valores separados por comas (.csv)" o "Página web"
6. Copia el ID del Sheet de la URL (parte entre `/d/` y `/edit`)

### Paso 2: Obtener Google API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs y Servicios > Credenciales**
4. Haz clic en **Crear credenciales > Clave de API**
5. (Opcional) Restringe la API Key solo a Google Sheets API
6. Copia la API Key generada

### Paso 3: Habilitar Google Sheets API

1. En Google Cloud Console, ve a **APIs y Servicios > Biblioteca**
2. Busca "Google Sheets API"
3. Haz clic en "Habilitar"

### Paso 4: Configurar el Dashboard

1. Abre el archivo `app.js`
2. Reemplaza los valores en la sección de configuración:

```javascript
const SHEET_ID = 'TU_SHEET_ID_AQUI';
const API_KEY = 'TU_API_KEY_AQUI';
const RANGE = 'A1:H500'; // Ajusta el rango según tus datos
```

## 🎯 Uso

1. Abre `index.html` en tu navegador
2. El dashboard cargará los datos automáticamente
3. Usa la búsqueda para filtrar envíos
4. Haz clic en el botón de refresh para actualizar manualmente

## 📊 Estructura de Datos Esperada

Tu Google Sheet debe tener esta estructura:

| MAWB First Leg | MAWB Second Leg | Status | Review Start | Review End | Time to Complete | Reference | Comments |
|----------------|-----------------|--------|--------------|------------|------------------|-----------|----------|
| 369-95503730 | 810-40481420 | Review | 15/8/2025 | 15/8/2025 | 4 H, 41 M | 70 | AWB working... |

## 🎨 Estados Disponibles

- **Review** - En revisión (azul)
- **Pending** - Pendiente (amarillo)
- **Transmissions** - En transmisión (púrpura)
- **Inspection** - En inspección (naranja)
- **Released** - Liberado (verde)

## 🔄 Actualización de Datos

El dashboard:
- Se actualiza automáticamente cada **5 minutos**
- Puedes forzar una actualización con el botón de refresh
- Muestra la última fecha de actualización en el header

## 🐛 Solución de Problemas

### "Error al cargar datos"
- Verifica que tu API Key sea correcta
- Asegúrate de que Google Sheets API esté habilitada
- Confirma que el SHEET_ID sea el correcto
- Verifica que el Sheet esté publicado o sea accesible

### "No se muestran datos"
- Revisa que los nombres de columnas coincidan
- Verifica que haya datos en el Sheet
- Abre la consola del navegador (F12) para ver errores

### Datos desactualizados
- Verifica que estés editando el Google Sheet correcto
- Los cambios pueden tardar unos segundos en sincronizarse
- Usa el botón de refresh para forzar actualización

## 🔒 Seguridad

⚠️ **Importante**: 
- No compartas tu API Key públicamente
- Restringe la API Key solo a Google Sheets API
- Si vas a desplegar en producción, considera usar un backend para proteger las credenciales

## 📦 Despliegue

### Opción 1: Servidor Local
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js
npx http-server -p 8000
```

### Opción 2: GitHub Pages
1. Sube los archivos a un repositorio de GitHub
2. Ve a Settings > Pages
3. Selecciona la rama main
4. Tu dashboard estará disponible en `https://tu-usuario.github.io/repo`

### Opción 3: Netlify/Vercel
1. Arrastra la carpeta a Netlify Drop o Vercel
2. Tu dashboard estará en línea en segundos

## 📝 Personalización

### Cambiar colores
Edita la configuración de Tailwind en `index.html`:

```javascript
colors: {
    primary: "#f97316", // Cambia el color principal
}
```

### Modificar intervalos de actualización
En `app.js`, cambia:

```javascript
setInterval(() => {
    initDashboard();
}, 5 * 60 * 1000); // 5 minutos (en milisegundos)
```

## 🤝 Contribuciones

¿Encontraste un bug o tienes una sugerencia? Abre un issue o pull request.

## 📄 Licencia

MIT License - Siéntete libre de usar este proyecto como desees.

---

**Hecho con ❤️ para operaciones logísticas eficientes**
