# ⚡ CHEATSHEET RÁPIDO: .NET + ANGULAR

---

## 1. Comandos de Setup Rápido

### Backend (.NET 8 Web API)
```bash
# Crear proyecto Web API básico
dotnet new webapi -n Sande.Api --no-openapi false

# Paquetes esenciales
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.Data.SqlClient

# User Secrets (evitar quemar contraseñas)
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "ClaveSuperSecretaDeAlMenos32CaracteresMinimo12345!"

# Ejecutar backend
dotnet run
# o con recarga en caliente:
dotnet watch run
```

### Frontend (Angular 19+)
```bash
# Crear proyecto Angular (standalone por defecto)
npx @angular/cli new sande-ui --style=css --routing=true --ssr=false

# Instalar Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init

# Generar archivos de entorno (environments)
ng g environments

# Generar componentes y servicios
ng g s services/product
ng g c components/product-list
ng g c components/product-detail

# Ejecutar frontend
npm start
# o
ng serve -o
```

---

## 2. Cadenas de Conexión (Connection Strings)

En `appsettings.json` o `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    // 1. Localhost (Autenticación Windows integrada)
    "DefaultConnection": "Server=localhost;Database=SandeDb;Trusted_Connection=True;TrustServerCertificate=True;",

    // 2. Localhost (Con usuario y password SQL Server o Docker)
    "DockerConnection": "Server=localhost,1433;Database=SandeDb;User Id=sa;Password=TuPassword123!;TrustServerCertificate=True;",

    // 3. Servidor Remoto / Producción
    "RemoteConnection": "Server=192.168.1.100,1433;Database=SandeDb;User Id=usr_app;Password=SuperPasswordSeguro!;TrustServerCertificate=True;MultipleActiveResultSets=True;"
  }
}
```

> **Regla de oro:** Siempre agregar `;TrustServerCertificate=True;` en desarrollo para evitar errores SSL del certificado local.

---

## 3. Configuraciones Críticas

### A. Backend: `Program.cs` (CORS + JWT + DbContext + Inyección)
```csharp
var builder = WebApplication.CreateBuilder(args);

// 1. CORS (Obligatorio para que Angular consuma la API)
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngular", policy => {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 2. DbContext (Entity Framework)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. Inyección de Repositorios (ADO.NET o EF)
builder.Services.AddScoped<IProductRepository, ProductRepository>();

// 4. JWT Authentication (si aplica)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ClaveFallbackSeguraDe32CharsMinimo!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts => {
        opts.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular"); // ANTES de Auth
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

### B. Frontend: Tailwind Setup (`tailwind.config.js` y `styles.css`)
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: { extend: {} },
  plugins: [],
}
```
```css
/* src/styles.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### C. Frontend: Environments (`src/environments/environment.ts`)
```typescript
// environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5248/api'
};
```

### D. Frontend: Configuración Global (`app.config.ts`)
```typescript
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Si no usas zone.js (recomendado en Angular 19+):
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()), // permite recibir :id como @Input
    provideHttpClient(withFetch())
  ]
};
```

---

## 4. Orden de Implementación (¿Por dónde arrancar?)

1. **BBDD (5 min):** Ejecutar script SQL de tablas en SSMS / Azure Data Studio.
2. **Backend - Models (5 min):** Crear clases C# con propiedades que mapean las columnas.
3. **Backend - Data / Repo (10 min):**
   - Si es EF Core: Agregar `DbSet<Modelo>` en `AppDbContext`.
   - Si es SQL puro: Crear clase con `SqlConnection` y queries parametrizadas.
4. **Backend - Inyección y Controller (10 min):** Registrar en `Program.cs` y crear `Controller` con endpoints (`[HttpGet]`, `[HttpPost]`). Probar con Swagger.
5. **Frontend - Interfaces y Service (10 min):** Modelos TS + `HttpClient` consumiendo `environment.apiUrl`.
6. **Frontend - Componentes y Rutas (15 min):** Armar vista lista, vista detalle con `@for`, `@if` y estilos Tailwind.
7. **Frontend - Navbar & Navegación (5 min):** Enlazar en `navbar` con `routerLink`.

---

## 5. Dónde mirar "En Caso de Error"

| Error / Síntoma | Causa Frecuente | Dónde ir a revisar |
| :--- | :--- | :--- |
| **CORS policy error en consola browser** | No se configuró CORS o el orden en middleware está mal | `Program.cs` (`UseCors` antes de `UseAuthorization`) y que el origen coincida con `http://localhost:4200` |
| **Error 404 al llamar a la API** | URL mal armada o controller sin ruta | `environment.ts` (revisar puerto de la API) y `[Route("api/[controller]")]` en el Controller |
| **Error 500 al conectar a la BD** | Conexión rechazada, certificado inválido | `appsettings.json` (añadir `TrustServerCertificate=True`) y que SQL Server Browser/Service esté corriendo |
| **Los estilos de Tailwind no se aplican** | `content` no escanea los `.ts` o falta importar en css | `tailwind.config.js` (`content: ["./src/**/*.{html,ts}"]`) y `@tailwind` en `styles.css` |
| **Al navegar la pantalla queda en "Cargando..."** | Zoneless detection no disparó render o SSR falló | Inyectar `ChangeDetectorRef` y llamar `this.cdr.markForCheck()` tras recibir data de suscripción; o en `app.routes.server.ts` poner `renderMode: RenderMode.Server` en rutas con parámetros |
| **La ruta con parámetro `:id` no recibe el valor** | Falta `withComponentInputBinding()` o `ActivatedRoute` | `app.config.ts` o inyectar `route = inject(ActivatedRoute)` y leer `this.route.snapshot.paramMap.get('id')` |
| **Fallo de deserialización JSON en Angular** | Nombres de propiedades C# vs TS incompatibles | Por defecto .NET devuelve camelCase (`nombreCompleto`), verificar interface TS |
