package main

import (
	"os"

	"github.com/rs/zerolog/log"

	agent "github.com/dyrector-io/darklens/agent/internal/agent"
	"github.com/dyrector-io/darklens/agent/internal/config"
	"github.com/dyrector-io/darklens/agent/internal/health"
	"github.com/dyrector-io/darklens/agent/internal/version"

	cli "github.com/urfave/cli/v2"
)

func serve(_ *cli.Context) error {
	cfg := config.Configuration{}

	err := config.ReadConfig(&cfg)
	if err != nil {
		log.Panic().Err(err).Msg("Failed to load configuration")
	}

	err = config.InjectGrpcToken(&cfg)
	if err != nil {
		log.Panic().Err(err).Msg("Failed to load gRPC token")
	}

	log.Info().Msg("Configuration loaded.")

	agent.Serve(&cfg)

	return nil
}

func getHealth(_ *cli.Context) error {
	healthy, err := health.GetHealthy()
	if err != nil {
		log.Error().Err(err).Send()
	}

	if healthy {
		os.Exit(0)
		return nil
	}

	os.Exit(1)
	return nil
}

func main() {
	app := &cli.App{
		Name:     "agent",
		Version:  version.BuildVersion(),
		HelpName: "agent",
		Usage:    "cli tool for serving a Docker agent of darklens",
		Action:   serve,

		Commands: []*cli.Command{
			{
				Name:    "health",
				Aliases: []string{"h"},
				Usage:   "Get the health of the agent",
				Action:  getHealth,
			},
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal().Err(err).Send()
	}
}
