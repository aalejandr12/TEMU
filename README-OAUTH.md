# 🔐 Configuración de OAuth 2.0 para LogiTrack Dashboard

## ✅ Ventajas de usar OAuth en lugar de API Key

### Con OAuth 2.0:
- ✅ **No necesitas API Key** - Los usuarios inician sesión con su cuenta de Google
- ✅ **Más seguro** - Cada usuario usa sus propios permisos
- ✅ **Control de acceso** - Solo usuarios de `@aeropost.com` pueden acceder
- ✅ **Sesión persistente** - Los usuarios permanecen conectados
- ✅ **Auditoría** - Sabes quién accede y cuándo
- ✅ **Fácil para usuarios** - Solo un clic para iniciar sesión

### Con API Key (método anterior):
- ❌ Requiere configuración manual
- ❌ La API Key es compartida por todos
- ❌ Riesgo de exposición de la clave
- ❌ Sin control por usuario individual

---

## 📋 Paso 1: Configurar Google Cloud Console

### 1.1 Crear proyecto (si no tienes uno)

1. Ve a: https://console.cloud.google.com
2. Clic en el selector de proyectos (arriba a la izquierda)
3. Clic en **"Nuevo Proyecto"**
4. Nombre: `Aeropost LogiTrack`
5. Clic en **"Crear"**

### 1.2 Habilitar APIs necesarias

1. En el menú lateral: **APIs y Servicios > Biblioteca**
2. Busca y habilita estas APIs:
   - **Google Sheets API**
   - **Google+ API** (para obtener info del usuario)

---

## 🔑 Paso 2: Crear credenciales OAuth 2.0

### 2.1 Configurar pantalla de consentimiento

1. Ve a: **APIs y Servicios > Pantalla de consentimiento de OAuth**
2. Selecciona **"Interno"** (solo usuarios de tu organización)
   - Si no puedes seleccionar "Interno", selecciona "Externo" y luego agregarás el dominio permitido
3. Completa la información:
   - **Nombre de la aplicación**: `Aeropost LogiTrack Dashboard`
   - **Correo electrónico de asistencia**: tu correo `@aeropost.com`
   - **Logotipo** (opcional)
   - **Dominio de la aplicación** (opcional): tu sitio web
   - **Correo de contacto del desarrollador**: tu correo
4. Clic en **"Guardar y continuar"**

### 2.2 Agregar alcances (scopes)

1. En la sección "Alcances", clic en **"Agregar o quitar alcances"**
2. Selecciona o agrega estos alcances:
   ```
   https://www.googleapis.com/auth/spreadsheets.readonly
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```
3. Clic en **"Actualizar"**
4. Clic en **"Guardar y continuar"**

### 2.3 Crear ID de cliente OAuth

1. Ve a: **APIs y Servicios > Credenciales**
2. Clic en **"+ Crear credenciales"**
3. Selecciona **"ID de cliente de OAuth"**
4. Tipo de aplicación: **"Aplicación web"**
5. Nombre: `LogiTrack Web Client`

6. **Orígenes de JavaScript autorizados** (añade todos los que uses):
   ```
   http://localhost
   http://localhost:8000
   http://localhost:3000
   http://127.0.0.1:8000
   https://tu-usuario.github.io
   https://tu-dominio-personalizado.com
   ```

7. **URI de redirección autorizados** (añade los mismos):
   ```
   http://localhost
   http://localhost:8000
   http://localhost:8000/index-oauth.html
   http://127.0.0.1:8000
   https://tu-usuario.github.io
   https://tu-usuario.github.io/tu-repo
   ```

8. Clic en **"Crear"**

### 2.4 Copiar el CLIENT ID

1. Se mostrará una ventana con tu **Client ID**
2. Cópialo (se ve algo así):
   ```
   123456789-abc123def456ghi789jkl012mno345pqr.apps.googleusercontent.com
   ```
3. Guárdalo en un lugar seguro

---

## ⚙️ Paso 3: Configurar el Dashboard

### 3.1 Editar app-oauth.js

1. Abre el archivo `app-oauth.js`
2. En la **línea 7**, reemplaza el CLIENT_ID:

```javascript
// Reemplaza esto:
const GOOGLE_CLIENT_ID = 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com';

// Con tu Client ID real:
const GOOGLE_CLIENT_ID = '123456789-abc123def456ghi789jkl012mno345pqr.apps.googleusercontent.com';
```

