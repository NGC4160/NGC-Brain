# GarageBuddy — Open Source Garage DMS (future / eval)

**Last verified:** 2026-08-30  
**Upstream:** [dimitar-grigorov/GarageBuddy](https://github.com/dimitar-grigorov/GarageBuddy)  
**Local path:** `tools/GarageBuddy` (git submodule)

**Not current shop process.** HCP + QBO remain the live systems. Keep the submodule for evaluation. Do not treat this as today’s scheduling, invoicing, or SOP.

## Why it is here

Open-source ASP.NET Core garage management system under evaluation as a **future** shop DMS alternative. Not customer-facing. Not a replacement for HCP/QBO.

## Stack

| Piece | NGC environment |
|-------|-----------------|
| App | ASP.NET Core 7 MVC (`net7.0`) |
| IDE (Windows) | Visual Studio 2022 |
| IDE / build (Linux / this workspace) | .NET 7 SDK |
| Database | SQL Server **2019** (Docker: `mcr.microsoft.com/mssql/server:2019-latest`) |

Visual Studio 2022 is Windows-only. On Linux, use the .NET 7 SDK + Docker SQL Server path documented in upstream `docs/INSTALLATION.md` and NGC `scripts/garagebuddy/setup.sh`.

## Configure database (this environment)

Connection shape (SQL auth — required for Docker; Windows Trusted_Connection will not work on Linux):

```json
{
  "DatabaseSettings": {
    "DbProvider": "mssql",
    "DefaultConnection": "Server=localhost,1433;Database=GarageBuddy;Trusted_Connection=False;TrustServerCertificate=True;User Id=sa;Password=<YOUR_PASSWORD>;MultipleActiveResultSets=true"
  }
}
```

Stored via:

1. .NET user secrets on `GarageBuddy.Web` (preferred)
2. `Configurations/database.Development.json` (written by setup; do not commit passwords)
3. `docker-compose.override.yml` when using Compose (`Server=sql-server;...`)

## One-command setup

```bash
cp scripts/garagebuddy/env.example scripts/garagebuddy/.env
# edit GARAGEBUDDY_SA_PASSWORD
git submodule update --init --recursive tools/GarageBuddy
./scripts/garagebuddy/setup.sh
```

Then:

```bash
cd tools/GarageBuddy/src/Web/GarageBuddy.Web
ASPNETCORE_ENVIRONMENT=Development dotnet run
```

- App: http://localhost:5000 (HTTPS :5001)
- First registered user = administrator
- Migrations equivalent to Visual Studio `Update-Database`

## Command Center

**Systems → Garage Buddy** — upstream project  
**Tools & Setup → Garage Buddy Setup** — this guide

## Relation to NGC DMS plan

| Candidate | Status |
|-----------|--------|
| Everlogic | Preferred commercial DMS when migrating off HCP |
| BitDMS | Under evaluation |
| **GarageBuddy** | Open-source eval / learning sandbox — not production |

Do not quote GarageBuddy to customers. Do not move live jobs into it until Ryan decides otherwise.

## Do not store

- SA passwords, user-secret values, or customer PII in `knowledge/` or git
