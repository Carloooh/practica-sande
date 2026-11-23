# Practica SANDE - Monorepo (Backend .NET + Frontend Angular)

Repositorio de preparación para la prueba técnica práctica en **SANDE S.A.** (Especialista en TI).

## 📁 Estructura del Monorepo

```
practica-sande/
├── backend/
│   └── Sande.Api/              --> API en C# (.NET / Web API)
│       ├── Controllers/        --> AuthController, UsersController, ProductsController
│       ├── Data/               --> AppDbContext (EF Core) y ProductRepository (SQL Directo)
│       ├── Models/             --> User, Product y DTOs
│       ├── Program.cs          --> CORS, JWT Bearer, Swagger
│       ├── README.md           --> Guía técnica del backend
│       ├── ARQUITECTURA.md     --> Explicación de arquitectura y respuesta para evaluadores
│       ├── FRONTEND.md         --> Guía técnica de Angular
│       └── GUIA_PRACTICA.md    --> Plan de estudio y simulacro de examen
│
└── frontend/
    └── sande-ui/               --> Frontend en Angular + Tailwind CSS
        ├── src/app/
        │   ├── components/     --> Navbar, ProductCard (Hijo con @Input/@Output)
        │   ├── pages/          --> ProductList (Padre), ProductDetail (/producto/:id)
        │   ├── services/       --> ProductService (HttpClient)
        │   └── models/         --> Interfaces TypeScript
        ├── FRONTEND.md         --> Guía de equivalencias Next.js ➔ Angular
        └── GUIA_PRACTICA.md    --> Plan de estudio y simulacro de examen
```

---

## 🚀 Inicio Rápido

### 1. Backend (.NET Web API)
```bash
cd backend/Sande.Api
dotnet run
```
Swagger UI disponible en: `http://localhost:5000/swagger` (o el puerto asignado en la consola).

### 2. Frontend (Angular)
```bash
cd frontend/sande-ui
npm install
ng serve
```
Aplicación disponible en: `http://localhost:4200`.

---

## 📚 Documentación de Estudio
- **[ARQUITECTURA.md](backend/Sande.Api/ARQUITECTURA.md)**: Flujo de la API, puntos críticos y defensa técnica ante el evaluador.
- **[FRONTEND.md](backend/Sande.Api/FRONTEND.md)**: Componentes en un solo archivo, Tailwind, comunicación `@Input`/`@Output` y rutas dinámicas.
- **[GUIA_PRACTICA.md](backend/Sande.Api/GUIA_PRACTICA.md)**: Checklist, simulacro de 50 minutos y respuestas de entrevista.
