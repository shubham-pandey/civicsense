# Environment setup

1. Create a PostgreSQL database, e.g. civicsense

2. Create a `.env` file in this directory with:

```
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/civicsense
PORT=3000
```

3. Apply schema and seed:

```
psql "$DATABASE_URL" -f schema.sql
psql "$DATABASE_URL" -f seed.sql
```

4. Install and run the server:

```
npm install
npm run dev
```

Open http://localhost:3000 and the dashboard will load. The UI will call `/api/reports` and `/api/reports/:id` and send PATCH updates to `/api/reports/:id`.
