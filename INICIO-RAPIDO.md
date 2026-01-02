# 🚀 LogiTrack Dashboard - Guía de Inicio Rápido

## 📦 Archivos del Proyecto

Este proyecto incluye **DOS versiones** del dashboard:

### 🔐 Versión OAuth 2.0 (RECOMENDADA)
```
✅ index-oauth.html       ← Dashboard con login de Google
✅ app-oauth.js           ← Backend con autenticación OAuth
✅ README-OAUTH.md        ← Guía completa de configuración
```

### 🔑 Versión API Key (Alternativa)
```
📄 index.html             ← Dashboard básico
📄 app.js                 ← Backend con API Key
📄 README.md              ← Guía básica
📄 INSTRUCCIONES.md       ← Guía detallada
```

---

## ❓ ¿Cuál versión usar?

### 🎯 Usa la **Versión OAuth 2.0** si:
- ✅ Vas a publicar en **GitHub Pages** (código público)
- ✅ Quieres **control de acceso** solo para `@aeropost.com`
- ✅ Tienes **múltiples usuarios** (2+)
- ✅ Necesitas **seguridad profesional**
- ✅ Quieres **auditoría** de quién accede
- ✅ Tienes **Google Workspace** empresarial

**👉 Lee:** [README-OAUTH.md](README-OAUTH.md)

---

### 🔧 Usa la **Versión API Key** si:
- ✅ Solo para **pruebas locales**
- ✅ **1-2 usuarios** máximo
- ✅ **No vas a publicar** en sitio público
- ✅ Prefieres **configuración rápida**
- ✅ No necesitas control de acceso individual

**👉 Lee:** [INSTRUCCIONES.md](INSTRUCCIONES.md)

---

## 📊 Comparación Rápida

| Característica | OAuth 2.0 | API Key |
|----------------|-----------|---------|
| Tiempo de configuración | 30 min | 10 min |
| Seguridad | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Para GitHub Pages | ✅ Sí | ❌ No recomendado |
| Control por usuario | ✅ Sí | ❌ No |
| Login requerido | ✅ Sí | ❌ No |

**👉 Lee más:** [COMPARACION.md](COMPARACION.md)

---

## 🚀 Inicio Rápido - OAuth 2.0 (Recomendado)

### Paso 1: Configurar Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo
3. Habilita **Google Sheets API**
4. Crea credenciales **OAuth 2.0 Client ID**
5. Tipo: **Aplicación web**
6. Agrega URIs autorizados:
   ```
   http://localhost:8000
   https://TU-USUARIO.github.io
   ```

### Paso 2: Configurar el código

Edita `app-oauth.js` líneas 7-14:

```javascript
// Reemplaza con tu CLIENT ID de Google Cloud
const GOOGLE_CLIENT_ID = '123456-abc123.apps.googleusercontent.com';

// Reemplaza con tu Google Sheet ID
const SHEET_ID = 'TU_SHEET_ID_AQUI';

// Dominio permitido (ya configurado para Aeropost)
const ALLOWED_DOMAIN = 'aeropost.com';
```

### Paso 3: Probar localmente

```powershell
cd "c:\Users\Alejandro Garcia\Downloads\TEMU"
python -m http.server 8000
```

Abre: http://localhost:8000/index-oauth.html

### Paso 4: Publicar en GitHub Pages

```powershell
git init
git add index-oauth.html app-oauth.js README-OAUTH.md
git commit -m "Aeropost LogiTrack Dashboard"
git remote add origin https://github.com/TU-USUARIO/aeropost-logitrack.git
git push -u origin main
```

Activa GitHub Pages en: **Settings > Pages**

**👉 Guía completa:** [README-OAUTH.md](README-OAUTH.md)

---

## ⚡ Inicio Rápido - API Key (Desarrollo)

### Paso 1: Obtener API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto
3. Habilita **Google Sheets API**
4. Crea credenciales: **API Key**
5. Copia la clave

### Paso 2: Configurar el código

Edita `app.js` líneas 7-9:

```javascript
const SHEET_ID = 'TU_SHEET_ID_AQUI';
const API_KEY = 'TU_API_KEY_AQUI';
const RANGE = 'A1:H500';
```

### Paso 3: Hacer público el Google Sheet

1. Abre tu Google Sheet
2. **Archivo > Compartir > Publicar en la web**
3. Publica la hoja

### Paso 4: Probar

```powershell
cd "c:\Users\Alejandro Garcia\Downloads\TEMU"
python -m http.server 8000
```

Abre: http://localhost:8000/index.html

