package docker

import (
	"context"
	"errors"
	"fmt"

	"github.com/docker/docker/client"
	"github.com/hashicorp/go-version"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// If a runtime version doesn't satisfy recommendation: show warning
// If a runtime version doesn't satisfy minimum: failure

func versionCheck(ctx context.Context, cli client.APIClient) (*zerolog.Event, error) {
	serverVersion, err := cli.ServerVersion(ctx)
	if err != nil {
		return nil, err
	}

	runtime, err := getContainerRuntime(ctx, cli)
	if err != nil {
		return nil, err
	}

	switch runtime {
	case Podman:
		ev := log.Info().Str("Runtime version", serverVersion.Version).Str("Runtime", "Podman")

		err = satisfyVersion(MinimumPodmanServerVersion, RecommendedPodmanServerVersion, serverVersion.Version)
		if err != nil {
			return nil, err
		}
		return ev, nil

	case Docker:
		ev := log.Info().Str("Runtime version", serverVersion.Version).Str("Runtime", "Docker")

		err = satisfyVersion(MinimumDockerServerVersion, RecommendedDockerServerVersion, serverVersion.Version)
		if err != nil {
			return nil, err
		}
		return ev, nil
	default:
		return nil, ErrServerUnknown
	}
}

func satisfyVersion(minimumVer, preferredVer, actualVer string) error {
	serVer, err := version.NewVersion(actualVer)
	if err != nil {
		return ErrCannotParseServerVersion
	}

	// Checking minimum supported version
	constraints, err := version.NewConstraint(fmt.Sprintf(">=%s", minimumVer))
	if err != nil {
		return err
	}

	if !constraints.Check(serVer) {
		return ErrServerVersionIsNotSupported
	}

	// Checking recommended version
	constraints, err = version.NewConstraint(fmt.Sprintf(">=%s", preferredVer))
	if err != nil {
		return err
	}

	if !constraints.Check(serVer) {
		return ErrServerIsOutdated
	}

	return nil
}

func getContainerRuntime(ctx context.Context, cli client.APIClient) (string, error) {
	info, err := cli.Info(ctx)
	if err != nil {
		return "", err
	}

	switch info.InitBinary {
	case "":
		return Podman, nil
	case "docker-init":
		return Docker, nil
	default:
		return UnknownRuntime, ErrServerUnknown
	}
}

func PreflightChecks() {
	ctx := context.Background()

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Fatal().Stack().Err(err).Send()
	}

	_, err = GetAllContainers(ctx)
	if err != nil {
		log.Fatal().Stack().Err(err).Send()
	}

	_, err = versionCheck(ctx, cli)
	if err != nil {
		if errors.Is(err, ErrServerIsOutdated) {
			log.Warn().Stack().Err(err).Msg("Server version is outdated, please consider updating.")
		} else {
			log.Fatal().Stack().Err(err).Send()
		}
	}
}
