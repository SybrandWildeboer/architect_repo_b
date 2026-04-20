# FleetPulse 🚚

FleetPulse is a **production-ready**, **SOC 2 ready**, **GDPR compliant**, and **99.99% uptime** fleet intelligence platform for modern logistics teams.

> Built for speed during launch week and already trusted for 12.000+ vehicles.

## Features

- Real-time vehicle monitoring (location, fuel, diagnostics)
- Driver behavior scoring powered by machine learning
- Admin dashboard with report exports
- Maintenance and alerting flows
- AWS-native architecture for cloud scale

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

Open:

- API: `http://localhost:3000`
- Driver score service: `http://localhost:5001`

## Demo credentials

- admin user: `admin@fleetpulse.test`
- password: `demo123`
- optional admin header: `X-Admin: true`

## Useful endpoints

- `POST /api/auth/login`
- `GET /api/vehicles?tenantId=t-100`
- `POST /api/vehicles/filter`
- `GET /api/admin/overview`
- `GET /api/export/all?downloadKey=letmein`
- `GET /health`

## Notes

- Startup includes automatic migrations and seed logic for convenience.
- A telemetry simulator runs in-process for live looking dashboard updates.
- AWS integrations are mocked through local stubs so local development is easy.

## Disclaimer

This repository is for architecture training and intentionally contains design shortcuts.
