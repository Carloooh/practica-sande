# Arquitectura, Flujo y Criterio Técnico - Sande.Api

Este documento explica cómo funciona la arquitectura de la API, qué aspectos técnicos debes cuidar y cómo defender tu diseño ante los evaluadores en una prueba técnica.

---

## 1. El Flujo de la API (Resumen Rápido y Sencillo)

El ciclo de vida de cualquier petición en esta API sigue solo 3 pasos:

```
[ Petición HTTP ]  --> Angular / Postman / Swagger
       │
       ▼
[ Controller ]     --> Recibe los datos y define la respuesta (200 OK, 400, 401, 404)
       │
       ▼
[ Acceso a Datos ] --> EF Core (AppDbContext)  O  SQL Directo (ProductRepository)
       │
       ▼
[ SQL Server ]     --> SandeDB (Guarda o consulta la información)
```

1. **Entrada:** La petición llega a una URL (ej. `GET /api/products` o `POST /api/auth/login`).
2. **Procesamiento:** El Controlador toma los datos del Body/Query, ejecuta la lógica directa o consulta a la base de datos (con Entity Framework o con `SqlCommand`).
3. **Salida:** El Controlador devuelve un código de estado HTTP adecuado (`200 OK`, `201 Created`, `401 Unauthorized`) junto con el JSON correspondiente.

---

## 2. Estructura Actual de Archivos: ¿Qué hace cada uno?

La solución actual está diseñada para ser **ultrarrápida de implementar** (ideal para una prueba de 1 hora):

| Archivo / Carpeta | ¿Qué hace? | ¿Por qué está ahí? |
| :--- | :--- | :--- |
| **`Program.cs`** | Configura CORS, JWT, DbContext y Swagger. | Es el arranque de la app; define qué librerías y middlewares se usan. |
| **`Controllers/AuthController.cs`** | Valida usuario y contraseña; emite el Token JWT. | Separa la seguridad del resto del sistema. |
| **`Controllers/UsersController.cs`** | CRUD de usuarios usando **Entity Framework Core**. | Demuestra dominio de ORM moderno y protección con `[Authorize]`. |
| **`Controllers/ProductsController.cs`** | CRUD de productos usando **SQL Directo**. | Demuestra dominio de consultas SQL nativas sin ORM. |
| **`Data/AppDbContext.cs`** | Sesión de EF Core con las tablas `Users` y `Products`. | Mapea las clases C# a la base de datos relacional. |
| **`Data/ProductRepository.cs`** | Contiene el código ADO.NET (`SqlConnection`, `SqlCommand`). | Aísla el código SQL crudo para no ensuciar el Controller. |
| **`Models/User.cs`** | Clase `User` y sus DTOs (`LoginRequest`, `UserResponse`). | Agrupa el modelo y sus contratos de entrada/salida en un solo lugar. |
| **`Models/Product.cs`** | Clase `Product` con propiedades básicas (`Id`, `Name`, etc.). | Representa la entidad del inventario. |

---

## 3. Puntos Críticos a Tener en Cuenta (Checklist para la Prueba)

Si te toca programar esto bajo presión de tiempo, asegúrate de no olvidar estos 5 puntos clave:

1. **CORS Habilitado desde el Inicio:**
   - Si no configuras `.UseCors(...)` en `Program.cs`, el navegador bloqueará cualquier petición desde Angular (`localhost:4200`).
   - El middleware `app.UseCors(...)` **debe ir antes** de `app.UseAuthentication()` y `app.UseAuthorization()`.

2. **Seguridad contra SQL Injection (Consultas directas):**
   - **NUNCA concatenes cadenas** en SQL:  
     ❌ `var query = "SELECT * FROM Products WHERE Id = " + id;` (Fallo grave en entrevistas).
   - **SIEMPRE usa parámetros:**  
     ✅ `command.Parameters.AddWithValue("@Id", id);`

3. **Contraseñas Seguras (Hashing):**
   - Nunca guardes contraseñas en texto plano.
   - En .NET se usa `PasswordHasher<User>` de forma nativa sin instalar librerías externas complejas.

4. **Tiempos de Vida de Inyección de Dependencias (`Program.cs`):**
   - Los repositorios y DbContext deben registrarse con **`AddScoped`** (una instancia por cada petición HTTP).
   - Si te preguntan la diferencia:
     - `Transient`: Instancia nueva cada vez que se pide.
     - `Scoped`: Una por petición HTTP (ideal para bases de datos).
     - `Singleton`: Una única instancia para toda la vida de la app.

