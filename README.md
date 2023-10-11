<p align="center">
    <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/darklens_logo_horizontal_transparent.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/darklens_logo_horizontal_light.png">
    <img alt="darklens logo" src="docs/darklens_logo_horizontal_transparent.png" width="400">
    </picture>
</p>

<p align="center"><b>docker logs and docker inspect in an easy to use GUI</b></p>

## Use cases

-   **SSH-less Container Monitoring:** You can add as many components of your infrastructure as you like, and check up on the services running in one place without SSH access.
-   **Centralized View for Container Management:** One user-friendly interface to analyze logs and container configs.
-   **Goodbye JSON (Hello UI):** Quickly interpretable UI to spare you from untangling data in JSON about your containers.

## Getting started

1. Enter `docker run -p 8000:8000 -p 5000:5000 --name darklens -d ghcr.io/dyrector-io/darklens:latest` in terminal
2. Open `localhost:8000` in browser
3. Enjoy!

## Settings

Settings provides various configuration options for running darklens, tailor your darklens deployment to your needs with these settings.

#### Start without Authorization

Launch Darklens without any authentication or authorization checks. Ideal for quick testing and development.

`docker run -p 8000:8000 -p 5000:5000 -e DISABLE_AUTH=true --name darklens -d ghcr.io/dyrector-io/darklens:latest`

#### Select a stronger JWT secret

Enhance security by specifying a custom JWT secret for authentication.

`docker run -p 8000:8000 -p 5000:5000 -e JWT_SECRET=supersecret --name darklens -d ghcr.io/dyrector-io/darklens:latest`

#### Run on a public domain

Configure darklens to run on a public domain with options for specifying a public URL and agent address.

`docker run -p 8000:8000 -p 5000:5000 -e PUBLIC_URL=example.com AGENT_ADDRESS=example.com:5000 --name darklens -d ghcr.io/dyrector-io/darklens:latest`

> Note: Agents require gRPC port 5000 to connect to the service

#### Persist data

Ensure data persistence by using Docker volumes to store Darklens data.

`docker run -p 8000:8000 -p 5000:5000 -v darklens-data:/var/lib/darklens --name darklens -d ghcr.io/dyrector-io/darklens:latest`

#### Use secure agents

Set up secure agents by running darklens over HTTPS, with HTTPS termination using Traefik or NGINX.

`docker run -p 8000:8000 -p 5000:5000 --namedarklens -d ghcr.io/dyrector-io/darklens:latest`

> Note: This requires HTTPS termination using Traefik or NGINX

## Agent install

1. Click on the empty card with a plus icon to add a new node
2. Enter a name for your node and click Save
    - This'll be the name of the agent running as a container on your node
3. On the right side of the screen, select whether you'd like to install the agent with a Shell (UNIX) or a PowerShell (Windows) script
4. Generate the script and copy & paste it into Shell or PowerShell. Press enter to install the agent
5. When node status turns green, you're ready to use darklens

## Development

1. Setup backend

    1. Go to `web/backend`
    2. Run `npm i`
    3. Copy `.env.example` to `.env`

2. Setup frontend

    1. Go to `web/frontend`
    2. Run `npm i`
    3. Copy `.env.example` to `.env`

3. Setup development Traefik

    1. Go to `web`
    2. Run `docker compose -f docker-compose.dev.yaml up`

4. Develop

    1. Go to `web/backend` and run `npx prisma migrate dev` to apply migrations then start using `npm start`
    2. Go to `web/frontend` and run `npm start`
    3. The app will be available on `localhost:8000`

> Make sure the `dev-traefik` container is running as it routes the traffic between the frontend and the backend
