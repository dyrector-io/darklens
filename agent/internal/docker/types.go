package docker

import "errors"

const (
	VisibleIDLimit        = 12
	DockerLogHeaderLength = 8
)

const (
	Podman                         = "podman"
	Docker                         = "docker"
	UnknownRuntime                 = "unknown-runtime"
	MinimumDockerServerVersion     = "20.10.0"
	RecommendedDockerServerVersion = "23.0.0"
	MinimumPodmanServerVersion     = "4.0.0"
	RecommendedPodmanServerVersion = "4.4.0"
	PodmanHost                     = "host.containers.internal"
	DockerHost                     = "host.docker.internal"
)

var (
	ErrCannotConnectToServer          = errors.New("cannot connect to server")
	ErrServerIsOutdated               = errors.New("server is outdated")
	ErrServerVersionIsNotSupported    = errors.New("serverversion is not supported")
	ErrServerUnknown                  = errors.New("server is unknown")
	ErrServerVersionIsNotValid        = errors.New("server version is not valid")
	ErrCannotParseServerVersion       = errors.New("cannot parse server version")
	ErrCannotParseVersionConstraint   = errors.New("cannot parse version constraint")
	ErrCannotGetServerInformation     = errors.New("cannot get server information")
	ErrCannotGetServerVersion         = errors.New("cannot get server version")
	ErrCannotSatisfyVersionConstraint = errors.New("cannot satisfy version constraint")
)

type DockerVersion struct {
	ServerVersion string
	ClientVersion string
}

type UnknownContainerError struct{}

func (err *UnknownContainerError) Error() string {
	return "unknown container ID"
}
