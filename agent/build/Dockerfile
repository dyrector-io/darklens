
# this image is meant to build with buildx
FROM gcr.io/distroless/static

ARG TARGETOS
ARG TARGETARCH
ARG AGENT_BINARY
ARG REVISION

LABEL org.opencontainers.image.title="Agent component for Darklens"
LABEL org.opencontainers.image.vendor="dyrector.io"
LABEL org.opencontainers.image.source="https://github.com/dyrector-io/darklens/agent"
LABEL org.opencontainers.image.revision="$REVISION"

COPY ./$AGENT_BINARY-$TARGETOS-$TARGETARCH /agent

HEALTHCHECK --interval=30s --timeout=5s CMD ["/agent", "health"]

ENTRYPOINT ["/agent"]
