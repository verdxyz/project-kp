# B2Gov Project Dashboard

React 19, TypeScript, Vite, Express 5, and PostgreSQL.

## Local development

Requirements: Node.js 20.19+ (or 22.12+).

1. Copy `.env.example` to `.env`. Set a unique `ADMIN_PASSWORD` with at least 12 characters and a random `SESSION_SECRET` with at least 32 characters. These values are local secrets; never commit `.env`.
2. Install packages with `npm install`.
3. Start the API and Vite development server with `npm run dev`.
4. Open the Vite URL shown in the terminal and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.

Local development starts an embedded PostgreSQL-compatible database automatically and persists its data under `LOCAL_DATABASE_DIR`. The API runs database migrations and creates one global admin account at startup. Project documents are stored under `STORAGE_DIR` and linked to their LOP in PostgreSQL. Uploads are limited to 10 MB each and to PDF, Office, and common image formats.

### Using a separate PostgreSQL server

To use Docker PostgreSQL or a managed server instead, remove `LOCAL_DATABASE` from `.env` and set `DATABASE_URL`. For the included Docker service, run `docker compose up -d postgres` and use `postgresql://postgres:<password>@127.0.0.1:5432/b2g_dashboard`.

To build the frontend, run `npm run build`. To run the production server, configure the environment, build the frontend, and run `npm start`.

## Data and deployment

The only account is a centrally configured support admin. Passwords are bcrypt-hashed in PostgreSQL; the browser receives an HTTP-only, same-site session cookie. Project records, agency references, stages, categories, capacity, SID, and document metadata are stored in PostgreSQL. Document binary files are stored on disk rather than in the database.

The local Compose password is for development only. Production deployments must use managed PostgreSQL, strong secrets, HTTPS, persistent/private document storage with backups, and a shared rate-limit store if the API runs on multiple instances. Existing browser-only demo project data is not automatically imported into PostgreSQL.
