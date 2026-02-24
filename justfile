
init:
    docker compose -f .docker/compose.yaml up -d --build

clean:
    docker compose -f .docker/compose.yaml down
    echo "TODO"
