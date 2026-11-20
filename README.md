# StudyFlow — AI Student Task Manager

A mini project starter with a React frontend, Express REST API, and MySQL database. The first version includes a student dashboard, task CRUD, filters, progress indicators, and an AI task breakdown endpoint (configured with an OpenAI-compatible API key).

## Requirements

- Node.js 20+
- MySQL 8+

## Run locally

1. Create a MySQL database by running `database/schema.sql` in MySQL Workbench or the MySQL CLI.
2. In `server/`, copy `.env.example` to `.env` and set your MySQL credentials. Add `OPENAI_API_KEY` to enable AI breakdowns; without it, the server returns a built-in breakdown.
3. From `server/`, run `npm install`, then `npm run dev`.
4. In another terminal, from `client/`, run `npm install`, then `npm run dev`.
5. Open the Vite URL (normally `http://localhost:5173`).

## API

- `GET /api/health`
- `GET /api/tasks?status=pending&search=essay`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/ai/breakdown` with `{ "title": "...", "description": "..." }`

This starter keeps a demo student identity on the API for simplicity. Add authentication and per-user authorization before using it with real student data.

## Deploy to Vercel

Deploy this as two Vercel projects from the same Git repository:

1. **Put the project on GitHub.** Do not commit `server/.env`; it contains local credentials. The root `.gitignore` excludes it.
2. **Use a hosted MySQL database.** A MySQL server running on your laptop cannot be reached by Vercel. Run `database/schema.sql` against the hosted database and keep its host, port, database name, username, and password handy.
3. **Deploy the API:** import the repository in Vercel and set the project's Root Directory to `server`. Vercel detects the Express app in `src/index.js`. Add these Environment Variables under Project Settings → Environment Variables:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — credentials for the hosted MySQL database.
   - `DB_SSL=true` for hosted databases that require TLS (such as TiDB Cloud Starter).
   - `CLIENT_ORIGIN` — the exact deployed frontend origin, such as `https://studyflow-web.vercel.app` (no trailing slash). Multiple origins can be comma-separated.
   - `OPENAI_API_KEY` — optional; without it the API returns the built-in demo breakdown.
4. **Deploy the frontend:** import the same repository as another Vercel project and set its Root Directory to `client`. Use build command `npm run build` and output directory `dist`. Add `VITE_API_URL` with the API deployment origin, such as `https://studyflow-api.vercel.app` (no trailing slash).
5. Redeploy the frontend after setting `VITE_API_URL`. Open `https://<api-domain>/api/health`; it should report `{ "ok": true, "database": "connected" }`. Then open the frontend deployment and test task creation.

Environment variable changes apply to new deployments, so redeploy after changing them. Never put database credentials or AI keys in `VITE_` variables; Vite exposes those values to browser code.
