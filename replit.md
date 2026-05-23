# SmogNet — AI-Powered Air Quality Intelligence System

SmogNet is an end-to-end air quality intelligence dashboard for detecting, classifying, and communicating air quality hazards across Pakistan's 8 major cities.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, path /api)
- `pnpm --filter @workspace/smognet run dev` — run the React dashboard (port 25161, path /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Recharts + Framer Motion + shadcn/ui + wouter

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/airQuality.ts` — DB schema (readings, spikes, alerts tables)
- `artifacts/api-server/src/routes/airQuality.ts` — all air quality API routes
- `artifacts/smognet/src/` — React dashboard frontend
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validators

## Architecture decisions

- OpenAPI-first: spec → codegen → typed React hooks and Zod validators
- 8 cities covered: Lahore, Karachi, Islamabad, Peshawar, Multan, Faisalabad, Quetta, Rawalpindi
- Seeded with 720 synthetic readings, 150 anomaly spikes, 15 health alerts across 8 cities
- SVG-based Pakistan map (no external map library) for choropleth city visualization
- Pollution sources: Crop Burning, Vehicular, Industrial, Dust Storm, Mixed

## Product

SmogNet shows real-time national KPIs (AQI, PM2.5, active alerts), 30-day pollutant trends, anomaly detection timeline, source classification, per-city intelligence table, bilingual (English + Urdu) health alerts, and an SVG choropleth map of Pakistan.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run codegen after changing `lib/api-spec/openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- DB seed data lives in the PostgreSQL instance, not in files — re-run executeSql if the DB is wiped
- The /map page uses SVG circles positioned at hardcoded Pakistan city coordinates (not Leaflet)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
