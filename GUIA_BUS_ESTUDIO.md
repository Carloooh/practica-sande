# 🚌 GUÍA DE ESTUDIO INTENSIVA: RUTA AL ÉXITO TÉCNICO

> **Objetivo:** Repasar mentalmente conceptos clave, sintaxis esencial y arquitectura durante el viaje de 1.5 horas.
> **Contexto:** Prueba técnica en vivo de 1 hora (.NET + Angular). Cero relleno, máxima efectividad.

---

## 🧭 Estrategia para la Prueba de 1 Hora

1. **Minutos 0 - 5: Análisis del Problema**
   - Entender qué se pide (¿CRUD completo? ¿Solo Listado y Detalle? ¿Crear un carrito/cotización?).
   - Revisar la base de datos entregada o diseñar las tablas mínimas viables.
2. **Minutos 5 - 25: Backend Imparable**
   - Modelo -> Data (EF o SQL) -> Controller -> Test rápido con Swagger o navegador.
   - Si la API responde 200 con JSON, ya tienes el 50% de la prueba asegurada.
3. **Minutos 25 - 50: Frontend Funcional**
   - Service con métodos HTTP -> Componentes (`@for`, `@if`, estilos rápidos con Tailwind).
   - Conectar con la API y validar que la data fluya.
4. **Minutos 50 - 60: Pulido y UX básica**
   - Mensajes de carga, estados vacíos, feedback de éxito/error y navegación limpia.

---

## 🧠 Glosario y Definiciones Clave (Preguntas Típicas de Entrevista)

### ¿Qué es un Componente en Angular?
Es el bloque de construcción fundamental de la UI. Encapsula **HTML** (plantilla), **CSS** (estilos) y **TypeScript** (lógica de estado y comportamiento). En Angular moderno son **Standalone** (`standalone: true`), lo que significa que no necesitan declararse en módulos (`NgModule`), simplificando la arquitectura.

### ¿Qué son las "Props" en Angular?
Viniendo del ecosistema React/Next.js, las *props* en Angular corresponden a los **`@Input()`** (o la función moderna `input()`):
- Permiten que un componente padre le envíe datos a un componente hijo.
- En Angular, son unidireccionales (de padre a hijo).

### ¿Qué son los Eventos / Callbacks (`@Output`)?
Es el mecanismo para que un componente hijo notifique al padre sobre una acción:
- Se declara como `@Output() evento = new EventEmitter<T>();` (o `output<T>()`).
- El hijo ejecuta `this.evento.emit(payload)` y el padre lo escucha con `(evento)="manejarEvento($event)"`.

### ¿Qué son los Signals (`signal`, `computed`, `effect`)?
Es el nuevo modelo reactivo de Angular (v16+) para manejar el estado con reactividad fina y sin depender de Zone.js:
- **`signal(valorInicial)`**: Contenedor de un valor que notifica cuando cambia. Se lee ejecutando la función: `miSignal()`. Se actualiza con `.set(nuevoValor)` o `.update(v => v + 1)`.
- **`computed(() => ...)`**: Valor derivado reactivo de solo lectura. Solo se recalcula si alguna señal de la que depende cambia (memorización automática).
- **`effect(() => ...)`**: Operación secundaria que se ejecuta reactivamente ante cambios de señales.

### ¿Qué es el Estado Global y cómo se implementa?
Es la información compartida entre múltiples componentes que no tienen relación directa padre-hijo (ej. carrito de compras, sesión de usuario):
- En Angular se implementa de forma sencilla y elegante mediante un **Servicio `@Injectable({ providedIn: 'root' })`** con **Signals** o `BehaviorSubject`. Al ser *singleton*, todos los componentes inyectan la misma instancia.

### ¿Qué es la Inyección de Dependencias (DI)?
Patrón de diseño donde las clases reciben sus dependencias desde el exterior en lugar de crearlas ellas mismas con `new`.
- Facilita el desacoplamiento, la reutilización y el testing.
- En Angular se usa el constructor o la función moderna `inject(MiServicio)`.
- En .NET se registra en `Program.cs` (`AddScoped`, `AddSingleton`, `AddTransient`) y se inyecta por el constructor del Controller.

---

## ⚛️ Mapeo Mental: React / Next.js ➔ Angular

