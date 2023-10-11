package mapper

import (
	"strings"
	"time"

	dockerTypes "github.com/docker/docker/api/types"
	"github.com/dyrector-io/darklens/protobuf/go/agent"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func MapContainerState(it *dockerTypes.Container) *agent.ContainerStateItem {
	if it == nil {
		return nil
	}
	name := ""
	if len(it.Names) > 0 {
		name = strings.TrimPrefix(it.Names[0], "/")
	}

	imageName := strings.Split(it.Image, ":")

	var imageTag string

	if len(imageName) > 1 {
		imageTag = imageName[1]
	} else {
		imageTag = "latest"
	}

	return &agent.ContainerStateItem{
		Name:      name,
		Command:   it.Command,
		CreatedAt: timestamppb.New(time.UnixMilli(it.Created * int64(time.Microsecond)).UTC()),
		State:     MapDockerStateToCruxContainerState(it.State),
		Reason:    it.State,
		Ports:     mapContainerPorts(&it.Ports),
		ImageName: imageName[0],
		ImageTag:  imageTag,
	}
}

func MapContainerStateList(in []dockerTypes.Container) []*agent.ContainerStateItem {
	list := []*agent.ContainerStateItem{}

	for i := range in {
		item := MapContainerState(&in[i])
		list = append(list, item)
	}

	return list
}

func mapContainerPorts(in *[]dockerTypes.Port) []*agent.ContainerStateItemPort {
	ports := []*agent.ContainerStateItemPort{}

	for i := range *in {
		it := (*in)[i]

		ports = append(ports, &agent.ContainerStateItemPort{
			Internal: int32(it.PrivatePort),
			External: int32(it.PublicPort),
		})
	}

	return ports
}

func MapDockerStateToCruxContainerState(state string) agent.ContainerState {
	switch state {
	case "created":
		return agent.ContainerState_WAITING
	case "restarting":
		return agent.ContainerState_WAITING
	case "running":
		return agent.ContainerState_RUNNING
	case "removing":
		return agent.ContainerState_WAITING
	case "paused":
		return agent.ContainerState_WAITING
	case "exited":
		return agent.ContainerState_EXITED
	case "dead":
		return agent.ContainerState_EXITED
	default:
		return agent.ContainerState_CONTAINER_STATE_UNSPECIFIED
	}
}

func MapDockerContainerEventToContainerState(event string) agent.ContainerState {
	switch event {
	case "create":
		return agent.ContainerState_WAITING
	case "destroy":
		return agent.ContainerState_REMOVED
	case "pause":
		return agent.ContainerState_WAITING
	case "restart":
		return agent.ContainerState_RUNNING
	case "start":
		return agent.ContainerState_RUNNING
	case "stop":
		return agent.ContainerState_EXITED
	case "die":
		return agent.ContainerState_EXITED
	default:
		return agent.ContainerState_CONTAINER_STATE_UNSPECIFIED
	}
}
