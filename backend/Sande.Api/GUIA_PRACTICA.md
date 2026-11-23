# Plan de Entrenamiento y Guía Práctica para la Prueba Presencial (SANDE S.A.)

Esta guía te indica **qué te falta por hacer**, **cómo practicar por tu cuenta** y cómo abordar los 60 minutos de la prueba presencial en **Alameda 1771**.

---

## 1. ¿Qué te falta por hacer? (Checklist de Preparación)

Antes del martes 24, asegúrate de haber probado y visto funcionar el circuito completo en tu máquina:

- [ ] **Paso 1: Probar la base de datos local y tablas**
  - Asegúrate de que SQL Server esté corriendo en tu máquina.
  - Comprueba que la tabla `Products` existe y tiene datos de prueba. Si no, créala con el script SQL adjunto abajo.
- [ ] **Paso 2: Ejecutar y validar la API de C#**
  - En la terminal del backend: `dotnet run`.
  - Abre Swagger en `http://localhost:5000/swagger` (o el puerto que te indique la terminal).
  - Ejecuta `GET /api/products` y confirma que devuelve el JSON de productos.
  - Ejecuta `POST /api/products` y confirma que inserta un registro nuevo.
- [ ] **Paso 3: Levantar el frontend Angular y validar Tailwind**
  - En la terminal del frontend (`sande-ui`): `ng serve`.
  - Abre `http://localhost:4200` y confirma que el Navbar y el diseño se ven bien con Tailwind.