**👉 Guía completa:** [INSTRUCCIONES.md](INSTRUCCIONES.md)

---

## 📋 Estructura del Google Sheet

Asegúrate de que tu Google Sheet tenga estos encabezados en la **primera fila**:

```
| MAWB First Leg | MAWB Second Leg | Status | Review Start Date | Review End Date | Time to Complete | Reference | Comments |
```

**Estados válidos:**
- `Review`
- `Pending`
- `Transmissions`
- `Inspection`
- `Released`

---

## 📁 Estructura del Proyecto

```
📁 TEMU/
│
├── 🔐 VERSIÓN OAUTH 2.0 (Producción)
│   ├── index-oauth.html          ← Dashboard con login
│   ├── app-oauth.js              ← Backend OAuth
│   └── README-OAUTH.md           ← Guía OAuth
│
├── 🔑 VERSIÓN API KEY (Desarrollo)
│   ├── index.html                ← Dashboard básico
│   ├── app.js                    ← Backend API Key
│   ├── README.md                 ← Guía básica
│   └── INSTRUCCIONES.md          ← Guía detallada
│
├── 📄 COMPARACION.md             ← Comparación de métodos
├── 📄 INICIO-RAPIDO.md           ← Esta guía
├── 📄 config-example.js          ← Ejemplo de configuración
└── 📄 Ejemplo.html               ← Mockup original
```

---

## 🎯 Recomendación para Aeropost

### Para PRODUCCIÓN (GitHub Pages):

```bash
✅ USA: index-oauth.html + app-oauth.js
✅ SIGUE: README-OAUTH.md
```

**¿Por qué?**
- 🔒 Código público, pero seguro
- 👥 Solo usuarios `@aeropost.com`
- 📊 Auditoría de accesos
- ⚡ Mejor experiencia de usuario
- 🚀 Listo para escalar

### Para DESARROLLO LOCAL:

```bash
✅ USA: index.html + app.js
✅ SIGUE: INSTRUCCIONES.md
```

**¿Por qué?**
- ⚡ Configuración rápida
- 🔧 Ideal para pruebas
- 📝 Menos pasos iniciales

---

## 🆘 Soporte y Documentación

### Documentación Completa:

- **OAuth 2.0**: [README-OAUTH.md](README-OAUTH.md) - Guía paso a paso con OAuth
- **API Key**: [INSTRUCCIONES.md](INSTRUCCIONES.md) - Guía detallada con API Key
- **Comparación**: [COMPARACION.md](COMPARACION.md) - Diferencias y cuándo usar cada uno

### Recursos Externos:

- [Google Cloud Console](https://console.cloud.google.com)
- [Google Sheets API Docs](https://developers.google.com/sheets/api)
- [GitHub Pages Docs](https://docs.github.com/pages)
- [OAuth 2.0 Guía](https://developers.google.com/identity/protocols/oauth2)

---

## ✅ Checklist Antes de Empezar

Asegúrate de tener:

- [ ] Cuenta de Google (preferiblemente `@aeropost.com`)
- [ ] Google Sheet con datos estructurados
- [ ] Cuenta de GitHub (si vas a publicar)
- [ ] Editor de código (VS Code, Notepad++, etc.)
- [ ] Python instalado (para servidor local)

---

## 🎉 ¡Listo para comenzar!

### Próximos pasos:

1. **Decide qué versión usar** (recomendamos OAuth para producción)
2. **Lee la guía correspondiente**:
   - OAuth: [README-OAUTH.md](README-OAUTH.md)
   - API Key: [INSTRUCCIONES.md](INSTRUCCIONES.md)
3. **Sigue los pasos de configuración**
4. **Prueba localmente**
5. **Publica en GitHub Pages** (si usas OAuth)

---

## 💡 Tips Finales

### Para un despliegue exitoso:

✅ **Usa OAuth 2.0** para GitHub Pages
✅ **Comparte el Google Sheet** con los usuarios correctos
✅ **Prueba localmente** antes de publicar
✅ **Configura los URIs** correctamente en Google Cloud
✅ **Lee la documentación** completa

### Si tienes problemas:

1. **Revisa la consola del navegador** (F12)
2. **Verifica las credenciales** (CLIENT_ID, SHEET_ID)
3. **Comprueba los permisos** del Google Sheet
4. **Lee la sección de troubleshooting** en las guías

---

**🚀 ¡Éxito con tu LogiTrack Dashboard!**

---

*Desarrollado para Aeropost - Sistema de seguimiento de carga empresarial*
