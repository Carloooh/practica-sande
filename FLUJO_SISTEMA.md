# 🔄 FLUJO DEL SISTEMA: GUÍA RÁPIDA DE ARQUITECTURA

> **Objetivo:** Repasar en 10 minutos cómo se comunican el Frontend (Angular) y Backend (.NET) en cada módulo del sistema. Sin texto de relleno.

---

## 🗺️ Mapa General del Flujo

```
[ FRONTEND: Angular 19 ]                          [ BACKEND: .NET 8 Web API ]
Componente (HTML + TS)                           Controller ([ApiController])
       │                                                      │
       ▼ Inyecta e invoca                                     ▼ Inyecta e invoca
Service (HttpClient)  ─── Petición HTTP (JSON) ────► Repository (SQL / EF Core)
       ▲                                                      │
       │ Recibe Observable<T>                                 ▼ Abre conexión / Tx
Signal / CDR.markForCheck() ◄── Respuesta HTTP (JSON) ─── Base de Datos SQL Server
```

---

## 1. 🔐 Login & Autenticación (JWT)

### ¿Qué hace?
Valida identidad y entrega una credencial digital (Token) temporal.

* **Backend (`AuthController.cs`):**
  1. Recibe `{ username, password }`.
  2. Busca el usuario en la BD y compara contraseña (o hash).
  3. Si es válido, genera un JWT firmado con una clave secreta (`SymmetricSecurityKey`).
  4. Retorna `Ok(new { token = "eyJhbGciOi..." })`.
* **Frontend:**
  1. Envía `POST /api/auth/login`.
  2. Guarda el token (`localStorage.setItem('token', res.token)`).
  3. (Opcional) En peticiones privadas, envía cabecera: `Authorization: Bearer <token>`.

---

## 2. 📦 Catálogo y Vista Propia de Producto (`:id`)

### ¿Qué hace?
Muestra lista de productos y permite abrir uno específico para ver su detalle.

* **Flujo Lista (`ProductListComponent`):**
  1. `ngOnInit()` llama a `productService.getAll()`.
  2. El HTML itera con `@for (item of productos; track item.id)`.
  3. Cada tarjeta tiene un enlace al detalle: `<a [routerLink]="['/producto', item.id]">Ver</a>`.

* **Flujo Detalle (`ProductDetailComponent`):**
  1. La ruta está definida como `{ path: 'producto/:id', component: ProductDetailComponent }`.
  2. El componente lee el ID con `route.snapshot.paramMap.get('id')`.
  3. Llama a `productService.getById(id)` y asigna el producto a una variable.
  4. Ejecuta `this.cdr.markForCheck()` para que la pantalla no se quede congelada en "Cargando...".

---

## 3. 🛒 Carrito de Compras (Estado Global con Signals)

### ¿Por qué Signals en vez de pasar props?
Porque el botón de agregar está dentro de la tarjeta de un producto y el contador de ítems está en el `Navbar`. No son padre e hijo, por lo que un **Servicio Singleton (`providedIn: 'root'`) con Signals** es la solución más limpia y moderna.

* **Estructura en `CartService`:**
  - `private itemsSignal = signal<CartItem[]>([])`: Estado en memoria reactivo.
  - `count = computed(() => ...)`: Cuenta total de unidades. Se recalcula solo.
  - `total = computed(() => ...)`: Monto total en pesos.
  - `agregar(producto)`: Si existe suma cantidad; si no, agrega nuevo ítem.
  - `limpiar()`: Resetea el carrito tras comprar o cotizar.

* **Frontend:**
  - Cualquier componente inyecta `cartService` y lee `cartService.count()`.
  - Cuando se llama `cartService.agregar()`, el Navbar se actualiza **instantáneamente**.

---

## 4. 📄 Cotizaciones (Transacción Maestro - Detalle)

### ¿Qué hace?
Convierte los ítems del carrito en un documento de cotización guardado en BD.

* **Backend (`CotizacionRepository.cs`):**
  1. Usa **`SqlTransaction`** para garantizar integridad (o se guarda todo o nada).
  2. **Paso 1:** `INSERT INTO Cotizaciones (PersonaCotizante, Total) VALUES (...); SELECT SCOPE_IDENTITY();`
     -> Obtiene el `idCotizacion` recién generado.
  3. **Paso 2:** En un bucle `foreach`, inserta cada ítem en `CotizacionProductos` con ese `idCotizacion`.
  4. Ejecuta `transaction.CommitAsync()`.
  5. En `GetAllAsync()`, hace `LEFT JOIN` y usa un `Dictionary<int, Cotizacion>` para no duplicar cabeceras al armar la lista.

* **Frontend (`CartComponent`):**
  1. Pide el nombre de la persona (`nuevoCliente`).
  2. Arma el objeto `{ personaCotizante, total, items }` con la data de `cartService.items()`.
  3. Llama `cotizacionService.create(...)`.
  4. Al recibir respuesta exitosa, llama `cartService.limpiar()` y redirige a `/cotizaciones`.

---

## 5. 🔁 Devoluciones de Productos (Nuevo Módulo)

### ¿Qué hace?
Permite registrar la devolución de productos defectuosos o cancelados con motivo y reembolso.

* **Esquema de BD:**
  - `Devoluciones`: Cabecera (Id, Fecha, Cliente, Motivo, TotalDevuelto).
  - `DevolucionDetalles`: Ítems devueltos (Id, IdDevolucion, IdProducto, NombreProducto, Cantidad, MontoReembolso).

* **Backend (`DevolucionesController.cs` + `DevolucionRepository.cs`):**
  - **SQL Puro:** `INSERT` cabecera + `SCOPE_IDENTITY()` + bucle `INSERT` detalles dentro de `SqlTransaction`.
  - **EF Core (Comentado en el código para estudiar):**
    ```csharp
    context.Devoluciones.Add(devolucion);
    await context.SaveChangesAsync(); // EF maneja transaction y FKs automáticamente
    ```

* **Frontend (`DevolucionesComponent`):**
  - **Sin estilos pesados, pura lógica clara:**
  - Tiene un selector `<select>` que carga los productos desde `productService.getAll()`.
  - Botón **"+ Agregar Ítem"** añade a la lista en memoria `itemsADevolver`.
  - Botón **"Confirmar Devolución"** envía todo el paquete a `devolucionService.create()`.
  - Al completar, refresca la tabla inferior con el historial y permite abrir el detalle de cada devolución.

---

## 💡 Conceptos Clave que debes Recordar

1. **`markForCheck()`:** En Angular Zoneless o SSR, las respuestas asíncronas (`subscribe`) no siempre despiertan el ciclo de detección. Siempre llama a `this.cdr.markForCheck()` al recibir data.
2. **`SCOPE_IDENTITY()`:** Función de SQL Server que retorna el último ID autoincremental generado en la sesión actual. Vital para relaciones maestro-detalle.
3. **`SqlTransaction`:** Obligatoria en operaciones con múltiples inserts (`BeginTransaction()`, `Commit()`, `Rollback()`).
4. **`computed()` vs `signal()`:** `signal` guarda un valor modificable (`.set()`, `.update()`). `computed` es una fórmula matemática o lógica derivada de solo lectura.
