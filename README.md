# Gestion Pro

Gestion Pro es un ERP administrativo multiempresa para operar ventas, compras, inventario, finanzas, reportes, usuarios, auditoria, configuracion y fidelizacion desde una aplicacion web.

Estado actual: beta real controlada. El sistema esta preparado para pruebas con datos reales de bajo riesgo despues de configurar entorno, permisos, backups y variables de produccion.

## Stack

- Frontend: React, Vite, TailwindCSS, React Router, Axios, Recharts, Lucide, Framer Motion.
- Backend: Node.js, Express, Prisma, PostgreSQL, JWT, Helmet, CORS y rate limit de login.
- Documentos: PDF de factura/compra y exportaciones de reportes cuando aplica.
- Persistencia: PostgreSQL, `backend/uploads` para logos/archivos y `backend/backups` para respaldos locales o portables.

## Modulos incluidos

- Login, logout, sesion protegida y multiempresa por codigo de compania.
- Registro/onboarding de negocios desde la pantalla de login, con codigo de compania generado automaticamente.
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
- Listados principales con soporte backend para paginacion, busqueda y filtros.
- Trazabilidad financiera basica entre pagos, gastos, banco y caja chica.
- Trazabilidad de inventario por documento de factura, compra, reverso o ajuste manual.
- Barrera visual de errores para evitar pantallas completamente en blanco.

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
JSON_BODY_LIMIT="1mb"
DISABLE_PUBLIC_REGISTER=false
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=10
DISABLE_LOGIN_RATE_LIMIT=false
TRUST_PROXY=1
FRONTEND_URL="http://localhost:5173"
FRONTEND_URLS="http://localhost:5173,http://127.0.0.1:5173"
PG_DUMP_PATH="C:/Program Files/PostgreSQL/18/bin/pg_dump.exe"
BACKUP_DIR="./backups"
BACKUP_RETENTION_DAYS=30
ENABLE_LOCAL_BACKUPS=false
DISABLE_BACKUPS=false
DISABLE_LOCAL_BACKUPS=false
```

Frontend (`frontend/.env`):

```env
VITE_API_URL="http://localhost:4000/api"
VITE_DISABLE_PUBLIC_REGISTER=false
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

El seed es solo para desarrollo local o pruebas tecnicas. No es la forma principal de crear negocios reales.

Para uso real o piloto:

1. Abre la pantalla de login.
2. Usa `Crear negocio`.
3. Completa los datos del administrador y del negocio.
4. Guarda el codigo de compania generado.
5. Inicia sesion con email, contrasena y codigo generado.

Ejemplo:

- Negocio: `Mi Tienda RD`
- Codigo generado: `MI-TIENDA-4821`

Para desarrollo, el seed puede crear empresas limpias y un admin inicial. Ajusta estos valores solo en tu `.env` local o de entorno:

```env
SEED_ADMIN_EMAIL="admin@gestionpro.local"
SEED_ADMIN_PASSWORD="GestionPro123"
SEED_ADMIN_NAME="Administrador"
SEED_COMPANY_1_NAME="Negocio Principal"
SEED_COMPANY_1_CODE="NEGOCIO1"
SEED_COMPANY_2_NAME="Segundo Negocio"
SEED_COMPANY_2_CODE="NEGOCIO2"
```

Antes de beta real, crea un negocio real desde `Crear negocio`, cambia la contrasena inicial si aplica y desactiva usuarios demo.

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
2. Crea un negocio desde `Crear negocio` si estas probando el flujo real.
3. Guarda el codigo generado e inicia sesion con email, contrasena y codigo de compania.
4. Crea o revisa usuarios para ventas, almacen y contabilidad.
5. Ejecuta `MANUAL_TESTING_CHECKLIST.md`.
6. Revisa permisos con URL directa para rutas no permitidas.
7. Revisa que no aparezcan pantallas en blanco, `undefined`, `NaN` ni errores genericos.
8. Prueba listados grandes usando busqueda, filtros y paginacion donde el frontend ya lo exponga.
9. Confirma que pagos y gastos creen movimientos relacionados en banco o caja con su origen.

Pruebas automatizadas backend:

```bash
cd backend
npm test
```

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

En produccion, usa los backups del proveedor de la base de datos como respaldo principal. Esto aplica especialmente si el backend corre en Render, Vercel Functions u otro entorno sin almacenamiento persistente.

La pantalla `Sistema > Backups` funciona en dos modos:

- SQL local con `pg_dump`, cuando el servidor tiene PostgreSQL tools y almacenamiento persistente.
- JSON portable, cuando no hay `pg_dump` o los backups locales SQL estan deshabilitados.

El JSON portable ayuda para revision o rescate controlado, pero no reemplaza un backup formal del proveedor de base de datos.

Solo habilita backups SQL locales si el backend corre en un servidor con:

- `pg_dump` instalado.
- `PG_DUMP_PATH` configurado o `pg_dump` disponible en `PATH`.
- almacenamiento persistente para `BACKUP_DIR`.
- `ENABLE_LOCAL_BACKUPS=true`.

Variables relacionadas:

- `ENABLE_LOCAL_BACKUPS=true`: permite backup SQL con `pg_dump` en produccion si el servidor esta preparado.
- `DISABLE_LOCAL_BACKUPS=true`: fuerza backup portable JSON.
- `DISABLE_BACKUPS=true`: desactiva la creacion de backups desde la app.

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
- En produccion, configura `DISABLE_PUBLIC_REGISTER=true` si no quieres permitir registro publico.
- En frontend, configura `VITE_DISABLE_PUBLIC_REGISTER=true` junto con `DISABLE_PUBLIC_REGISTER=true` para ocultar la opcion de registro.
- El codigo de compania se genera en backend; el frontend no debe enviar ni editar codigos al registrar negocios.
- Configuracion > Empresa muestra el codigo como solo lectura para copiarlo.
- Mantiene `JSON_BODY_LIMIT` en un valor bajo salvo que necesites cargas grandes.
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

Orden recomendado para publicar cambios:

1. Revisar `git status`.
2. Confirmar que no hay secretos, `.env`, backups, uploads ni logs versionados.
3. Ejecutar pruebas y builds.
4. Hacer backup de la base real.
5. Subir cambios a GitHub.
6. Ejecutar migraciones en el backend desplegado.
7. Verificar `/api/health`, login, permisos, dashboard y un flujo de factura/pago.

Guia operativa: `OPERATIONS_RUNBOOK.md`.

## Checklist

- Pruebas manuales: `MANUAL_TESTING_CHECKLIST.md`
- Produccion/beta real: `PRODUCTION_CHECKLIST.md`
