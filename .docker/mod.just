# Docker module for looms
# Usage: just docker <recipe> [env=dev|test|prod|penpot]

set shell := ["bash", "-euo", "pipefail", "-c"]

compose_file := justfile_directory() / "compose.yaml"

# Default profile
env := "dev"

# Resolve env file path (penpot uses .env.example, others use .env.<profile>)
_env_file := if env == "penpot" { justfile_directory() / ".env.example" } else { justfile_directory() / ".env." + env }

# Common compose command with profile + env file
_compose := "docker compose -f " + compose_file + " --profile " + env + " --env-file " + _env_file

# Start containers for the selected profile
up:
    {{ _compose }} up -d --build

# Stop containers for the selected profile
down:
    {{ _compose }} down

# View container logs
[arg("follow", short="f", long, value="true")]
logs follow="false" *services:
    {{ if follow == "true" { _compose + " logs -f " + services } else { _compose + " logs " + services } }}

# Build images
build:
    {{ _compose }} build

# Restart containers
restart:
    {{ _compose }} restart

# Show container status
status:
    {{ _compose }} ps

# Pull latest images
pull:
    {{ _compose }} pull

# Remove containers and volumes (destructive)
destroy:
    {{ _compose }} down -v

# Execute command in container
exec service *cmd:
    {{ _compose }} exec {{ service }} {{ cmd }}

# View resource usage
stats:
    docker stats --no-stream $({{ _compose }} ps -q 2>/dev/null)
