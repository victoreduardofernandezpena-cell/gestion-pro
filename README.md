# Gestion Pro

Gestion Pro es un ERP administrativo multiempresa para operar ventas, compras, inventario, finanzas, reportes, usuarios, auditoria, configuracion y fidelizacion desde una aplicacion web.

Estado actual: beta real controlada. El sistema esta preparado para pruebas con datos reales de bajo riesgo despues de configurar entorno, permisos, backups y variables de produccion.

## Stack

- Frontend: React, Vite, TailwindCSS, React Router, Axios, Recharts, Lucide, Framer Motion.
- Backend: Node.js, Express, Prisma, PostgreSQL, JWT, Helmet, CORS y rate limit de login.
- Documentos: PDF de factura/compra y exportaciones de reportes cuando aplica.
- Persistencia: PostgreSQL, `backend/uploads` para logos/archivos y `backend/backups` para respaldos locales.

## Modulos incluidos

- Login, logout, sesion protegida y multiempresa por codigo de compania.
- Dashboard con indicadores segun rol.
- Clientes.
- Productos.
- Inventario, almacenes, marcas y movimientos.
- Facturacion, pagos simples/multiples y cuentas por cobrar.
- Compras, pagos y cuentas por pagar.
- Banco, caja chica y gastos.
- Reportes operativos y contables.
- Usuarios, roles, auditoria y cambio obligatorio de contrasena.
- Configuracion de empresa, impuestos, numeracion, categorias y documentos.
- Fidelizacion de clientes.
- Modo claro/oscuro y responsive.
- Sistema, estado y backups para admin.

## Roles beta

- Admin: todo.
- Ventas: clientes, productos en consulta, facturas, pagos y fidelizacion.
- Almacen: productos, inventario, almacenes y marcas.
- Contabilidad: facturas, pagos, compras, banco, caja, gastos y reportes.

Los usuarios sin permiso deben ver Unauthorized en frontend y recibir 403 desde la API.

## Requisitos

- Node.js 18 o superior.
- PostgreSQL local o remoto.
- `pg_dump` para crear backups desde la app o con script.
- `psql` para restauracion manual de backups.

## Instalacion backend

```bash
cd backend
npm install
copy .env.example .env
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npm run dev
```

La API corre por defecto en `http://localhost:4000` y expone salud en `http://localhost:4000/api/health`.

## Instalacion frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

El frontend corre por defecto en `http://localhost:5173`.

## Variables de entorno

Backend (`backend/.env`):

```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
JWT_SECRET="CHANGE_THIS_SECRET"
JWT_EXPIRES_IN="8h"
DEBUG_ERRORS=false
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=10
DISABLE_LOGIN_RATE_LIMIT=false
FRONTEND_URL="http://localhost:5173"
FRONTEND_URLS="http://localhost:5173,http://127.0.0.1:5173"
PG_DUMP_PATH="C:/Program Files/PostgreSQL/18/bin/pg_dump.exe"
BACKUP_DIR="./backups"
BACKUP_RETENTION_DAYS=30
```

Frontend (`frontend/.env`):

```env
VITE_API_URL="http://localhost:4000/api"
```

No guardes credenciales reales en archivos versionados.

## Prisma

Migraciones de desarrollo:

```bash
cd backend
npx prisma migrate dev
```

Migraciones para entorno ya desplegado:

```bash
cd backend
npx prisma migrate deploy
```

Estado de migraciones:

```bash
cd backend
npx prisma migrate status
```

Generar Prisma Client:

```bash
cd backend
npx prisma generate
```

Seed:

```bash
cd backend
npx prisma db seed
```

## Seed

El seed crea empresas limpias y un admin inicial. Ajusta estos valores solo en tu `.env` local o de entorno:

```env
SEED_ADMIN_EMAIL="admin@gestionpro.local"
SEED_ADMIN_PASSWORD="GestionPro123"
SEED_ADMIN_NAME="Administrador"
SEED_COMPANY_1_NAME="Negocio Principal"
SEED_COMPANY_1_CODE="NEGOCIO1"
SEED_COMPANY_2_NAME="Segundo Negocio"
SEED_COMPANY_2_CODE="NEGOCIO2"
```

Antes de beta real, crea un admin real, cambia la contrasena inicial y desactiva usuarios demo.

## Correr local

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Como probar

1. Levanta backend y frontend.
2. Entra con un usuario admin y codigo de compania.
3. Crea o revisa usuarios para ventas, almacen y contabilidad.
4. Ejecuta `MANUAL_TESTING_CHECKLIST.md`.
5. Revisa permisos con URL directa para rutas no permitidas.
6. Revisa que no aparezcan pantallas en blanco, `undefined`, `NaN` ni errores genericos.

## Build

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
npm run build
```

El build backend genera Prisma Client. La API se inicia con:

```bash
cd backend
npm start
```

## Backups

Crear backup desde CLI:

```bash
cd backend
npm run backup
```

Restauracion manual:

```bash
psql "postgresql://USER:PASSWORD@localhost:5432/DATABASE" < backend/backups/backup_YYYY-MM-DD_HH-mm-ss.sql
```

Haz siempre un backup antes de restaurar y prueba la restauracion en un entorno separado.

## Seguridad

- Cambia `JWT_SECRET` antes de cualquier prueba real.
- Configura CORS con `FRONTEND_URL` y `FRONTEND_URLS`.
- Usa HTTPS en produccion.
- Mantiene `DISABLE_LOGIN_RATE_LIMIT=false`.
- Mantiene `DEBUG_ERRORS=false`.
- No subas `.env`, backups, uploads privados, logs, `node_modules`, `dist` ni `build`.
- Revisa permisos por rol antes de abrir beta.
- Verifica separacion por empresa si el entorno usa multiempresa.
- Respaldar base de datos, uploads y backups.

## GitHub y deploy

Antes de subir:

```bash
git status
```

Confirma que no aparezcan `.env`, backups ni uploads. Para deploy, configura variables de entorno en la plataforma y ejecuta migraciones antes de abrir el acceso a usuarios reales.

## Checklist

- Pruebas manuales: `MANUAL_TESTING_CHECKLIST.md`
- Produccion/beta real: `PRODUCTION_CHECKLIST.md`
