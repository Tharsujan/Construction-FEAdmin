# Siteworks yard office

Staff admin for cement stock and orders, equipment rentals, construction projects, and site crews. It uses the same API as the client site, and only an `Admin` session is kept.

## Run

1. Start the API on port `5205`.
2. From this folder:

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The client site stays on port `3000`.

Browser calls go to `/api` on this app, and Next proxies them to `http://localhost:5205`. `http://localhost:3001` is also listed in the API `AllowedOrigins`.

Local staff account:

- Email: `admin@construction.local`
- Password: `Admin@12345`
# Construction-FEAdmin
