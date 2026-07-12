# Gestion Pro - Runbook Operativo

Guia corta para operar, desplegar y revisar Gestion Pro sin subir secretos ni romper una base real.

## Antes de subir a GitHub

1. Revisar cambios pendientes.
2. Confirmar que no se versionan `.env`, backups, uploads, logs, `node_modules`, `dist` ni `build`.
3. Ejecutar pruebas y builds.
4. Crear backup de la base real si el cambio va a produccion o beta real.
5. Subir cambios solo despues de validar.

Comandos de verificacion:

```bash
git status
cd backend && npm test
cd backend && npm run build
cd backend && npx prisma migrate status
cd frontend && npm run build
```

## Orden seguro de deploy

1. Crear backup del proveedor de PostgreSQL.
2. Confirmar variables de entorno en backend y frontend.
3. Desplegar backend.
4. Ejecutar migraciones Prisma en el backend desplegado.
5. Verificar `/api/health`.
6. Desplegar frontend.
7. Probar login, dashboard, permisos, factura, pago, compra, banco/caja y reportes.
8. Revisar logs por errores repetidos.

## Variables criticas

Backend:

- `NODE_ENV=production`
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET` largo, unico y no versionado.
- `FRONTEND_URL`
- `FRONTEND_URLS`
- `TRUST_PROXY=1` si hay proxy o plataforma tipo Render.
- `DISABLE_PUBLIC_REGISTER=true` cuando el negocio piloto ya fue creado.
- `DISABLE_LOGIN_RATE_LIMIT=false`
- `DEBUG_ERRORS=false`
- `ENABLE_LOCAL_BACKUPS=false` en Render/Vercel.
- `DISABLE_LOCAL_BACKUPS=true` si se quiere forzar backup JSON portable.

Frontend:

- `VITE_API_URL`
- `VITE_DISABLE_PUBLIC_REGISTER=true` cuando el registro publico debe ocultarse.

## Backups

El backup principal debe venir del proveedor de PostgreSQL. La app puede crear:

- SQL con `pg_dump`, solo si el servidor tiene herramientas PostgreSQL y almacenamiento persistente.
- JSON portable, util como apoyo cuando no hay `pg_dump`.

No dependas de `backend/backups` en Render Free, Vercel Functions ni servidores sin disco persistente.

## Verificacion post-deploy

- API responde en `/api/health`.
- Login funciona con email, password y codigo de compania.
- Logout limpia la sesion.
- Usuario sin permiso ve Unauthorized.
- Dashboard carga con cero datos.
- Crear cliente, producto, factura, pago y compra de prueba.
- Inventario muestra origen/documento en movimientos automaticos.
- Banco o caja muestra origen financiero de pagos/gastos.
- Reportes cargan y exportan con filtros.
- No aparecen pantallas en blanco, `undefined` ni `NaN`.

## Diagnostico rapido

- Login falla para todos: revisar `JWT_SECRET`, `DATABASE_URL`, `DISABLE_PUBLIC_REGISTER`, compania activa y usuario activo.
- Frontend no conecta: revisar `VITE_API_URL`, CORS, `FRONTEND_URLS` y URL real del backend.
- Error CORS: agregar dominio exacto sin barra final en `FRONTEND_URLS`.
- Backup no crea SQL: instalar/configurar `pg_dump` o usar JSON portable/proveedor de base de datos.
- Pantalla en blanco: revisar consola del navegador; la app debe mostrar pantalla de recuperacion.
- Datos cruzados entre empresas: detener pruebas y revisar filtros por `companyId` antes de seguir.

## Rollback

1. Bloquear acceso temporal si hay riesgo de datos.
2. Guardar logs y captura del error.
3. Restaurar version anterior del frontend/backend desde la plataforma.
4. Restaurar backup de base de datos solo si el cambio altero datos de forma incorrecta.
5. Probar restauracion en una base separada antes de tocar produccion.
