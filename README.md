# DarkLens

## Getting started

TODO: One liner `docker run`

## Development

1. Setup backend

    1. Goto `web/backend`
    2. Run `npm i`
    3. Copy `.env.example` to `.env`

2. Setup frontend

    1. Goto `web/frontend`
    2. Run `npm i`
    3. Copy `.env.example` to `.env`

3. Setup development Traefik

    1. Goto `web`
    2. Run `docker compose -f docker-compose.dev.yaml up`

4. Develop

    1. Goto `web/backend` and run `npm start`
    2. Goto `web/frontend` and run `npm start`
    3. The app will be available on `localhost:8000`

    > Make sure the `dev-traefik` container is running as it routes the traffic between the frontand and the backend
