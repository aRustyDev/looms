# Docker module for projx-ui
# Usage: just docker <recipe>

set shell := ["bash", "-euo", "pipefail", "-c"]

compose_file := justfile_directory() / "compose.yaml"

# Start all containers
up:
    docker compose -f {{ compose_file }} up -d

# Stop all containers
down:
    docker compose -f {{ compose_file }} down

# View container logs
[arg("follow", short="f", long, value="true")]
logs follow="false" *services:
    {{ if follow == "true" { "docker compose -f " + compose_file + " logs -f " + services } else { "docker compose -f " + compose_file + " logs " + services } }}

# Build all images
build:
    docker compose -f {{ compose_file }} build

# Restart containers
restart:
    docker compose -f {{ compose_file }} restart

# Show container status
status:
    docker compose -f {{ compose_file }} ps

# Pull latest images
pull:
    docker compose -f {{ compose_file }} pull

# Remove containers and volumes
destroy:
    docker compose -f {{ compose_file }} down -v

# Execute command in container
exec service *cmd:
    docker compose -f {{ compose_file }} exec {{ service }} {{ cmd }}

# View resource usage
stats:
    docker stats --no-stream $(docker compose -f {{ compose_file }} ps -q)