| Concepto | React / Next.js | Angular Moderno (17/18/19) |
| :--- | :--- | :--- |
| **Estado local** | `const [count, setCount] = useState(0)` | `count = signal(0)` (`count.set(1)`) |
| **Valor calculado** | `const total = useMemo(() => a * b, [a, b])` | `total = computed(() => this.a() * this.b())` |
| **Efectos secundarios** | `useEffect(() => { ... }, [dep])` | `effect(() => { ... })` o `ngOnInit()` |
| **Paso de propiedades** | `<Card title="Hola" />` | `<app-card [title]="'Hola'"></app-card>` |
| **Eventos hijo -> padre**| `<Button onClick={handleClick} />` | `<app-button (click)="handleClick()"></app-button>` |
| **Condicionales** | `{isLogged ? <User /> : <Login />}` | `@if (isLogged) { <app-user /> } @else { <app-login /> }` |
| **Render de listas** | `{items.map(item => <li key={item.id}>{item.name}</li>)}` | `@for (item of items; track item.id) { <li>{{ item.name }}</li> }` |
| **Navegación** | `<Link href="/detalle">Detalle</Link>` / `router.push('/detalle')` | `<a routerLink="/detalle">Detalle</a>` / `this.router.navigate(['/detalle'])` |
| **Parámetros de ruta** | `useParams()` o `searchParams` | `@Input() id!: string;` (con `withComponentInputBinding`) o `inject(ActivatedRoute).snapshot.paramMap.get('id')` |

---

## 🖥️ Backend: Entity Framework vs SQL Puro (ADO.NET)

### Opción A: Entity Framework Core (Más rápido de escribir)
```csharp
// 1. Modelo
public class Product {
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
}

// 2. DbContext
public class AppDbContext : DbContext {
    public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts) {}
    public DbSet<Product> Products => Set<Product>();
}

// 3. Consulta en Controller / Servicio
var productos = await _context.Products
    .Where(p => p.Precio > 1000)
    .OrderBy(p => p.Nombre)
    .ToListAsync();

// 4. Inserción
_context.Products.Add(nuevoProducto);
await _context.SaveChangesAsync();
```

### Opción B: SQL Puro con ADO.NET (Mayor control / Si la empresa usa Stored Procedures o Raw SQL)
```csharp
public async Task<List<Product>> GetAllAsync() {
    var lista = new List<Product>();
    using var conn = new SqlConnection(_connectionString);
    await conn.OpenAsync();

    var sql = "SELECT Id, Nombre, Precio FROM Productos WHERE Estado = 1";
    using var cmd = new SqlCommand(sql, conn);
    using var reader = await cmd.ExecuteReaderAsync();

    while (await reader.ReadAsync()) {
        lista.Add(new Product {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
            Precio = reader.GetDecimal(reader.GetOrdinal("Precio"))
        });
    }
    return lista;
}
```

### Inserción con Transacción y obtención del ID generado (Caso Cotización + Detalle)
```csharp
using var conn = new SqlConnection(_connectionString);
await conn.OpenAsync();
using var tx = conn.BeginTransaction();

try {
    // 1. Insertar Cabecera
    var sqlCabecera = @"INSERT INTO Cotizaciones (Fecha, ClienteNombre, Total) 
                        VALUES (@Fecha, @Cliente, @Total);
                        SELECT SCOPE_IDENTITY();";
    
    using var cmdCabecera = new SqlCommand(sqlCabecera, conn, tx);
    cmdCabecera.Parameters.AddWithValue("@Fecha", DateTime.UtcNow);
    cmdCabecera.Parameters.AddWithValue("@Cliente", cotizacion.ClienteNombre);
    cmdCabecera.Parameters.AddWithValue("@Total", cotizacion.Total);
    
    int cotizacionId = Convert.ToInt32(await cmdCabecera.ExecuteScalarAsync());

    // 2. Insertar Detalles
    foreach (var item in cotizacion.Detalles) {
        var sqlItem = @"INSERT INTO CotizacionDetalles (CotizacionId, ProductoId, Cantidad, PrecioUnitario)
                        VALUES (@CotId, @ProdId, @Cant, @Precio)";
        using var cmdItem = new SqlCommand(sqlItem, conn, tx);
        cmdItem.Parameters.AddWithValue("@CotId", cotizacionId);
        cmdItem.Parameters.AddWithValue("@ProdId", item.ProductoId);
        cmdItem.Parameters.AddWithValue("@Cant", item.Cantidad);
        cmdItem.Parameters.AddWithValue("@Precio", item.PrecioUnitario);
        await cmdItem.ExecuteNonQueryAsync();
    }

    tx.Commit();
    return cotizacionId;
} catch {
    tx.Rollback();
    throw;
}
```

> **Consejo Clave:** ¡Nunca concatenes strings en consultas SQL! Usa siempre `cmd.Parameters.AddWithValue` para prevenir SQL Injection.

---

## 🅰️ Frontend: Patrones Esenciales en Angular

### 1. Comunicación Padre - Hijo (`@Input` y `@Output`)

