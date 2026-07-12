# Gestion Pro - Notas de Entrega Beta

Estado: preparado para subir a GitHub y validar en Vercel/Render despues de configurar variables reales y backups del proveedor.

## Mejoras aplicadas

- Login, registro de negocio y codigo de compania revisados para beta real.
- Permisos ajustados por rol: admin, ventas, almacen y contabilidad.
- Rutas protegidas y respuestas 401/403/404 revisadas.
- Seguridad reforzada con validacion de `JWT_SECRET`, CORS, headers, rate limit y sesion expirada.
- Reportes limitados y validados para evitar cargas grandes sin filtros.
- Trazabilidad financiera entre facturas, compras, pagos, banco, caja y gastos.
- Trazabilidad de inventario por documento, referencia, costo y origen.
- Tablas y formatos protegidos contra datos incompletos, `NaN`, fechas invalidas y pantallas en blanco.
- Documentacion operativa actualizada para beta, produccion, backups, Vercel/Render y rollback.

## Comandos de verificacion

Backend:

```bash
cd backend
npm run verify
npx prisma migrate status
```

Frontend:

```bash
cd frontend
npm run verify
```

## Antes de abrir el piloto

- Configurar `JWT_SECRET` real y fuerte.
- Configurar `DATABASE_URL` y `DIRECT_URL` reales.
- Configurar `VITE_API_URL` apuntando al backend desplegado.
- Configurar `FRONTEND_URL` y `FRONTEND_URLS` con el dominio real.
- Crear backup del proveedor de PostgreSQL.
- Ejecutar migraciones en el backend desplegado.
- Crear negocio piloto desde login o usar seed solo si se decide conscientemente.
- Desactivar registro publico despues de crear el negocio piloto si no debe quedar abierto.

## Prueba minima post-deploy

- `/api/health` responde.
- Crear negocio y guardar codigo generado.
- Login con email, password y codigo de compania.
- Dashboard carga con cero datos.
- Crear cliente, producto, factura, pago y compra de prueba.
- Confirmar movimientos de inventario, banco o caja con origen.
- Confirmar permisos por rol y Unauthorized.
- Confirmar reportes y PDF.
- Confirmar responsive en movil y escritorio.
