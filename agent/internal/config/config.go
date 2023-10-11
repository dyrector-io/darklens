package config

import (
	"errors"
	"os"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/ilyakaznacheev/cleanenv"
)

var (
	ErrNoGrpcTokenProvided = errors.New("no grpc token provided")
	ErrGrpcTokenInvalid    = errors.New("grpc token validation error")
)

type Configuration struct {
	GrpcTimeout        time.Duration `yaml:"grpcTimeout"              env:"GRPC_TIMEOUT"                env-default:"5s"`
	GrpcKeepalive      time.Duration `yaml:"grpcKeepalive"            env:"GRPC_KEEPALIVE"              env-default:"60s"`
	GrpcToken          string        `yaml:"grpcToken"                env:"GRPC_TOKEN"                  env-default:""`
	HostDockerSockPath string        `yaml:"hostDockerSockPath"     env:"HOST_DOCKER_SOCK_PATH" env-default:"/var/run/docker.sock"`

	// gRPC token is set separately, because nested structures are not yet suppported in cleanenv
	JwtToken *ValidJWT
}

func ReadConfig[T Configuration](cfg *T) error {
	// cleanenv configuration reader
	err := cleanenv.ReadConfig(".env", cfg)

	if err != nil && !os.IsNotExist(err) {
		return err
	}
	err = cleanenv.ReadEnv(cfg)
	if err != nil {
		return err
	}

	return nil
}

func InjectGrpcToken(c *Configuration) error {
	var err error

	if c.GrpcToken != "" {
		// set the token from the environment as a fallback
		c.JwtToken, err = ValidateAndCreateJWT(c.GrpcToken)
		if err != nil {
			log.Error().Err(err).Msg("Failed to validate the gRPC token supplied in the environment variables.")
			return ErrNoGrpcTokenProvided
		}
	}

	return nil
}
