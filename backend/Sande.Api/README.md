# Sande Inventory - Guía Rápida para la Prueba Técnica (C# + SQL + Angular)

Guía completa, sencilla y directa para resolver la prueba técnica práctica en **SANDE S.A.** (API C#, consultas SQL Server y componente Angular).

> 💡 **Guía de Estudio y Arquitectura:** Consulta [ARQUITECTURA.md](file:///d:/Proyectos/practica-sande/backend/Sande.Api/ARQUITECTURA.md) para ver la explicación teórica detallada, el flujo simplificado, qué puntos tener en cuenta y la respuesta exacta para defender tu solución ante los evaluadores.

---

## 1. Arquitectura Simplificada del Proyecto

Para la prueba de 1 hora, eliminamos el sobre-diseño y dejamos una estructura **directa, funcional y limpia**:

```
Sande.Api/
├── Controllers/
│   ├── AuthController.cs      --> Login y Generación del Token JWT
│   ├── UsersController.cs     --> CRUD de Usuarios con EF Core (ORM)
│   └── ProductsController.cs  --> CRUD de Productos con SQL Directo a SQL Server
├── Data/
│   ├── AppDbContext.cs        --> Contexto de Entity Framework Core
│   └── ProductRepository.cs   --> Consultas SQL puras (SqlConnection / SqlCommand)
├── Models/
│   ├── User.cs                --> Modelo User y sus DTOs (LoginRequest, etc.)
│   └── Product.cs             --> Modelo Product
├── Program.cs                 --> Configuración de CORS, Base de Datos, JWT y Swagger
└── appsettings.json           --> Cadenas de conexión y configuración JWT
```

---

## 2. Comandos Paso a Paso para Iniciar desde Cero

### A. Backend (.NET Web API)

```bash
# 1. Crear carpeta y proyecto Web API
mkdir Sande.Api
cd Sande.Api
dotnet new webapi --use-controllers -n Sande.Api

# 2. Instalar paquetes esenciales
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Swashbuckle.AspNetCore

# 3. Configurar conexión local con User-Secrets
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=SandeDB;Trusted_Connection=True;TrustServerCertificate=True;"

# 4. Crear migraciones y base de datos (si usas EF Core para crear las tablas)
dotnet ef migrations add InitialCreate
dotnet ef database update

# 5. Ejecutar la API
dotnet run
```

### B. Frontend (Angular)

```bash
# 1. Crear proyecto Angular (Standalone por defecto)
ng new sande-ui --routing=false --style=css --skip-tests
cd sande-ui

# 2. Generar componente para la prueba
ng g c components/product-list

# 3. Levantar la aplicación Angular
ng serve -o
```

---

## 3. Archivos Clave para Copy-Paste

### `appsettings.json` (Configuración de Base de Datos y JWT)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SandeDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "SandeSuperSecretKeyForJwtAuthentication2026!",
    "Issuer": "Sande.Api",
    "Audience": "Sande.Client"
  }
}
```

### `Program.cs` (CORS + Base de Datos + JWT + Swagger)
```csharp
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Sande.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Habilitar CORS para permitir llamadas desde Angular (localhost:4200)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Registrar DbContext y Repositorio SQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);
builder.Services.AddScoped<ProductRepository>();

// Configurar Autenticación con Token JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SandeSuperSecretKeyForJwtAuthentication2026!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Sande.Api",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "Sande.Client",
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// CORS debe ejecutarse antes de Authentication & Authorization
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```

---

## 4. Consultas SQL Directas a SQL Server (`Data/ProductRepository.cs`)

Este archivo demuestra cómo conectarte a SQL Server **sin ORM** utilizando `Microsoft.Data.SqlClient`:

```csharp
using Microsoft.Data.SqlClient;
using Sande.Api.Models;

namespace Sande.Api.Data;

public class ProductRepository
{
    private readonly string _connectionString;

