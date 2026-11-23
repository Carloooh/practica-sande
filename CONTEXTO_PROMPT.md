# Contexto para IA y Guía de Setup en Nuevo Equipo

Este archivo está pensado para que mañana, cuando abras otro computador, tengas a mano:

1. **El prompt exacto para copiar y pegar en la IA** para que sepa exactamente en qué punto quedamos y cómo ayudarte.
2. **La guía rápida de instalación y preparación de entorno** (sin instalar SQL Server ni SSMS).
3. **Cómo conectar la API a una base de datos remota por URL/IP**.

---

## 1. 🤖 Prompt Maestro para la IA (Copiar y Pegar en el Nuevo Chat)

Copia y pega el siguiente bloque en la IA de tu nuevo computador:

```text
Hola. Estoy preparando una prueba técnica presencial de 1 hora para el cargo de Especialista en TI en la empresa SANDE S.A. que rendiré este martes.

El caso práctico evalúa:
1. Construir una API sencilla en C# (.NET Web API).
2. Realizar consultas en SQL Server (tanto con consultas directas/nativas con SqlCommand como con ORM EF Core).
3. Conectar un componente de Angular al backend para listar y manipular datos.

Vengo con experiencia en React y Next.js, por lo que estoy trabajando en Angular moderno (Standalone components con @Input/@Output, rutas dinámicas y Tailwind CSS).

Ya tengo un monorepo creado y subido en GitHub con toda la base y documentación:
Repo: https://github.com/Carloooh/practica-sande
Estructura:
- backend/Sande.Api: API en C# con CORS habilitado, Login con JWT Bearer (AuthController), UsersController (con EF Core) y ProductsController (con consultas SQL nativas usando ProductRepository y SqlConnection).
- frontend/sande-ui: Angular 19 + Tailwind con Navbar, ProductCard (componente hijo reutilizable), ProductList (padre que consume la API) y ProductDetail (ruta /producto/:id).
- Documentos de estudio incluidos en el repo: ARQUITECTURA.md, FRONTEND.md y GUIA_PRACTICA.md.

Por favor, ayúdame a continuar practicando hoy. Respóndeme con explicaciones directas, código conciso y enfoque pragmático para una prueba de 1 hora.

Revisa lo que tengo y por dónde debería empezar a practicar ahora, no quiero que me cambies los archivos, sólo que actues como guía y me vayas dando c´ódigo pero por la interfaz, no en los archivos directo, YO TENGO Y QUIERO HACER LOS CAMBIOS PARA APRENDER
```

---

## 2. 💻 Setup del Nuevo Computador en 10 Minutos

No necesitas instalar programas pesados. Solo instala estas 4 herramientas esenciales:

1. **Git:** [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. **.NET SDK (8 o superior):** [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
3. **Node.js (LTS v20 o v22):** [https://nodejs.org/](https://nodejs.org/)
4. **Visual Studio Code:** [https://code.visualstudio.com/](https://code.visualstudio.com/)

### Extensiones de VS Code Recomendadas:

- **C# Dev Kit** (de Microsoft)
- **Angular Language Service**
- **Tailwind CSS IntelliSense**
- **SQL Server (mssql)** (de Microsoft) 👉 _¡Te permite conectarte y ejecutar queries SQL directamente dentro de VS Code sin instalar SSMS!_

### Comandos de Terminal tras instalar lo anterior:

```bash
# 1. Instalar Angular CLI de forma global
npm install -g @angular/cli

# 2. Instalar herramienta de migraciones .NET (opcional)
dotnet tool install --global dotnet-ef

# 3. Clonar tu repositorio
git clone https://github.com/Carloooh/practica-sande.git
cd practica-sande
```

---

## 3. 🌐 Conexión a Base de Datos Remota por URL/IP (Sin SQL Server Local ni SSMS)

Si tienes un servidor remoto de SQL Server (en la nube, VPS o servidor propio), no necesitas instalar SQL Server ni SSMS en tu máquina.

### A. Estructura de la Cadena de Conexión Remota

#### Opción 1: Servidor por Dominio / URL

```text
Server=tcp:tu-servidor.com,1433;Database=SandeDB;User Id=tu_usuario;Password=tu_password;Encrypt=True;TrustServerCertificate=True;
```

#### Opción 2: Servidor por Dirección IP

```text
Server=192.168.1.50,1433;Database=SandeDB;User Id=tu_usuario;Password=tu_password;Encrypt=False;TrustServerCertificate=True;
```

> 💡 **Parámetros clave explicados:**
>
> - `,1433`: Es el puerto estándar de SQL Server.
> - `TrustServerCertificate=True;`: Evita errores si el servidor no tiene un certificado SSL firmado por una entidad pública.
> - `Encrypt=True;` o `False;`: Si el servidor remoto exige conexión cifrada, déjalo en `True`.

---

### B. Cómo configurar la conexión en tu API

Dentro de `backend/Sande.Api`, puedes configurarla de dos formas:

#### Forma 1: Con User Secrets (Recomendada para no subir contraseñas a Git)

```bash
cd backend/Sande.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=tcp:tu-servidor.com,1433;Database=SandeDB;User Id=tu_usuario;Password=tu_password;TrustServerCertificate=True;"
```

#### Forma 2: Directamente en `appsettings.json`

Edita `backend/Sande.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:tu-servidor.com,1433;Database=SandeDB;User Id=tu_usuario;Password=tu_password;TrustServerCertificate=True;"
  }
}
```

---

### C. Cómo ejecutar queries SQL en el servidor remoto SIN SSMS

Para ver o crear tablas sin instalar SSMS:

1. En **VS Code**, instala la extensión **"SQL Server (mssql)"** de Microsoft.
2. Presiona `Ctrl + Shift + P` y escribe: `MS SQL: Add Connection`.
3. Ingresa:
   - Server name: `tu-servidor.com,1433` o tu IP.
   - Database name: `SandeDB`.
   - Authentication: `SQL Login`.
   - User y Password.
4. Presiona `Ctrl + Shift + P` y escribe: `MS SQL: New Query`. ¡Ya puedes ejecutar consultas `SELECT`, `CREATE TABLE` o `INSERT` directamente en una pestaña de VS Code!

---

## 4. ⚡ Comandos para Levantar Todo en 2 Minutos

Una vez clonado el repositorio:

### Terminal 1 (Backend):

```bash
cd practica-sande/backend/Sande.Api
dotnet run
```

> Swagger queda disponible en: `http://localhost:5000/swagger`

### Terminal 2 (Frontend):

```bash
cd practica-sande/frontend/sande-ui
npm install
ng serve
```

> Angular queda disponible en: `http://localhost:4200`
