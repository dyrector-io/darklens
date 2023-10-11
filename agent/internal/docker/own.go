package docker

import (
	"context"
	"errors"
	"fmt"
	"os"

	"github.com/rs/zerolog/log"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/dyrector-io/darklens/agent/internal/utils"
)

func GetOwnContainer(ctx context.Context, cli client.APIClient) (*types.Container, error) {
	hostname := os.Getenv("HOSTNAME")

	log.Info().Str("hostname", hostname).Msg("Getting self by hostname")

	ownContainer, err := GetContainerByName(ctx, cli, hostname)
	if err != nil {
		return nil, err
	}
	if ownContainer != nil {
		return ownContainer, nil
	}

	ownContainer, err = GetContainerByID(ctx, hostname)
	if err != nil {
		return nil, err
	}
	if ownContainer != nil {
		return ownContainer, nil
	}

	cgroup, err := utils.ParseCGroupFile()
	if err != nil {
		return nil, err
	}

	log.Info().Str("cgroup", cgroup).Msg("Getting self by CGroup")

	ownContainer, err = GetContainerByID(ctx, cgroup)
	if err != nil {
		return nil, err
	}
	if ownContainer != nil {
		return ownContainer, nil
	}

	return nil, fmt.Errorf("failed to find parent container: %w", &UnknownContainerError{})
}

func GetOwnContainerImage(cli client.APIClient) (*types.ImageInspect, error) {
	self, err := GetOwnContainer(context.Background(), cli)
	if err != nil {
		return nil, err
	}

	image, _, err := cli.ImageInspectWithRaw(context.Background(), self.ImageID)
	if err != nil {
		return nil, err
	}

	return &image, nil
}

func RemoveSelf(ctx context.Context) error {
	log.Info().Msg("Removing self")

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}

	self, err := GetOwnContainer(ctx, cli)
	if err != nil {
		if errors.Is(err, &UnknownContainerError{}) {
			return errors.New("could not find owning container, maybe not running in container")
		}
		return err
	}

	err = cli.ContainerRemove(ctx, self.ID, types.ContainerRemoveOptions{
		Force: true,
	})
	if err != nil {
		return err
	}

	return nil
}
