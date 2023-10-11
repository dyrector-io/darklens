package agent

import (
	"context"
	"encoding/json"

	"github.com/docker/docker/client"
	"github.com/dyrector-io/darklens/agent/internal/docker"
	"github.com/dyrector-io/darklens/protobuf/go/agent"
)

func ContainerInspect(ctx context.Context, request *agent.ContainerInspectRequest) (string, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return "", err
	}

	name := request.Name

	cont, err := docker.GetContainerByName(ctx, cli, name)
	if err != nil {
		return "", err
	}

	containerInfo, err := cli.ContainerInspect(ctx, cont.ID)
	if err != nil {
		return "", err
	}

	inspectionJSON, err := json.Marshal(containerInfo)
	if err != nil {
		return "", err
	}
	inspection := string(inspectionJSON)
	// TODO(@amorfevo): maybe this works too
	// inspection := fmt.Sprintf("%+v", containerInfo)

	return inspection, nil
}