**Hijo (`product-card.component.ts`):**
```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-product-card',
  standalone: true,
  template: `
    <div class="border rounded p-4 shadow">
      <h3 class="font-bold">{{ product.nombre }}</h3>
      <p class="text-green-600">\${{ product.precio }}</p>
      <button (click)="onAgregar()" class="bg-blue-600 text-white px-3 py-1 rounded mt-2">
        Agregar
      </button>
    </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() agregar = new EventEmitter<Product>();

  onAgregar() {
    this.agregar.emit(this.product);
  }
}
```

**Padre (`product-list.component.ts`):**
```typescript
@Component({
  standalone: true,
  imports: [ProductCardComponent],
  template: `
    <div class="grid grid-cols-3 gap-4">
      @for (prod of productos; track prod.id) {
        <app-product-card 
          [product]="prod" 
          (agregar)="manejarAgregar($event)">
        </app-product-card>
      }
    </div>
  `
})
export class ProductListComponent {
  productos: Product[] = [];

  manejarAgregar(producto: Product) {
    console.log('Agregado desde el hijo:', producto);
  }
}
```

---

### 2. Navegación y Lectura de Parámetros

**Definición de rutas (`app.routes.ts`):**
```typescript
export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'producto/:id', component: ProductDetailComponent },
  { path: 'cotizaciones', component: CotizacionListComponent },
  { path: '**', redirectTo: '' }
];
```

**Navegar por Template:**
```html
<a [routerLink]="['/producto', item.id]" class="hover:underline">Ver Detalle</a>
```

**Navegar por Código TypeScript:**
```typescript
private router = inject(Router);

irADetalle(id: number) {
  this.router.navigate(['/producto', id]);
}
```

**Leer el parámetro `:id` en el Componente Destino:**
- **Forma moderna:**
```typescript
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  producto?: Product;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getById(id).subscribe(data => {
      this.producto = data;
    });
  }
}
```

---

### 3. Estado Global con Signals (Ej. Carrito de Compras)

```typescript
// cart.service.ts
import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  // 1. Signal privado (Estado interno)
  private itemsSignal = signal<CartItem[]>([]);

  // 2. Lectura pública
  items = this.itemsSignal.asReadonly();

  // 3. Computed (cálculo reactivo automático)
  totalItems = computed(() => 
    this.itemsSignal().reduce((sum, item) => sum + item.cantidad, 0)
  );

  totalPrecio = computed(() => 
    this.itemsSignal().reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
  );

  // 4. Métodos para mutar el estado
  agregar(producto: { id: number; nombre: string; precio: number }) {
    this.itemsSignal.update(actuales => {
      const index = actuales.findIndex(i => i.id === producto.id);
      if (index > -1) {
        const clon = [...actuales];
        clon[index] = { ...clon[index], cantidad: clon[index].cantidad + 1 };
        return clon;
      }
      return [...actuales, { ...producto, cantidad: 1 }];
    });
  }

  limpiar() {
    this.itemsSignal.set([]);
  }
}
```

**En el Navbar (`navbar.component.html`):**
```html
<nav class="flex justify-between p-4 bg-slate-900 text-white">
  <a routerLink="/" class="font-bold text-xl">Sande Store</a>
  <div class="flex gap-4">
    <a routerLink="/cotizaciones">Mis Cotizaciones</a>
    <span class="bg-blue-600 px-3 py-1 rounded-full text-sm">
      🛒 {{ cartService.totalItems() }} items (\${{ cartService.totalPrecio() }})
    </span>
  </div>
</nav>
```

---

### 4. Evitar que la pantalla se quede en "Cargando..." (Zoneless Change Detection)

Si en Angular 19+ usas `provideZonelessChangeDetection()` o las peticiones asíncronas no refrescan la vista:
```typescript
import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';

export class ProductListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private service = inject(ProductService);

  productos: Product[] = [];
  loading = true;

  ngOnInit() {
    this.service.getAll().subscribe({
      next: (data) => {
        this.productos = data;
        this.loading = false;
        // Obliga a Angular a actualizar el DOM inmediatamente
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
```

---

## 🎯 Resumen Mental de Supervivencia para la Prueba

1. **Mantén la calma y lee el enunciado completo.**
2. **Prioriza lo que suma puntos:** API con endpoints correctos + Frontend que muestre los datos.
3. **No te compliques con CSS:** Tailwind te permite dar bordes, padding (`p-4`), grid (`grid grid-cols-3 gap-4`) y flex (`flex justify-between items-center`) en 30 segundos.
4. **Respeta los tipos:** Si en C# se llama `Precio`, en el JSON llegará `precio` (camelCase). Asegúrate de que tu interfaz TypeScript tenga `precio: number;`.
5. **Si algo falla:** Abre la pestaña **Network** (Red) y la **Consola** de las DevTools de Chrome. Te dirán exactamente si es CORS, 404, 500 o error de template.

¡Mucho éxito! Tienes todo el conocimiento fresco y estructurado para destacar. 🚀