5. **Códigos de Estado HTTP Correctos:**
   - `200 OK`: Petición exitosa con datos.
   - `201 Created`: Creación exitosa (ideal para `POST`).
   - `204 NoContent`: Eliminación exitosa (ideal para `DELETE`).
   - `400 BadRequest`: Datos enviados inválidos.
   - `401 Unauthorized`: No envió token o el token expiró.
   - `403 Forbidden`: Tiene token, pero no tiene el rol necesario.
   - `404 NotFound`: El registro buscado no existe.

---

## 4. La Estructura Ideal para Producción (Si tuvieras más tiempo)

En un proyecto empresarial a gran escala, no se coloca todo en un solo proyecto Web API. Se utiliza **Clean Architecture** (Arquitectura Limpia) o **Arquitectura en Capas (N-Tier)** dividida en proyectos independientes:

```
SandeSolution.sln
│
├── 1. Sande.Domain/                    --> Núcleo del Negocio
│   ├── Entities/ (User, Product)       (Sin dependencias externas ni EF)
│   ├── Enums/
│   └── Exceptions/ (Reglas de dominio)
│
├── 2. Sande.Application/               --> Casos de Uso y Lógica
│   ├── Interfaces/ (IProductRepository, IAuthService)
│   ├── DTOs/ (Requests y Responses)
│   ├── Validators/ (FluentValidation para sanitizar entradas)
│   └── Services/ o CQRS (MediatR Handlers)
│
├── 3. Sande.Infrastructure/            --> Implementaciones Técnicas
│   ├── Persistence/ (AppDbContext, Migrations)
│   ├── Repositories/ (Implementaciones concretas de interfaces con EF y Dapper)
│   └── Authentication/ (Generador de tokens JWT)
│
├── 4. Sande.Api/                       --> Presentación / HTTP
│   ├── Controllers/ (Delgados, solo llaman a Application)
│   ├── Middlewares/ (Manejo Global de Excepciones - ProblemDetails RFC 7807)
│   └── Program.cs (Composición de dependencias)
│
└── 5. Sande.UnitTests/                 --> Pruebas Automatizadas
    ├── ApplicationTests/ (Pruebas unitarias de servicios con Moq)
    └── ControllerTests/
```

### ¿Qué mejoras técnicas aporta esta estructura ideal?
1. **Independencia de Frameworks:** El dominio no sabe si los datos se guardan en SQL Server, Oracle o en memoria.
2. **100% Testeable:** Se pueden hacer pruebas unitarias de toda la lógica de negocio mockeando las interfaces sin necesidad de levantar una base de datos real.
3. **Mantenibilidad:** Si cambias la base de datos o el sistema de autenticación, solo tocas `Infrastructure`, sin afectar a los controladores ni al dominio.
4. **Manejo Centralizado de Errores:** En lugar de `try/catch` en cada método, un Middleware intercepta las excepciones y devuelve un formato estándar (`RFC 7807`).

---

## 5. El "Pitch" para la Entrevista (Qué responder en la prueba)

Cuando entregues la prueba o el evaluador revise tu código, di esto con seguridad:

> *"**Estrategia adoptada:**  
> Dado que la prueba práctica tiene una restricción de tiempo de 60 minutos y requería conectar base de datos, API y un componente Angular, apliqué un enfoque pragmático de **Vertical Slice / Arquitectura Directa**.  
> Esto me permitió entregar un flujo 100% funcional de punta a punta, cubriendo tanto consultas directas con SQL Server (`SqlCommand` parametrizado) como ORM con Entity Framework y autenticación JWT con CORS habilitado.
> 
> **Cómo lo escalaría en producción:**  
> Si dispusiera de un sprint de desarrollo normal, desacoplaría la solución en una **Clean Architecture** formal en capas (Domain, Application, Infrastructure y API). Implementaría validaciones con **FluentValidation**, manejo global de errores mediante un **Middleware de Excepciones**, paginación en las consultas SQL y una suite de **tests unitarios con xUnit y Moq**."*

💡 **Por qué esta respuesta es impecable:**  
Demuestra que **no eres un programador que se pierde en la teoría**, sino alguien que sabe entregar resultados funcionando bajo presión, pero que tiene el conocimiento técnico para diseñar software robusto a nivel empresarial.
