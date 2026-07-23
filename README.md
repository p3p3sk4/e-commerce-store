# Tienda en línea — ropa, bolsas y accesorios

Monorepo: `backend/` (API Node + Express + PostgreSQL) y `frontend/` (React + Vite + Redux Toolkit).

## Estructura

```
tienda-ecommerce/
├── backend/          API REST
├── frontend/          Interfaz web (PWA en un paso posterior)
├── database/
│   └── schema.sql     Esquema completo (tablas, triggers, índices)
└── docker-compose.yml Postgres local para desarrollo
```

## Puesta en marcha local

1. **Base de datos** (requiere Docker):
   ```bash
   docker compose up -d
   ```
   La primera vez que se crea el volumen, Postgres ejecuta automáticamente `database/schema.sql`.
   Si cambias el esquema después, no se vuelve a ejecutar solo — hay que aplicarlo a mano
   (`docker compose exec db psql -U postgres -d tienda -f /docker-entrypoint-initdb.d/schema.sql`)
   o borrar el volumen con `docker compose down -v` para que se recree desde cero.

2. **Backend**:
   ```bash
   cd backend
   cp .env.example .env      # ajusta valores si es necesario
   npm install
   npm run dev
   ```
   Verifica en http://localhost:4000/health que devuelva `{"status":"ok","db":"connected"}`.

3. **Frontend**:
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
   Abre http://localhost:5173

## Estrategia de ramas (igual que en la tarea de Git)

- `main` y `develop` son ramas **permanentes**.
- Cada paso/funcionalidad nueva se trabaja en una rama temporal: `feature/nombre-del-paso`
  (ej. `feature/auth-registro-login`, `feature/catalogo-productos`).
- Al terminar, Pull Request de la rama temporal hacia `develop`.
- La rama temporal se borra después de mergear.
- `main` solo recibe merges de `develop` cuando hay una versión estable lista para producción.

## Próximos pasos

3. Backend: registro/login (JWT)
4. Backend: productos e inventario
5. Backend: canasta y órdenes (reserva, transferencia/efectivo, expiración de 10 min)
6. Backend: panel de administrador y exportación a Excel
7. Frontend: catálogo, búsqueda y filtros
8. Frontend: carrito y checkout
9. Frontend: login/registro
10. Frontend: panel de administrador
11. PWA
12. Despliegue (Vercel + Render/Railway)
