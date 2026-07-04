# Production Checklist

## Entorno

- [ ] Configurar `NODE_ENV=production`.
- [ ] Cambiar `JWT_SECRET` por un secreto fuerte.
- [ ] Cambiar credenciales de base de datos.
- [ ] Revisar variables de entorno backend y frontend.
- [ ] Configurar `VITE_API_URL` para la API real.
- [ ] Configurar `FRONTEND_URL` y CORS para el dominio real.
- [ ] Configurar HTTPS.
- [ ] Configurar dominio.
- [ ] Configurar logs del servidor.
- [ ] Confirmar que no se suben archivos `.env`.

## Base de datos y Prisma

- [ ] Ejecutar migraciones Prisma.
- [ ] Ejecutar `npx prisma generate`.
- [ ] Ejecutar seed solo si aplica.
- [ ] Crear backup antes del despliegue.
- [ ] Verificar backups automaticos o programados de base de datos.
- [ ] Configurar `BACKUP_DIR` en almacenamiento persistente o externo al codigo.
- [ ] Configurar `BACKUP_RETENTION_DAYS`.
- [ ] Probar restauracion manual en un ambiente de prueba.
- [ ] Documentar procedimiento de restauracion.

## Archivos persistentes

- [ ] Verificar respaldo externo de `backend/backups`.
- [ ] Verificar respaldo externo de `backend/uploads`.
- [ ] Confirmar que logos empresariales y archivos cargados persisten tras reiniciar el servidor.
- [ ] Confirmar que no se suben backups, uploads privados ni logs al repositorio.
- [ ] Confirmar que `.gitignore` cubre `.env`, `backend/backups`, `backend/uploads`, logs, `node_modules`, `dist` y `build`.

## Seguridad

- [ ] Crear usuario admin real.
- [ ] Confirmar que no se cargaron usuarios demo.
- [ ] Verificar permisos por rol: admin, ventas, almacen y contabilidad.
- [ ] Confirmar que solo existen usuarios reales del cliente.
- [ ] Probar login y expiracion de sesion.
- [ ] Verificar rate limit de login.
- [ ] Revisar auditoria de acciones sensibles.
- [ ] Verificar que no haya credenciales reales versionadas.

## Multiempresa

- [ ] Verificar separacion por empresa si el despliegue usa multiempresa.
- [ ] Confirmar que cada usuario solo accede a companias asignadas.
- [ ] Confirmar que datos de clientes, productos, facturas, compras, reportes, configuracion, finanzas, impuestos y RRHH no cruzan empresas.
- [ ] Verificar que logos y datos fiscales/documentos son por empresa.

## Modulos operativos

- [ ] Probar clientes, productos e inventario.
- [ ] Probar facturas, pagos y cuentas por cobrar.
- [ ] Probar compras, pagos y cuentas por pagar.
- [ ] Probar banco, caja chica y gastos.
- [ ] Probar asientos y reportes contables.
- [ ] Probar reportes, CSV, PDFs e impresion.
- [ ] Probar fidelizacion.
- [ ] Probar finanzas.
- [ ] Probar impuestos.
- [ ] Probar recursos humanos.
- [ ] Probar sistema de backups desde interfaz.

## Documentos, PDFs y reportes

- [ ] Verificar que PDFs usan datos reales de empresa.
- [ ] Verificar RNC, direccion, telefono, email y logo empresarial en documentos.
- [ ] Verificar numeracion de facturas, compras y asientos.
- [ ] Verificar exportaciones CSV/PDF.
- [ ] Verificar impresion desde reportes y modulos fiscales.

## Frontend y UX

- [ ] Ejecutar `npm run build` en frontend.
- [ ] Revisar responsive en escritorio, tablet y movil.
- [ ] Probar tema claro/oscuro.
- [ ] Probar navegacion por sidebar y rutas protegidas.
- [ ] Confirmar que no hay `NaN`, `undefined` ni errores visuales en tablas/graficos.

## Despliegue

- [ ] Configurar proceso de backend con reinicio automatico.
- [ ] Configurar servidor web/proxy inverso si aplica.
- [ ] Configurar almacenamiento persistente para uploads y backups.
- [ ] Hacer backup final antes del despliegue.
- [ ] Verificar monitoreo basico de disponibilidad y logs.
