package agent

import (
	"context"
	"os"

	"github.com/rs/zerolog/log"

	"github.com/dyrector-io/darklens/agent/internal/config"
	"github.com/dyrector-io/darklens/agent/internal/docker"
	"github.com/dyrector-io/darklens/agent/internal/grpc"
	"github.com/dyrector-io/darklens/protobuf/go/agent"
)

func Serve(cfg *config.Configuration) {
	docker.PreflightChecks()
	log.Info().Msg("Starting Darklens Agent service")

	grpcParams := grpc.TokenToConnectionParams(cfg.JwtToken)
	grpcContext := grpc.WithGRPCConfig(context.Background(), cfg)
	grpc.Init(grpcContext, grpcParams, cfg, &grpc.WorkerFunctions{
		Close:            grpcClose,
		Watch:            WatchContainers,
		ContaierDelete:   DeleteContainer,
		ContainerCommand: ContainerCommand,
		ContainerLog:     ContainerLog,
		ContainerInspect: ContainerInspect,
	})
}

func grpcClose(ctx context.Context, reason agent.CloseReason) error {
	if reason == agent.CloseReason_SELF_DESTRUCT {
		return docker.RemoveSelf(ctx)
	} else if reason == agent.CloseReason_SHUTDOWN {
		log.Info().Msg("Remote shutdown requested")
		os.Exit(0)
	}

	return nil
}
