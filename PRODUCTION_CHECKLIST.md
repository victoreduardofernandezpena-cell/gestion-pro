# Production Checklist - Gestion Pro

Checklist para preparar un beta real o despliegue controlado. No uses datos reales sin backup y sin haber probado restauracion.

## Entorno y variables

- [ ] Configurar `NODE_ENV=production`.
- [ ] Cambiar `JWT_SECRET` por un secreto largo, unico y no versionado.
- [ ] Revisar `DATABASE_URL` apuntando a la base real correcta.
- [ ] Configurar `DIRECT_URL` si el proveedor de base de datos lo requiere.
- [ ] Configurar `VITE_API_URL` con la URL publica de la API.
- [ ] Configurar `VITE_DISABLE_PUBLIC_REGISTER=true` si el registro publico debe quedar oculto.
- [ ] Configurar `FRONTEND_URL` con el dominio real del frontend.
- [ ] Configurar `FRONTEND_URLS` si hay mas de un origen permitido.
- [ ] Configurar `TRUST_PROXY=1` si el backend corre detras de Render, Nginx, Railway, proxy o balanceador.
- [ ] Mantener `DISABLE_LOGIN_RATE_LIMIT=false`.
- [ ] Configurar `DISABLE_PUBLIC_REGISTER=true` salvo que el registro publico sea parte del piloto.
- [ ] Configurar `JSON_BODY_LIMIT` con un limite conservador.
- [ ] Mantener `DEBUG_ERRORS=false`.
- [ ] Confirmar que `.env` no se sube a GitHub.
- [ ] Confirmar que `.gitignore` cubre `.env`, `.env.*`, backups, uploads, logs, `node_modules`, `dist` y `build`.

## Base de datos y Prisma

- [ ] Configurar base de datos real.
- [ ] Crear backup antes de probar con datos reales.
- [ ] Ejecutar migraciones pendientes.
- [ ] Ejecutar `npx prisma generate`.
- [ ] Revisar `npx prisma migrate status`.
- [ ] Confirmar que no hay migraciones pendientes antes de entregar.
- [ ] Ejecutar seed solo si aplica al entorno.
- [ ] Desactivar o eliminar usuarios demo.
- [ ] Crear usuario admin real.
- [ ] Completar cambio de contrasena del admin real.
- [ ] Probar restauracion de backup en un entorno aparte.

## Seguridad y permisos

- [ ] Probar login, logout, sesion expirada y token invalido.
- [ ] Confirmar que el registro publico esta bloqueado si `DISABLE_PUBLIC_REGISTER=true`.
- [ ] Confirmar que el frontend oculta registro publico si `VITE_DISABLE_PUBLIC_REGISTER=true`.
- [ ] Confirmar que usuarios con cambio obligatorio de contrasena no puedan usar otras rutas API antes de actualizarla.
- [ ] Probar 401 sin token.
- [ ] Probar 403 con usuario sin permiso.
- [ ] Probar 404 en ruta inexistente.
- [ ] Probar mensaje controlado en error 500.
- [ ] Confirmar que no se exponen passwords, tokens ni secretos en respuestas.
- [ ] Confirmar que usuarios no admin no ven Seguridad, Auditoria, Configuracion ni Sistema.
- [ ] Confirmar permisos por rol:
- [ ] Admin ve todo.
- [ ] Ventas ve clientes, productos de consulta, facturas, pagos y fidelizacion.
- [ ] Almacen ve productos, inventario, almacenes y marcas.
- [ ] Contabilidad ve facturas, pagos, compras, banco, caja, gastos y reportes.
- [ ] Confirmar rutas protegidas desde URL directa.
- [ ] Revisar auditoria de login y acciones sensibles.

## CORS, HTTPS y dominio

- [ ] CORS permite solo dominios reales y localhost de desarrollo cuando aplique.
- [ ] Configurar HTTPS.
- [ ] Configurar dominio o subdominio final.
- [ ] Configurar proxy o plataforma para servir API y frontend.
- [ ] Verificar que cookies, headers y `Authorization` funcionen detras del proxy.

## Backups y archivos persistentes

- [ ] Configurar `BACKUP_DIR` fuera del codigo o en almacenamiento persistente.
- [ ] Configurar `BACKUP_RETENTION_DAYS`.
- [ ] Definir modo de backup de la app: SQL local con `pg_dump`, portable JSON o deshabilitado.
- [ ] Usar backup del proveedor de PostgreSQL como respaldo principal en Render/Vercel/Supabase.
- [ ] Confirmar que backup portable JSON descarga correctamente si no hay `pg_dump`.
- [ ] Confirmar que `backend/backups` no se versiona.
- [ ] Confirmar que `backend/uploads` no se versiona.
- [ ] Respaldar base de datos.
- [ ] Respaldar logos y archivos cargados.
- [ ] Probar descarga de backup desde la interfaz admin.
- [ ] Documentar procedimiento de restauracion manual.
- [ ] Probar restauracion del proveedor en una base separada antes de depender de ese backup.

## Pruebas funcionales obligatorias

- [ ] Probar dashboard con cero datos y con datos reales.
- [ ] Probar clientes.
- [ ] Probar productos.
- [ ] Probar inventario, almacenes y marcas.
- [ ] Probar busqueda, filtros y paginacion en listados principales.
- [ ] Probar facturacion.
- [ ] Probar pagos simples y multiples.
- [ ] Confirmar que pagos generan trazabilidad hacia banco o caja cuando aplica.
- [ ] Probar PDF de factura.
- [ ] Probar compras y cuentas por pagar.
- [ ] Probar cuentas por cobrar.
- [ ] Probar banco.
- [ ] Probar caja chica.
- [ ] Probar gastos.
- [ ] Confirmar que gastos generan trazabilidad hacia banco o caja cuando aplica.
- [ ] Probar reportes y exportaciones.
- [ ] Probar usuarios, permisos y auditoria.
- [ ] Probar configuracion de empresa/documentos/numeracion.
- [ ] Probar fidelizacion.
- [ ] Probar modo claro/oscuro.
- [ ] Probar responsive en movil, tablet y escritorio.

## Build y verificaciones

- [ ] Ejecutar build frontend.
- [ ] Verificar que la API responda en `/api/health`.
- [ ] Ejecutar verificacion backend disponible.
- [ ] Ejecutar `npm test` en backend.
- [ ] Ejecutar audit de dependencias si aplica.
- [ ] Revisar consola del navegador sin errores bloqueantes.
- [ ] Revisar logs del servidor sin errores repetidos.
- [ ] Confirmar que no quedan pantallas en blanco.
- [ ] Confirmar que no aparecen `undefined` ni `NaN`.
- [ ] Confirmar que un error inesperado muestra una pantalla de recuperacion y no deja la app en blanco.

## Deploy

- [ ] Documentar comandos de deploy backend.
- [ ] Documentar comandos de deploy frontend.
- [ ] Documentar variables necesarias en la plataforma.
- [ ] Documentar orden seguro de despliegue y rollback.
- [ ] Configurar logs del servidor o plataforma.
- [ ] Configurar reinicio automatico del backend.
- [ ] No hacer deploy destructivo sobre base real.
- [ ] Hacer backup final antes de abrir beta a usuarios reales.
