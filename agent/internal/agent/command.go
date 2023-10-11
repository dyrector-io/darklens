package agent

import (
	"context"

	"github.com/rs/zerolog/log"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/dyrector-io/darklens/agent/internal/docker"
	"github.com/dyrector-io/darklens/protobuf/go/agent"
)

func ContainerCommand(ctx context.Context, command *agent.ContainerCommandRequest) error {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}

	operation := command.Operation

	name := command.Name

	cont, err := docker.GetContainerByName(ctx, cli, name)
	if err != nil {
		return err
	}

	if operation == agent.ContainerOperation_START_CONTAINER {
		err = cli.ContainerStart(ctx, cont.ID, types.ContainerStartOptions{})
	} else if operation == agent.ContainerOperation_STOP_CONTAINER {
		err = cli.ContainerStop(ctx, cont.ID, container.StopOptions{})
	} else if operation == agent.ContainerOperation_RESTART_CONTAINER {
		err = cli.ContainerRestart(ctx, cont.ID, container.StopOptions{})
	} else {
		log.Error().Str("operation", operation.String()).Str("name", name).Msg("Unknown operation")
	}

	return err
}
