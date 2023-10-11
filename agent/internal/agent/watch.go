package agent

import (
	"context"
	"errors"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/events"
	"github.com/docker/docker/client"
	"github.com/dyrector-io/darklens/agent/internal/grpc"
	"github.com/dyrector-io/darklens/agent/internal/mapper"
	"github.com/dyrector-io/darklens/agent/internal/docker"
	"github.com/dyrector-io/darklens/protobuf/go/agent"
)

func messageToStateItem(ctx context.Context, event *events.Message) (*agent.ContainerStateItem, error) {
	// Only check container events, ignored events include image, volume, network, daemons, etc.
	if event.Type != "container" {
		return nil, nil
	}

	name, hasValue := event.Actor.Attributes["name"]
	if !hasValue {
		return nil, errors.New("event has no container name")
	}

	if event.Action == "destroy" {
		return &agent.ContainerStateItem{
			Name:      name,
			Command:   "",
			CreatedAt: nil,
			State:     agent.ContainerState_REMOVED,
			Reason:    "",
			Ports:     []*agent.ContainerStateItemPort{},
			ImageName: "",
			ImageTag:  "",
		}, nil
	}

	containerState := mapper.MapDockerContainerEventToContainerState(event.Action)
	// Ingored events are mapped to unspecified, for example tty, exec, oom, etc.
	if containerState == agent.ContainerState_CONTAINER_STATE_UNSPECIFIED {
		return nil, nil
	}

	container, err := docker.GetContainerByID(ctx, event.Actor.ID)
	if err != nil {
		return nil, err
	}

	newState := mapper.MapContainerState(container)
	newState.State = containerState
	return newState, nil
}

func WatchContainers(ctx context.Context) (*grpc.ContainerWatchContext, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}

	containers, err := docker.GetAllContainers(ctx)
	if err != nil {
		return nil, err
	}

	eventChannel := make(chan []*agent.ContainerStateItem)
	errorChannel := make(chan error)

	chanMessages, chanErrors := cli.Events(ctx, types.EventsOptions{})

	go func(ctx context.Context, chanMessages <-chan events.Message, chanErrors <-chan error) {
		eventChannel <- mapper.MapContainerStateList(containers)

		for {
			select {
			case <-ctx.Done():
				return
			case eventError := <-chanErrors:
				errorChannel <- eventError
				return
			case eventMessage := <-chanMessages:
				var changed *agent.ContainerStateItem
				changed, err = messageToStateItem(ctx, &eventMessage)
				if err != nil {
					errorChannel <- err
					return
				} else if changed != nil {
					eventChannel <- []*agent.ContainerStateItem{
						changed,
					}
				}
				break
			}
		}
	}(ctx, chanMessages, chanErrors)

	return &grpc.ContainerWatchContext{
		Events: eventChannel,
		Error:  errorChannel,
	}, nil
}
