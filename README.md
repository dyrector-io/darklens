<p align="center">
    <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/darklens_logo_horizontal_transparent.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/darklens_logo_horizontal_light.png">
    <img alt="darklens logo" src="docs/darklens_logo_horizontal_transparent.png" width="400">
    </picture>
</p>

<p align="center"><b>Lightweight container viewer.</b></p>

## Use cases

- **SSH-less Container Monitoring:** You can add as many components of your infrastructure as you like, and check up on the services running in one place without SSH access.
- **Centralized View for Container Management:** One user-friendly interface to analyze logs and container configs, and interact with them.
- **Goodbye JSON (Hello UI):** Quickly interpretable UI to spare you from untangling data in JSON about your containers.

## Getting started

1. Enter `docker run -p 8000:8000 -d ghcr.io/dyrector-io/darklens:latest` in terminal
2. Open `localhost:8000` in browser
3. Enjoy!

### Other options

* Start without authorization: `docker run -p 8000:8000 -p 5000:5000 -e DISABLE_AUTH=true -d ghcr.io/dyrector-io/darklens:latest`
* Select a stronger JWT secret: `docker run -p 8000:8000 -p 5000:5000 -e JWT_SECRET=supersecret -d ghcr.io/dyrector-io/darklens:latest`
* Run on a public domain: `docker run -p 8000:8000 -p 5000:5000 -e PUBLIC_URL=example.com AGENT_ADDRESS=example.com:5000 -d ghcr.io/dyrector-io/darklens:latest`
    * Note: Agents require gRPC port 5000 to connect to the service
* Persist data: `docker run -p 8000:8000 -p 5000:5000 -v darklens-data:/var/lib/darklens -d ghcr.io/dyrector-io/darklens:latest`

## Agent install

1. Click on the empty card with a plus icon to add a new node
2. Enter a name for your node and click Save
    -  This'll be the name of the agent running as a container on your node
3. On the right side of the screen, select whether you'd like to install the agent with a Shell (UNIX) or a PowerShell (Windows) script
4. Generate the script and copy & paste it into Shell or PowerShell. Press enter to install the agent
5. When node status turns green, you're ready to use darklens

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

    1. Goto `web/backend` and run `npx prisma migrate dev` to apply migrations then start using `npm start`
    2. Goto `web/frontend` and run `npm start`
    3. The app will be available on `localhost:8000`
</br>
    > Make sure the `dev-traefik` container is running as it routes the traffic between the frontend and the backend
