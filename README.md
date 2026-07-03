# ERP Administrativo

Aplicacion web tipo ERP administrativo creada con frontend React + Vite y backend Node.js + Express + Prisma.

## Requisitos

- Node.js 18 o superior
- PostgreSQL local o remoto

## Backend

```bash
cd backend
npm install
copy .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

La API corre por defecto en `http://localhost:4000`.

Credenciales demo:

- Email: `admin@demo.com`
- Password: `admin123`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend corre por defecto en `http://localhost:5173`.

## Variables

Backend:

- `DATABASE_URL`: conexion PostgreSQL.
- `JWT_SECRET`: secreto para firmar tokens.
- `JWT_EXPIRES_IN`: expiracion del token.
- `PORT`: puerto de la API.
- `FRONTEND_URL`: origen permitido para CORS.

Frontend opcional:

- `VITE_API_URL`: URL base de la API. Por defecto usa `http://localhost:4000/api`.
