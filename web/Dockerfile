# Build frontend
FROM docker.io/library/node:19.2-alpine3.17 AS UIBUILDER
WORKDIR /build

COPY ./frontend/package.json ./frontend/package-lock.json .
RUN npm ci --arch=x64 --platform=linuxmusl --cache .npm --prefer-offline --no-fund

COPY ./frontend ./
RUN npm run build && \
    npm prune --production

# Build backend
FROM docker.io/library/node:19.2-alpine3.17 AS APIBUILDER
WORKDIR /build

RUN apk --update add openssl1.1-compat

COPY ./backend/package.json ./backend/package-lock.json ./backend/tsconfig.build.json ./backend/tsconfig.json ./
RUN npm ci --arch=x64 --platform=linuxmusl --cache .npm --prefer-offline --no-fund

COPY ./backend/prisma ./prisma
RUN npm run prisma:gen

COPY ./backend/src ./src

RUN npm run build && \
    npm prune --production

# Create image
FROM docker.io/library/node:20.5.0-alpine3.17 AS RUNNER

ENV NODE_ENV production
ENV TZ UTC

# Defaults
ENV DATABASE file:/var/lib/darklens/data.db
ENV JWT_SECRET super-secret
ENV AGENT_ADDRESS host.docker.internal:5000
ENV PUBLIC_URL http://localhost:8000

RUN apk --update add tzdata openssl1.1-compat

WORKDIR /app

COPY --from=APIBUILDER /build/dist ./dist
COPY --from=APIBUILDER /build/package.json ./
COPY --from=APIBUILDER /build/node_modules ./node_modules
COPY --from=APIBUILDER /build/prisma ./prisma
COPY ./backend/entrypoint.sh ./
COPY ./backend/assets/ ./assets/
COPY ./backend/proto ./proto

COPY --from=UIBUILDER /build/build ./assets/frontend

RUN chmod +x ./entrypoint.sh

EXPOSE 5000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -nv -t1 --spider http://localhost:1848/api/health || exit 1

# Start
ENTRYPOINT ["./entrypoint.sh"]