    public ProductRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    // Consulta SQL directa con SqlDataReader (SELECT)
    public async Task<List<Product>> GetAllAsync()
    {
        var products = new List<Product>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT Id, Name, Description, Price, Stock FROM Products";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            products.Add(new Product
            {
                Id = reader.GetInt32(0),
                Name = reader.GetString(1),
                Description = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                Price = reader.GetDecimal(3),
                Stock = reader.GetInt32(4)
            });
        }

        return products;
    }

    // Consulta SQL directa INSERT con parámetros (Anti SQL Injection)
    public async Task<int> CreateAsync(Product product)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO Products (Name, Description, Price, Stock)
                      VALUES (@Name, @Description, @Price, @Stock);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Name", product.Name);
        command.Parameters.AddWithValue("@Description", (object?)product.Description ?? DBNull.Value);
        command.Parameters.AddWithValue("@Price", product.Price);
        command.Parameters.AddWithValue("@Stock", product.Stock);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }
}
```

---

## 5. Conexión del Componente Angular a la API

### Paso 1: `src/app/app.config.ts` (Habilitar `HttpClient`)
```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient() // <-- Necesario para comunicarse con la API C#
  ]
};
```

### Paso 2: `src/app/components/product-list/product-list.component.ts`
Componente Standalone que hace la llamada a la API y opcionalmente envía el Token JWT:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 30px auto;">
      <h2>📦 Inventario de Productos - SANDE</h2>

      <!-- Formulario para agregar -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <input [(ngModel)]="newProduct.name" placeholder="Nombre" style="padding: 8px;" />
        <input [(ngModel)]="newProduct.price" type="number" placeholder="Precio" style="padding: 8px;" />
        <input [(ngModel)]="newProduct.stock" type="number" placeholder="Stock" style="padding: 8px;" />
        <button (click)="addProduct()" style="padding: 8px 16px; background: #007bff; color: white; border: none; cursor: pointer;">
          Guardar
        </button>
      </div>

      <!-- Tabla de productos -->
      <table border="1" cellpadding="8" style="width: 100%; border-collapse: collapse;">
        <thead style="background: #f4f4f4;">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          @for (item of products; track item.id) {
            <tr>
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>\${{ item.price }}</td>
              <td>{{ item.stock }}</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="4" style="text-align: center;">No hay productos registrados.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/products'; // Ajusta el puerto de tu API

  products: any[] = [];
  newProduct = { name: '', description: 'Creado desde Angular', price: 0, stock: 0 };

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error('Error al cargar productos:', err)
    });
  }

  addProduct() {
    this.http.post(this.apiUrl, this.newProduct).subscribe({
      next: () => {
        this.loadProducts();
        this.newProduct = { name: '', description: 'Creado desde Angular', price: 0, stock: 0 };
      },
      error: (err) => console.error('Error al agregar producto:', err)
    });
  }

  // Ejemplo: Cómo enviar el token JWT en una petición protegida
  getProtectedData(token: string) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get('http://localhost:5000/api/users', { headers });
  }
}
```

---

## 6. Cómo Probar el Flujo Completo con Token

1. **Crear usuario**:
   - `POST /api/users`
   - Body: `{"username": "carlos", "password": "123", "role": "Admin"}`
2. **Iniciar sesión (Login)**:
   - `POST /api/auth/login`
   - Body: `{"username": "carlos", "password": "123"}`
   - Respuesta: Recibes el `token`.
3. **Usar endpoint protegido**:
   - `GET /api/users`
   - Header HTTP: `Authorization: Bearer <tu_token_aqui>`
4. **Productos con SQL Directo**:
   - `GET /api/products` (Consulta SQL directa a SQL Server)
   - `POST /api/products` (Inserta en base de datos sin ORM)

---

## 7. Nota Técnica de Seniority (Para dejar en la prueba)

> *"**Nota de Arquitectura y Consideraciones de Producción:**  
> En esta prueba práctica de 1 hora se priorizó entregar una solución vertical funcional completa de punta a punta (SQL Server -> API C# -> Componente Angular con CORS).  
> 
> En un proyecto productivo empresarial, la solución se escalaría incorporando:
> 1. **Arquitectura en Capas / Clean Architecture:** Separación en Domain, Application e Infrastructure con Interfaces para testeo unitario.
> 2. **Seguridad y Tokens:** Refresh Tokens con expiración corta y rotación, y Claims-Based Authorization por roles.
> 3. **Validación:** FluentValidation para sanitización de DTOs antes de tocar la base de datos.
> 4. **Manejo de Errores:** Middleware global de excepciones devolviendo RFC 7807 (ProblemDetails)."*