- [ ] **Paso 4: Conectar Angular con la API de C#**
  - Copia los componentes de [FRONTEND.md](file:///d:/Proyectos/practica-sande/backend/Sande.Api/FRONTEND.md) en tu `sande-ui`.
  - Asegúrate de que al abrir `http://localhost:4200`, la lista de productos se llena automáticamente con los datos de SQL Server.
- [ ] **Paso 5: Probar la comunicación Padre-Hijo**
  - Haz clic en el botón *"Seleccionar"* de una tarjeta.
  - Verifica que el componente padre muestre el mensaje azul: *"Padre notificado: Seleccionaste ..."*.
- [ ] **Paso 6: Probar la ruta dinámica `/producto/:id`**
  - Haz clic en *"Ver Detalle"* en una tarjeta.
  - Verifica que la URL cambie a `/producto/1` y cargue los datos específicos de ese producto.

---

## 2. Script SQL Rápido para Crear la Tabla (Por si te toca crearla en la prueba)

En SQL Server Management Studio (SSMS) o Azure Data Studio:

```sql
-- 1. Crear base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SandeDB')
BEGIN
    CREATE DATABASE SandeDB;
END
GO

USE SandeDB;
GO

-- 2. Crear tabla Products si no existe
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    CREATE TABLE Products (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(150) NOT NULL,
        Description NVARCHAR(500) NULL,
        Price DECIMAL(18,2) NOT NULL,
        Stock INT NOT NULL DEFAULT 0
    );

    -- Insertar datos de prueba iniciales
    INSERT INTO Products (Name, Description, Price, Stock) VALUES 
    ('Laptop Dell Vostro 3500', 'Core i5 11th Gen, 16GB RAM, SSD 512GB', 650000.00, 15),
    ('Monitor LG 27 Pulgadas', 'IPS Full HD 75Hz HDMI/VGA', 125000.00, 8),
    ('Teclado Mecánico Redragon', 'Switches Blue, Retroiluminado RGB', 35000.00, 25),
    ('Mouse Inalámbrico Logitech', 'Sensor óptico 1000 DPI USB', 15000.00, 40);
END
GO

-- 3. Probar la consulta
SELECT Id, Name, Description, Price, Stock FROM Products;
GO
```

---

## 3. Cómo Practicar (Simulacro Contrarreloj en 50 Minutos)

Para quitarte los nervios del martes, haz una **simulación cronometrada** este fin de semana:

### Minuto 00 a 10: Base de Datos
- Abre SSMS o terminal.
- Escribe la query SQL primero en el gestor de base de datos para asegurarte de que los nombres de columnas y tipos son correctos.

### Minuto 10 a 25: API C#
- Abre el backend.
- Crea el endpoint `GET /api/products` con `SqlConnection` o EF Core.
- **IMPRESCINDIBLE:** Verifica que `builder.Services.AddCors(...)` y `app.UseCors("AllowAll")` estén en `Program.cs`.
- Ejecuta `dotnet run` y prueba el `GET` en Swagger o en el navegador.

### Minuto 25 a 45: Frontend Angular
- Crea la interface `Product`.
- Inyecta `HttpClient` en tu componente con `private http = inject(HttpClient);`.
- En `ngOnInit()`, llama a `this.http.get<Product[]>('http://localhost:5000/api/products')`.
- En el template, dibuja la lista con `@for (p of products; track p.id)`.

### Minuto 45 a 50: Verificación y Entrega
- Abre el navegador en `http://localhost:4200` y recarga.
- ¿Se ven los productos? ¿Puedes agregar uno nuevo?
- Si sobra tiempo, redacta la nota técnica en el README.

---

## 4. Escenarios Sorpresa que te Pueden Pedir en SANDE

En una prueba técnica presencial suelen pedir una de estas 3 variaciones:

### Escenario A: "Queremos filtrar los productos por nombre o stock"
- **En SQL:**  
  `SELECT Id, Name, Price, Stock FROM Products WHERE Name LIKE '%' + @Search + '%' OR Stock > 0`
- **En Angular (Filtro en memoria con pipe o getter):**
  ```typescript
  search = '';
  get filtered() {
    return this.products.filter(p => p.name.toLowerCase().includes(this.search.toLowerCase()));
  }
  ```

### Escenario B: "Queremos un formulario para ingresar un nuevo producto"
- **En Angular:** Un formulario con `[(ngModel)]` conectado a `newProduct` y un botón `(click)="saveProduct()"`.
- **En C#:** Un endpoint `[HttpPost]` que reciba el objeto y haga el `INSERT`.

### Escenario C: "Queremos una vista de detalle cuando le den clic a un producto"
- Usa la ruta dinámica `/producto/:id`.
- En el componente de detalle, capturas el ID con `inject(ActivatedRoute).snapshot.paramMap.get('id')` y haces un `GET /api/products/${id}`.

---

## 5. Las 5 Cosas que NO Debes Olvidar el Martes

1. **Revisar el ambiente nada más sentarte:**
   - Abre la consola y verifica: `dotnet --version`, `node -v`, `ng version`.
   - Abre SQL Server (SSMS) y revisa si ya hay una base de datos creada por ellos o si debes crearla tú.
2. **Preguntar las credenciales de BD si no están claras:**
   - Si no sabes el servidor de SQL Server, pregunta amablemente:  
     *"¿Para la conexión a SQL Server uso autenticación de Windows con localhost o tienen alguna instancia/usuario específico configurado?"* (Demuestra profesionalismo).
3. **CORS:** Si la consola de Angular en el navegador muestra texto rojo diciendo *"Access to XMLHttpRequest blocked by CORS policy"*, ve directo a `Program.cs` y pon `app.UseCors("AllowAll")` antes de `UseAuthentication`.
4. **No usar concatenación de strings en SQL:** Recuerda siempre usar `command.Parameters.AddWithValue("@Param", valor)` para evitar vulnerabilidades de SQL Injection.
5. **Entregar con la "Nota de Arquitectura":**  
   Aunque el código sea directo y sencillo, dejar escrita la justificación técnica (ver [ARQUITECTURA.md](file:///d:/Proyectos/practica-sande/backend/Sande.Api/ARQUITECTURA.md#L94-L137)) te posiciona inmediatamente por encima de los demás postulantes.

---

## 6. Respuestas Rápidas para la Entrevista Oral

Si Francisco Sande o el equipo de TI te hacen preguntas durante o después de la prueba:

- **¿Por qué usaste consultas directas con SQL en lugar de Entity Framework (o viceversa)?**
  > *"Utilicé consultas directas con `SqlConnection` para tener control total sobre la sentencia SQL, optimizar el rendimiento y cumplir con el requerimiento de consultas nativas a SQL Server. En módulos donde prima la mantenibilidad y la velocidad de desarrollo (como el de Usuarios), utilizo Entity Framework Core."*

- **¿Cómo manejas la seguridad de la API?**
  > *"Implementando autenticación con Tokens JWT firmados con clave secreta y expiración corta, pasando claims del usuario (Id, Username, Rol) y protegiendo los controladores con el atributo `[Authorize]` y `[Authorize(Roles = "...")]`."*

- **¿Qué diferencias notas trabajando en Angular respecto a React o Next.js?**
  > *"Angular ofrece una solución más integrada 'out-of-the-box' con su propio cliente HTTP (`HttpClient`), sistema de enrutador robusto y validaciones de formularios tipados, mientras que Next.js se apoya más en convenciones de archivos y Server Actions. Con las últimas versiones de Angular (Standalone components y Signals), la experiencia de desarrollo se ha vuelto tan reactiva y ligera como en React."*
