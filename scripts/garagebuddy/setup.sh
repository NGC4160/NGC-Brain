#!/usr/bin/env bash
# NGC GarageBuddy setup — Linux/Docker equivalent of VS 2022 + SQL Server 2019.
# Usage: ./scripts/garagebuddy/setup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GB_ROOT="${GARAGEBUDDY_ROOT:-$ROOT/tools/GarageBuddy}"
WEB_PROJ="$GB_ROOT/src/Web/GarageBuddy.Web/GarageBuddy.Web.csproj"
DATA_PROJ="$GB_ROOT/src/Data/GarageBuddy.Data/GarageBuddy.Data.csproj"
COMPOSE_OVERRIDE="$GB_ROOT/src/docker-compose.override.yml"

# Load optional local env
if [[ -f "$SCRIPT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$SCRIPT_DIR/.env"; set +a
fi

SA_PASSWORD="${GARAGEBUDDY_SA_PASSWORD:-}"
SQL_PORT="${GARAGEBUDDY_SQL_PORT:-1433}"
CONTAINER_NAME="${GARAGEBUDDY_SQL_CONTAINER:-garage-buddy-sql}"

if [[ -z "$SA_PASSWORD" ]]; then
  echo "Set GARAGEBUDDY_SA_PASSWORD (see scripts/garagebuddy/env.example)."
  exit 1
fi

export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
export PATH="$DOTNET_ROOT:$HOME/.dotnet/tools:$PATH"
# Workaround: .NET 7 Roslyn + some hosts crash with AVX enabled
export COMPlus_EnableAVX="${COMPlus_EnableAVX:-0}"
export DOTNET_EnableAVX="${DOTNET_EnableAVX:-0}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1"; exit 1; }
}

echo "==> Checking prerequisites"
need_cmd docker
need_cmd curl

if ! command -v dotnet >/dev/null 2>&1; then
  echo "Installing .NET 7 SDK (GarageBuddy targets net7.0; Linux substitute for VS 2022)..."
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel 7.0
  export DOTNET_ROOT="$HOME/.dotnet"
  export PATH="$DOTNET_ROOT:$PATH"
fi

dotnet --list-sdks | grep -q '^7\.' || {
  echo ".NET 7 SDK required. Install from https://dotnet.microsoft.com/download/dotnet/7.0"
  exit 1
}

if [[ ! -f "$WEB_PROJ" ]]; then
  echo "GarageBuddy not found at $GB_ROOT"
  echo "Init submodule: git submodule update --init --recursive tools/GarageBuddy"
  echo "Or clone: git clone https://github.com/dimitar-grigorov/GarageBuddy \"$GB_ROOT\""
  exit 1
fi

echo "==> Starting SQL Server 2019 (Docker)"
if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon not running. Start dockerd, then re-run."
  exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  docker start "$CONTAINER_NAME" >/dev/null || true
else
  docker run --name "$CONTAINER_NAME" \
    -e "ACCEPT_EULA=Y" \
    -e "MSSQL_SA_PASSWORD=${SA_PASSWORD}" \
    -p "${SQL_PORT}:1433" \
    -d mcr.microsoft.com/mssql/server:2019-latest
fi

echo "==> Waiting for SQL Server on port ${SQL_PORT}"
ready=0
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER_NAME" /opt/mssql-tools18/bin/sqlcmd \
      -S localhost -U sa -P "$SA_PASSWORD" -C -Q "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "$ready" -ne 1 ]]; then
  echo "SQL Server did not become ready. Check: docker logs $CONTAINER_NAME"
  exit 1
fi
echo "SQL Server ready."

CONN="Server=localhost,${SQL_PORT};Database=GarageBuddy;Trusted_Connection=False;TrustServerCertificate=True;User Id=sa;Password=${SA_PASSWORD};MultipleActiveResultSets=true"
DOCKER_CONN="Server=sql-server;Database=GarageBuddy;Trusted_Connection=False;TrustServerCertificate=True;User Id=sa;Password=${SA_PASSWORD}"

echo "==> Writing Development database override (local only)"
mkdir -p "$GB_ROOT/src/Web/GarageBuddy.Web/Configurations"
cat > "$GB_ROOT/src/Web/GarageBuddy.Web/Configurations/database.Development.json" <<EOF
{
  "DatabaseSettings": {
    "DbProvider": "mssql",
    "DefaultConnection": "${CONN}"
  }
}
EOF

echo "==> Configuring .NET user secrets"
dotnet user-secrets set "DatabaseSettings:DbProvider" "mssql" --project "$WEB_PROJ"
dotnet user-secrets set "DatabaseSettings:DefaultConnection" "$CONN" --project "$WEB_PROJ"

if [[ -f "$COMPOSE_OVERRIDE" ]]; then
  echo "==> Aligning docker-compose.override.yml SA password for this environment"
  python3 - <<PY
from pathlib import Path
import re
p = Path(${COMPOSE_OVERRIDE@Q})
text = p.read_text()
text2 = re.sub(r"Password=[^\s\"]+", "Password=${SA_PASSWORD}", text)
text2 = re.sub(r"(SA_PASSWORD:\s*).*", r"\1${SA_PASSWORD}", text2)
p.write_text(text2)
print("Updated", p)
PY
fi

echo "==> Restoring and building"
dotnet restore "$GB_ROOT/src/GarageBuddy.sln"
dotnet build "$WEB_PROJ" -c Debug -p:UseSharedCompilation=false -m:1

if ! command -v dotnet-ef >/dev/null 2>&1; then
  dotnet tool install -g dotnet-ef --version 7.0.10 || true
fi

echo "==> Applying EF migrations (Update-Database)"
dotnet ef database update \
  --project "$DATA_PROJ" \
  --startup-project "$WEB_PROJ" \
  --connection "$CONN"

cat <<EOF

GarageBuddy configured for this environment.

  Repo:     $GB_ROOT
  SQL:      localhost:${SQL_PORT} (container: ${CONTAINER_NAME})
  Provider: mssql
  Run:      cd $GB_ROOT/src/Web/GarageBuddy.Web && ASPNETCORE_ENVIRONMENT=Development dotnet run
  URLs:     http://localhost:5000  ·  https://localhost:5001

First registered user becomes administrator.
Docker Compose: cd $GB_ROOT/src && docker compose up --build

EOF
