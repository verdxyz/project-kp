# B2Gov Project Dashboard

React 19, TypeScript, Vite, Express 5, and PostgreSQL.

## Local development

Requirements: Node.js 20.19+ (or 22.12+).

1. Copy `.env.example` to `.env`. Set a unique `ADMIN_PASSWORD` with at least 12 characters and a random `SESSION_SECRET` with at least 32 characters. These values are local secrets; never commit `.env`.
2. Install packages with `npm install`.
3. Start the API and Vite development server with `npm run dev`.
4. Open the Vite URL shown in the terminal and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.

Local development starts an embedded PostgreSQL-compatible database automatically and persists its data under `LOCAL_DATABASE_DIR`. The API runs database migrations and creates one global admin account at startup. Project records and document metadata are stored in PostgreSQL; uploaded files are stored in a private Cloudflare R2 bucket. Uploads are limited to 10 MB each and to PDF, Office, and common image formats.

### Cloudflare R2 setup

Create a private R2 bucket and an S3 API token with read/write access to that bucket. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` in `.env` and in the deployed API environment. The browser accesses files through the authenticated backend; do not put R2 credentials in `VITE_*` variables or frontend code.

### Using a separate PostgreSQL server

To use Docker PostgreSQL or a managed server instead, remove `LOCAL_DATABASE` from `.env` and set `DATABASE_URL`. For the included Docker service, run `docker compose up -d postgres` and use `postgresql://postgres:<password>@127.0.0.1:5432/b2g_dashboard`.

To build the frontend, run `npm run build`. To run the production server, configure the environment, build the frontend, and run `npm start`.

## Data and deployment

The only account is a centrally configured support admin. Passwords are bcrypt-hashed in PostgreSQL; the browser receives an HTTP-only, same-site session cookie. The frontend communicates with the Express API, which reads and writes project records, service points, agencies, and document metadata in PostgreSQL. Document binaries are stored in private Cloudflare R2 object storage.

The local Compose password is for development only. Production deployments must use managed PostgreSQL, strong secrets, HTTPS, private document storage with backups, and a shared rate-limit store if the API runs on multiple instances. Existing browser-only demo project data is not automatically imported into PostgreSQL. Existing records in a Supabase database and files in Supabase Storage are not migrated automatically; export the records and copy the files to Render PostgreSQL and R2 before switching production data.
