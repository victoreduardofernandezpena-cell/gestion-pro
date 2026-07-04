# Gestion Pro

Aplicacion web tipo ERP para gestion administrativa de negocios, tiendas y operaciones multiempresa. Incluye ventas, compras, inventario, finanzas, impuestos, recursos humanos, reportes, seguridad, configuracion, backups y paneles ejecutivos.

## Stack

- Frontend: React, Vite, TailwindCSS, Axios, React Router, Recharts, Lucide.
- Backend: Node.js, Express, Prisma, PostgreSQL, JWT.
- Reportes/documentos: CSV compatible con Excel, PDF e impresion.
- Seguridad: rutas protegidas, roles, auditoria, Helmet y rate limit en login.

## Estado del proyecto

El ERP tiene completas las fases 1 a 10 e incluye modulos adicionales implementados para uso operativo real:

- Login, dashboard avanzado, layout, rutas protegidas y navegacion por rol.
- Multiempresa con codigo de compania y separacion de datos por `companyId`.
- Clientes, productos, inventario y movimientos.
- Facturacion, pagos y cuentas por cobrar.
- Proveedores, compras, pagos y cuentas por pagar.
- Banco, caja chica y gastos.
- Contabilidad basica, catalogo de cuentas, asientos y reportes contables.
- Reportes con filtros, exportacion CSV/PDF e impresion.
- Fidelizacion de clientes, cuentas de fidelidad, movimientos y configuracion.
- Finanzas: resumen ejecutivo, flujo de caja, rentabilidad, deudas, alertas y proyecciones.
- Impuestos: resumen fiscal, ITBIS cobrado/pagado, ventas, compras, gastos, mensual y alertas.
- Recursos Humanos: empleados, departamentos, puestos, asistencia, nomina simple, pagos y reportes.
- Seguridad: usuarios, permisos por rol, perfil y auditoria.
- Configuracion: empresa, impuestos, numeracion, categorias y documentos.
- Carga de logo empresarial para documentos cuando la configuracion lo permite.
- Sistema: estado de aplicacion y backups.
- Tema claro/oscuro.
- Animaciones suaves y pulido visual/UX.

## Requisitos previos

- Node.js 18 o superior.
- PostgreSQL local o remoto.
- `pg_dump` disponible en PATH para crear backups desde la app o desde `npm run backup`.
- `psql` disponible para restauracion manual de backups.

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

La API corre por defecto en `http://localhost:4000`.

## Instalacion frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

El frontend corre por defecto en `http://localhost:5173`.

## Variables de entorno

Backend:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
JWT_SECRET="CHANGE_THIS_SECRET"
JWT_EXPIRES_IN="8h"
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=10
DISABLE_LOGIN_RATE_LIMIT=false
FRONTEND_URL="http://localhost:5173"
```

Frontend:

```env
VITE_API_URL="http://localhost:4000/api"
```

No uses credenciales reales en archivos versionados.

## Comandos utiles

Backend:

```bash
npm run dev
npm start
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
npm run backup
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

## Prisma

Migraciones:

```bash
cd backend
npm run prisma:migrate
```

Seed:

```bash
cd backend
npm run prisma:seed
```

Si se agregan modelos nuevos o se actualiza Prisma Client:

```bash
cd backend
npx prisma generate
```

## Seed inicial

El seed actual no carga clientes, productos, facturas ni usuarios demo. Crea empresas limpias y asigna un usuario admin inicial.

Variables utiles para un piloto con dos negocios:

```env
SEED_ADMIN_EMAIL="admin@gestionpro.local"
SEED_ADMIN_PASSWORD="GestionPro123"
SEED_ADMIN_NAME="Administrador"
SEED_COMPANY_1_NAME="Negocio Principal"
SEED_COMPANY_1_CODE="NEGOCIO1"
SEED_COMPANY_2_NAME="Segundo Negocio"
SEED_COMPANY_2_CODE="NEGOCIO2"
```

El primer login obliga a cambiar la contrasena.

## Backups y archivos persistentes

Desde la interfaz:

- Entra como admin.
- Abre `Sistema > Backups`.
- Usa `Crear backup`, `Descargar` o `Eliminar`.

Desde CLI:

```bash
cd backend
npm run backup
```

Los archivos se guardan en `backend/backups` o en la ruta definida por `BACKUP_DIR`, con formato `backup_YYYY-MM-DD_HH-mm-ss.sql`. Esa carpeta debe estar ignorada por Git.

En produccion deben respaldarse de forma externa y periodica:

- Base de datos PostgreSQL.
- `backend/backups` o el directorio definido por `BACKUP_DIR`.
- `backend/uploads`, incluyendo logos empresariales y cualquier archivo privado cargado por usuarios.

## Restauracion manual

La restauracion automatica esta deshabilitada por seguridad. Para restaurar manualmente:

```bash
psql "postgresql://USER:PASSWORD@localhost:5432/DATABASE" < backend/backups/backup_YYYY-MM-DD_HH-mm-ss.sql
```

Haz un backup de la base actual antes de restaurar. Ejecuta la restauracion en un entorno controlado antes de usarla en produccion.

## Estructura

```text
backend/
  prisma/
  src/controllers/
  src/middleware/
  src/routes/
  src/utils/
  backups/
  uploads/
frontend/
  src/components/
  src/context/
  src/layouts/
  src/pages/
  src/routes/
  src/services/
```

## Notas de seguridad

- Configura `JWT_SECRET` en `.env`.
- Mantén `DISABLE_LOGIN_RATE_LIMIT=false` en produccion. Usalo en `true` solo durante pruebas controladas.
- No subas `.env`, backups, uploads privados, logs ni `node_modules`.
- Configura `FRONTEND_URL` para CORS segun el dominio real.
- Usa HTTPS en produccion.
- Usa un admin real y cambia la contrasena inicial del seed en el primer acceso.
- Revisa roles y permisos antes de entregar el sistema.
- Verifica separacion por empresa si se usa multiempresa.
- Respalda base de datos, `BACKUP_DIR` y `backend/uploads`.

## Checklist antes de produccion

Ver `PRODUCTION_CHECKLIST.md`.