### 3.2 Configurar el SHEET_ID

En la **línea 10**, reemplaza con tu Google Sheet ID:

```javascript
const SHEET_ID = 'TU_SHEET_ID_AQUI';
```

### 3.3 Configurar el dominio permitido

En la **línea 14**, el dominio está configurado para `aeropost.com`:

```javascript
const ALLOWED_DOMAIN = 'aeropost.com';
```

**Si usas otro dominio**, cámbialo:
```javascript
const ALLOWED_DOMAIN = 'tu-empresa.com';
```

---

## 🎯 Paso 4: Dar permisos al Google Sheet

### Opción A: Compartir con usuarios específicos

1. Abre tu Google Sheet
2. Clic en **"Compartir"** (arriba derecha)
3. Agrega los correos de los usuarios que usarán el dashboard:
   ```
   usuario1@aeropost.com
   usuario2@aeropost.com
   ```
4. Permisos: **"Lector"** o **"Comentarista"**
5. Clic en **"Enviar"**

### Opción B: Compartir con todo el dominio

1. Abre tu Google Sheet
2. Clic en **"Compartir"**
3. En "Obtener enlace", cambia a:
   ```
   Cualquier persona de tu organización con el vínculo
   ```
4. Permisos: **"Lector"**

---

## 🚀 Paso 5: Desplegar en GitHub Pages

### 5.1 Crear repositorio

1. Ve a: https://github.com
2. Clic en **"New repository"**
3. Nombre: `aeropost-logitrack`
4. Visibilidad: **Público** o **Privado** (ambos funcionan con Pages)
5. Clic en **"Create repository"**

### 5.2 Subir archivos

Desde la terminal (PowerShell):

```powershell
cd "c:\Users\Alejandro Garcia\Downloads\TEMU"

git init
git add index-oauth.html app-oauth.js README-OAUTH.md
git commit -m "Initial commit - LogiTrack Dashboard with OAuth"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/aeropost-logitrack.git
git push -u origin main
```

### 5.3 Activar GitHub Pages

1. En tu repositorio, ve a **Settings > Pages**
2. En "Source", selecciona: **"Deploy from a branch"**
3. Branch: **main** / Carpeta: **/ (root)**
4. Clic en **"Save"**

5. Espera unos minutos, tu sitio estará en:
   ```
   https://TU-USUARIO.github.io/aeropost-logitrack/index-oauth.html
   ```

### 5.4 Actualizar los URIs autorizados en Google Cloud

1. Ve a Google Cloud Console > Credenciales
2. Edita tu OAuth Client ID
3. Agrega tu URL de GitHub Pages a:
   - **Orígenes de JavaScript autorizados**:
     ```
     https://TU-USUARIO.github.io
     ```
   - **URIs de redirección autorizados**:
     ```
     https://TU-USUARIO.github.io
     https://TU-USUARIO.github.io/aeropost-logitrack/index-oauth.html
     ```
4. Guarda los cambios

---

## 🧪 Paso 6: Probar el Dashboard

### 6.1 Prueba local

```powershell
cd "c:\Users\Alejandro Garcia\Downloads\TEMU"
python -m http.server 8000
```

Abre: http://localhost:8000/index-oauth.html

### 6.2 Prueba en línea

Abre tu URL de GitHub Pages: `https://TU-USUARIO.github.io/aeropost-logitrack/index-oauth.html`

### 6.3 Flujo de autenticación

1. **Primera vez**:
   - Verás una pantalla de login
   - Clic en "Iniciar sesión con Google"
   - Selecciona tu cuenta `@aeropost.com`
   - Acepta los permisos solicitados
   - El dashboard se carga automáticamente

2. **Siguientes visitas**:
   - La sesión queda guardada
   - Acceso automático (si el token no ha expirado)

3. **Verificación de dominio**:
   - Si usas un correo que NO es `@aeropost.com`, verás un error
   - Solo usuarios del dominio permitido pueden acceder

---

## 🔒 Seguridad y Mejores Prácticas

### ✅ Lo que ES seguro:

- ✅ El CLIENT_ID puede estar en el código público (no es secreto)
- ✅ OAuth usa tokens temporales que expiran
- ✅ Cada usuario usa sus propios permisos de Google
- ✅ El dominio está restringido a `@aeropost.com`

### ⚠️ Consideraciones:

