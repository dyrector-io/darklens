package agent

import (
	"bufio"
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"io"

	"github.com/rs/zerolog/log"
	"github.com/dyrector-io/darklens/protobuf/go/agent"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/dyrector-io/darklens/agent/internal/docker"
	"github.com/dyrector-io/darklens/agent/internal/grpc"
)

type DockerContainerLogReader struct {
	EventChannel chan grpc.ContainerLogEvent
	Reader       io.ReadCloser

	grpc.ContainerLogReader
}

func (dockerReader *DockerContainerLogReader) Next() <-chan grpc.ContainerLogEvent {
	return dockerReader.EventChannel
}

func (dockerReader *DockerContainerLogReader) Close() error {
	return dockerReader.Reader.Close()
}

func streamDockerLog(reader io.ReadCloser, eventChannel chan grpc.ContainerLogEvent) {
	header := make([]byte, docker.DockerLogHeaderLength)

	bufferSize := 2048
	buffer := make([]byte, bufferSize)

	for {
		_, err := reader.Read(header)
		if err != nil {
			eventChannel <- grpc.ContainerLogEvent{
				Message: "",
				Error:   err,
			}
			break
		}

		payloadSize := int(binary.BigEndian.Uint32(header[4:]))
		if payloadSize > bufferSize {
			buffer = make([]byte, payloadSize)
			bufferSize = payloadSize
		}

		read := 0
		for read < payloadSize {
			count, err := reader.Read(buffer[read:payloadSize])
			read += count

			if err != nil {
				eventChannel <- grpc.ContainerLogEvent{
					Message: "",
					Error:   err,
				}
				break
			}
		}

		if read > 0 {
			eventChannel <- grpc.ContainerLogEvent{
				Message: string(buffer[0:read]),
				Error:   nil,
			}
		}
	}
}

func streamDockerLogTTY(reader io.ReadCloser, eventChannel chan grpc.ContainerLogEvent) {
	buffer := bufio.NewReader(reader)

	for {
		message, err := buffer.ReadString('\n')
		if err != nil {
			eventChannel <- grpc.ContainerLogEvent{
				Message: "",
				Error:   err,
			}
			break
		}

		eventChannel <- grpc.ContainerLogEvent{
			Message: message,
			Error:   nil,
		}
	}
}

func ContainerLog(ctx context.Context, request *agent.ContainerLogRequest) (*grpc.ContainerLogContext, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}

	self, err := docker.GetOwnContainer(ctx, cli)
	if err != nil {
		if !errors.Is(err, &docker.UnknownContainerError{}) {
			return nil, err
		}

		log.Warn().Err(err).Msg("Failed to get self container")

		self = &types.Container{}
	}

	name := request.Name

	cont, err := docker.GetContainerByName(ctx, cli, name)
	if err != nil {
		return nil, fmt.Errorf("container not found: %w", err)
	}

	containerID := cont.ID
	enableEcho := containerID != self.ID

	log.Trace().Str("name", name).Str("selfContainerId", self.ID).Msgf("Container log echo enabled: %t", enableEcho)

	inspect, err := cli.ContainerInspect(ctx, containerID)
	if err != nil {
		return nil, err
	}

	tty := inspect.Config.Tty

	streaming := request.GetStreaming()
	tail := fmt.Sprintf("%d", request.GetTail())

	eventChannel := make(chan grpc.ContainerLogEvent)

	reader, err := cli.ContainerLogs(ctx, containerID, types.ContainerLogsOptions{
		ShowStderr: true,
		ShowStdout: true,
		Follow:     streaming,
		Tail:       tail,
		Timestamps: true,
	})
	if err != nil {
		return nil, err
	}

	if tty {
		go streamDockerLogTTY(reader, eventChannel)
	} else {
		go streamDockerLog(reader, eventChannel)
	}

	logReader := &DockerContainerLogReader{
		EventChannel: eventChannel,
		Reader:       reader,
	}

	logContext := &grpc.ContainerLogContext{
		Reader: logReader,
		Echo:   enableEcho,
	}

	return logContext, nil
}