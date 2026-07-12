# Gestion Pro - despliegue piloto gratis

Objetivo: publicar Gestion Pro para que una persona lo pruebe desde el navegador, sin instalar nada en la computadora del cliente.

Arquitectura del piloto:

- Frontend React/Vite: Vercel Free.
- Backend Node/Express: Render Free.
- Base de datos PostgreSQL: Supabase Free.
- Logos: guardados como `data:image/...` en PostgreSQL para evitar depender del disco temporal de Render.
- Backups: manuales desde Supabase durante el piloto gratis.

## 1. Supabase Free

1. Crear un proyecto en Supabase.
2. Abrir `Project Settings > Database`.
3. Copiar estas URLs:
   - `DATABASE_URL`: usar la URL pooler/transaccional compatible con la app.
   - `DIRECT_URL`: usar la URL directa de Postgres para migraciones Prisma.
4. Guardar la clave de la base de datos en un gestor seguro. No subirla al repo.

Formato recomendado para Prisma:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
```

## 2. Render Free backend

Crear un Web Service conectado al repo.

Si Render detecta `render.yaml`, usar:

- Root directory: `backend`
- Build command: `npm install && npm run prisma:generate && npm run prisma:deploy`
- Start command: `npm start`
- Health check: `/api/health`

Variables en Render:

```env
NODE_ENV=production
DATABASE_URL="URL_POOLER_DE_SUPABASE"
DIRECT_URL="URL_DIRECTA_DE_SUPABASE"
JWT_SECRET="GENERAR_UN_SECRETO_LARGO_DE_32+_CARACTERES"
JWT_EXPIRES_IN="8h"
FRONTEND_URL="https://TU_FRONTEND.vercel.app"
FRONTEND_URLS="https://TU_FRONTEND.vercel.app"
TRUST_PROXY=1
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=10
DISABLE_LOGIN_RATE_LIMIT=false
DISABLE_PUBLIC_REGISTER=false
ENABLE_LOCAL_BACKUPS=false
DISABLE_LOCAL_BACKUPS=true
```

Flujo recomendado para piloto real:

1. Dejar `DISABLE_PUBLIC_REGISTER=false` temporalmente.
2. Crear el negocio desde la pantalla de login.
3. Guardar el codigo generado.
4. Entrar con email, contrasena y codigo.
5. Cuando el negocio este creado, cambiar Render a `DISABLE_PUBLIC_REGISTER=true`.
6. Cambiar Vercel a `VITE_DISABLE_PUBLIC_REGISTER=true`.
7. Redeploy frontend y backend.

El seed queda solo como alternativa tecnica. Si decides usarlo, ejecutarlo una sola vez desde Render Shell:

```bash
npm run prisma:seed
```

El seed puede crear empresas de prueba y un admin inicial. No lo uses encima de una base real con datos sin revisar primero.

## 3. Vercel Free frontend

Crear un proyecto apuntando a la carpeta `frontend`.

Configuracion:

- Framework preset: Vite.
- Root directory: `frontend`.
- Build command: `npm run build`.
- Output directory: `dist`.

Variable en Vercel:

```env
VITE_API_URL="https://TU_BACKEND.onrender.com/api"
VITE_DISABLE_PUBLIC_REGISTER=false
```

Cuando Vercel entregue la URL final, volver a Render y actualizar:

```env
FRONTEND_URL="https://TU_FRONTEND.vercel.app"
FRONTEND_URLS="https://TU_FRONTEND.vercel.app"
```

Luego redeploy del backend.

## 4. Prueba de aceptacion

1. Abrir `https://TU_BACKEND.onrender.com/api/health` y confirmar `{"status":"ok"}`.
2. Abrir el frontend en Vercel.
3. Crear un negocio desde la pantalla de login.
4. Copiar el codigo generado y guardarlo en un lugar seguro.
5. Iniciar sesion con email, contrasena y codigo generado.
6. Crear un segundo negocio solo si necesitas probar multiempresa.
7. Crear datos simples en una empresa y confirmar que no aparecen en la otra.
8. Subir un logo pequeno y confirmar que se ve en configuracion y PDF.
9. Confirmar que reportes CSV/PDF descargan.
10. Desactivar el registro publico en Render y Vercel despues de crear el negocio piloto.

## 5. Backups en modo piloto gratis

No depender de `pg_dump` dentro de Render Free. Render no garantiza disco persistente en este modo y puede no tener herramientas PostgreSQL instaladas.

Para el piloto:

- Usar backups/exportaciones desde Supabase Dashboard.
- Descargar un backup manual antes de cada sesion importante con el cliente.
- Usar `Sistema > Backups` solo como respaldo adicional portable JSON.
- Mantener los logos pequenos porque se guardan dentro de PostgreSQL.
- No usar el almacenamiento local `backend/backups` como respaldo principal en produccion.

La pantalla `Sistema > Backups` puede generar JSON portable cuando no hay `pg_dump`, pero en Render Free debe tratarse como apoyo, no como respaldo formal.

## 6. Limitaciones del plan gratis

- Render Free duerme el backend despues de inactividad; el primer acceso puede tardar alrededor de un minuto.
- Render Free no debe usarse como almacenamiento persistente para uploads/backups.
- Supabase Free tiene limite bajo de base de datos; si se excede, el proyecto puede quedar en modo solo lectura.
- Vercel Free es suficiente para el frontend estatico, pero las variables `VITE_*` se fijan al momento del build.
- No hay garantias de SLA ni rendimiento de produccion.
- Es adecuado para una persona probando, no para operacion critica.

## 7. Checklist final

- [ ] Proyecto Supabase creado.
- [ ] `DATABASE_URL` pooler configurada en Render.
- [ ] `DIRECT_URL` directa configurada en Render.
- [ ] `JWT_SECRET` real configurado.
- [ ] Backend desplegado y `/api/health` responde.
- [ ] Migraciones Prisma aplicadas por Render.
- [ ] Negocio piloto creado desde login o seed ejecutado una sola vez si se eligio ese flujo.
- [ ] Frontend desplegado en Vercel.
- [ ] `VITE_API_URL` apunta a Render.
- [ ] `FRONTEND_URL` y `FRONTEND_URLS` apuntan a Vercel.
- [ ] Login probado con codigo generado.
- [ ] Registro publico desactivado despues de crear el negocio si no debe quedar abierto.
- [ ] Logo probado.
- [ ] Backup manual descargado desde Supabase.