- 🔐 **No uses "External" en producción** - Usa "Internal" si tienes Google Workspace
- 🔐 **Revisa los permisos** regularmente en Google Cloud Console
- 🔐 **Mantén actualizado** el listado de URIs autorizados
- 🔐 **Monitorea el acceso** desde Google Cloud Console > APIs y Servicios > Panel

---

## 📊 Paso 7: Uso del Dashboard

### Funciones disponibles:

1. **Login/Logout**:
   - Botón en la sidebar para cerrar sesión
   - El token se guarda en localStorage para sesión persistente

2. **Datos en tiempo real**:
   - Los datos se cargan directamente de Google Sheets
   - Actualización automática cada 5 minutos
   - Botón de refresh manual

3. **Búsqueda**:
   - Filtra envíos por MAWB, estado, referencia

4. **Modo oscuro**:
   - Toggle en el header

5. **Información del usuario**:
   - Avatar y nombre en la sidebar
   - Muestra el correo del usuario autenticado

---

## ❗ Solución de Problemas

### Error: "idpiframe_initialization_failed"

**Causa**: Cookies bloqueadas o extensiones de privacidad.

**Solución**:
1. Permite cookies de terceros para `accounts.google.com`
2. Desactiva extensiones como Privacy Badger temporalmente
3. Prueba en modo incógnito

---

### Error: "popup_closed_by_user"

**Causa**: El usuario cerró la ventana de login.

**Solución**: Simplemente intenta de nuevo.

---

### Error: "redirect_uri_mismatch"

**Causa**: La URL desde donde estás accediendo no está en los URIs autorizados.

**Solución**:
1. Ve a Google Cloud Console > Credenciales
2. Edita tu OAuth Client ID
3. Agrega la URL exacta desde donde estás accediendo

---

### "Acceso denegado. Solo usuarios de @aeropost.com"

**Causa**: Estás intentando acceder con un correo que no es del dominio permitido.

**Solución**: Usa una cuenta `@aeropost.com` o cambia el dominio en `app-oauth.js` línea 14.

---

### No se cargan los datos del Sheet

**Posibles causas y soluciones**:

1. **El Sheet no está compartido**:
   - Comparte el Sheet con el usuario que intenta acceder
   
2. **SHEET_ID incorrecto**:
   - Verifica el ID en `app-oauth.js` línea 10

3. **Google Sheets API no habilitada**:
   - Ve a Google Cloud Console y habilítala

4. **El token expiró**:
   - Cierra sesión y vuelve a iniciar

---

## 📈 Ventajas para tu equipo

### Para Administradores:
- ✅ Control total sobre quién accede
- ✅ No necesitas distribuir API Keys
- ✅ Fácil de revocar acceso (desde Google Workspace)
- ✅ Auditoría de accesos

### Para Usuarios:
- ✅ Login con un solo clic
- ✅ No necesitan configurar nada
- ✅ Sesión persistente
- ✅ Acceso desde cualquier dispositivo

### Para Desarrollo:
- ✅ Sin secretos en el código
- ✅ Seguro para repositorios públicos
- ✅ Escalable a múltiples usuarios
- ✅ Fácil mantenimiento

---

## 🎯 Checklist Final

Antes de publicar, verifica:

- [ ] CLIENT_ID configurado en `app-oauth.js`
- [ ] SHEET_ID configurado en `app-oauth.js`
- [ ] ALLOWED_DOMAIN configurado correctamente
- [ ] Google Sheets API habilitada
- [ ] OAuth Client creado en Google Cloud
- [ ] URIs autorizados incluyen tu dominio de GitHub Pages
- [ ] Pantalla de consentimiento configurada
- [ ] Google Sheet compartido con usuarios
- [ ] Repositorio subido a GitHub
- [ ] GitHub Pages activado
- [ ] Prueba con usuario de `@aeropost.com`

---

## 🚀 ¡Listo para producción!

Tu dashboard ahora:
- ✅ Se autentica con OAuth 2.0
- ✅ Solo permite usuarios de `@aeropost.com`
- ✅ Obtiene datos directamente de Google Sheets
- ✅ No requiere API Keys compartidas
- ✅ Es seguro para desplegar públicamente

**URL final de ejemplo**:
```
https://tu-usuario.github.io/aeropost-logitrack/index-oauth.html
```

¡Disfruta de tu dashboard seguro y profesional! 🎉
