# TRAINER_NOTES — FleetPulse

## Security

- Hardcoded secret fallbacks: `fleetpulse/src/config.ts:4-16`
- Realistic-looking fake credentials in sample env: `fleetpulse/.env.example:3-13`
- JWT without expiry (`expiresIn` ontbreekt): `fleetpulse/src/routes/auth.ts:31-38`, `fleetpulse/src/deprecated_auth.ts:18-26`
- NoSQL-injecteerbare filter: `fleetpulse/src/routes/vehicles.ts:28-40`, `fleetpulse/src/services/vehicleService.ts:35-39`
- CORS wildcard voor debug: `fleetpulse/src/index.ts:19`
- MD5 password hashing: `fleetpulse/src/routes/auth.ts:3,16-19`, `fleetpulse/src/deprecated_auth.ts:2,14-15`, `fleetpulse/seed.js:75,82`
- Admin endpoint alleen `X-Admin: true`: `fleetpulse/src/middleware/auth.ts:22-26` (gebruikt door `fleetpulse/src/routes/admin.ts:8,28`)
- Kwetsbare dependency vastgepind: `fleetpulse/package.json:22` (`lodash@4.17.11`)

## Observability

- Alleen `console.log`, geen structured logging/correlation IDs: bijv. `fleetpulse/src/middleware/logging.ts:4-12`, `fleetpulse/src/services/**/*.ts`
- PII in logs (headers/body/query): `fleetpulse/src/middleware/logging.ts:7-10`
- Health endpoint altijd 200 zonder dependency checks: `fleetpulse/src/index.ts:30-37`
- Errors weggeslikt met `catch { console.log(...) }`: o.a.
  - `fleetpulse/src/index.ts:24-28,57-65,80-83`
  - `fleetpulse/src/services/vehicleService.ts:19-21,26-28,39-42,61-63,70-73`
  - `fleetpulse/src/services/sqsConsumer.ts:10-12,21-23,45-50`
  - `fleetpulse/src/routes/*.ts` (meerdere catches)
  - `fleetpulse/scripts/migrate.js:13-15,19-21,25-27,33-35`
  - `fleetpulse/driver-score-service/app.py:19-21`

## Retry / resilience

- Retry-loop zonder exponential backoff: `fleetpulse/src/services/sqsConsumer.ts:15-24`
- Geen circuit breaker rond downstream calls: score + queue + s3 flows (`fleetpulse/src/services/driverScoreClient.js`, `notificationService.ts`, `s3Service.ts`)
- 60s timeout op score call: `fleetpulse/src/services/driverScoreClient.js:16`
- Message “ack” vóór processing (onbedoeld at-most-once): `fleetpulse/src/services/sqsConsumer.ts:42-47`

## Cloud lock-in / portability

- AWS SDK calls direct in business code:
  - `fleetpulse/src/routes/vehicles.ts:2,9-15,61-64`
  - `fleetpulse/src/services/notificationService.ts:1-10,21-27`
  - `fleetpulse/src/services/s3Service.ts:1-10,17-24`
- SQS-specifieke concepten in app logic: `fleetpulse/src/services/sqsConsumer.ts:37-44`
- Lambda handler hard AWS-event shape: `fleetpulse/src/lambda/processTelemetry.ts:3-13`
- Hardcoded S3 bucket/region: `fleetpulse/src/services/s3Service.ts:5,12`
- Cognito diep verweven met auth-flow: `fleetpulse/src/routes/auth.ts:9-13`
- Mongo direct overal gebruikt, geen abstractielaag: startpunt `fleetpulse/src/db/mongo.ts:1-28`, aanroepen in routes/services

## Operational readiness

- Geen graceful shutdown / SIGTERM-handling: `fleetpulse/src/index.ts:68-83`
- Geen echt readiness vs liveness (`/ready` altijd true): `fleetpulse/src/index.ts:39-41`
- Migraties draaien in app-process bij startup (race risk): `fleetpulse/src/index.ts:24-28`, `fleetpulse/scripts/migrate.js:3-31`
- Geen rate limiting middleware aanwezig in `index.ts`
- Cron-job draait in API process: `fleetpulse/src/index.ts:56-66`

## Data & privacy

- PII in logs (driver gegevens via request payloads): `fleetpulse/src/middleware/logging.ts:7-10`
- Geen retention policy; GPS blijft groeien: `fleetpulse/src/services/vehicleService.ts:56-58`
- Geen pseudonymization in analytics payload: `fleetpulse/src/services/driverScoreClient.js:8-13`
- Export endpoint lekt alle tenants met raadbare key: `fleetpulse/src/routes/export.ts:6-24`

## Red herrings (bewust)

1. **Scary comment maar code eronder is feitelijk veilig binnen context**
   - `fleetpulse/src/routes/admin.ts:32-36` (`SECURITY WARNING: DO NOT TOUCH`)
2. **`deprecated_auth.ts` lijkt dead code maar wordt nog gebruikt**
   - Dynamic require: `fleetpulse/src/routes/auth.ts:49`
   - Werkelijke codepad: `fleetpulse/src/deprecated_auth.ts:6-31`

## Subtiele problemen + trainer hints

- Memory leak in Redis client (listeners stapelen): `fleetpulse/src/db/redis.ts:12-15`
  - Hint: monitor `listenerCount('error')` terwijl requests lopen.
- Timezone-bug score service (UTC vs local mix): `fleetpulse/driver-score-service/score.py:17-31`
  - Hint: test rond DST/verschillende host timezones.
- Non-deterministische output (geen seed): `fleetpulse/driver-score-service/score.py:33`
  - Hint: identieke input meerdere keren posten.
- “Silent crash” zonder GPS fix:
  - Raise zonder GPS: `fleetpulse/driver-score-service/score.py:11-12`
  - Geslikte fout: `fleetpulse/driver-score-service/app.py:19-21`
  - Vehicle verdwijnt uit dashboard-respons: `fleetpulse/src/services/vehicleService.ts:15-17`
- Feature flags als verspreide `NODE_ENV === 'production'`: `fleetpulse/src/config.ts:19-22`

## Bonus-problemen (extra)

1. Dashboard JavaScript slikt fetch-fouten stil (`catch (e) {}`): `fleetpulse/src/public/index.html:57`
2. `/api/vehicles` accepteert token in querystring: `fleetpulse/src/middleware/auth.ts:7`
3. Startup gebruikt `execSync` voor migraties en blokkeert app boot: `fleetpulse/src/index.ts:25`

## Voorgestelde ticket top-10 (urgency × impact)

1. Vervang auth basis (MD5, header-admin, token-zonder-expiry) met veilig authn/authz + RBAC.
2. Verwijder/lockdown onveilige filter endpoint; implementeer server-side query whitelist.
3. Repareer export datalek met tenant-scoped autorisatie en audit logging.
4. Implementeer graceful shutdown + echte liveness/readiness checks.
5. Herontwerp queue consumer (ack-na-succes, backoff, DLQ, idempotency).
6. Introduceer structured logging, redactie van PII en correlation IDs.
7. Voeg abstrahering toe voor AWS- en datastore-afhankelijkheden.
8. Definieer retention/pseudonymization beleid voor telemetry + analytics.
9. Verplaats migraties en cron naar aparte workers met deploy-safe orchestration.
10. Upgrade kwetsbare dependencies en voeg dependency/CodeQL gates toe in CI.
