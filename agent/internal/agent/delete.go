package agent

import (
	"context"
	"fmt"

	"github.com/docker/docker/client"
	"github.com/dyrector-io/darklens/agent/internal/docker"
	"github.com/dyrector-io/darklens/protobuf/go/agent"
)

func DeleteContainer(ctx context.Context, req *agent.ContainerDeleteRequest) error {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}

	name := req.Name

	container, err := docker.GetContainerByName(ctx, cli, name)
	if err != nil {
		return fmt.Errorf("could not get container (%s) to delete: %s", name, err.Error())
	}

	if container == nil {
		return nil
	}

	return docker.DeleteContainer(ctx, container)
}
