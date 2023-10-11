package grpc

import (
	"context"
	"crypto/x509"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/dyrector-io/darklens/agent/internal/config"
	"github.com/dyrector-io/darklens/agent/internal/health"
	"github.com/dyrector-io/darklens/agent/internal/utils"
	"github.com/dyrector-io/darklens/agent/internal/version"
	"github.com/dyrector-io/darklens/protobuf/go/agent"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/connectivity"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type Connection struct {
	Conn   *grpc.ClientConn
	Client agent.AgentClient
}

type ConnectionParams struct {
	nodeID  string
	address string
	token   string
}

type ContainerLogEvent struct {
	Message string
	Error   error
}

type ContainerLogReader interface {
	Next() <-chan ContainerLogEvent
	Close() error
}

type ContainerLogContext struct {
	Reader ContainerLogReader
	Echo   bool
}

type ContainerWatchContext struct {
	Events chan []*agent.ContainerStateItem
	Error  chan error
}

type ClientLoop struct {
	Ctx         context.Context
	WorkerFuncs WorkerFunctions
	cancel      context.CancelFunc
	AppConfig   *config.Configuration
}

type (
	WatchFunc            func(context.Context) (*ContainerWatchContext, error)
	CloseFunc            func(context.Context, agent.CloseReason) error
	ContainerCommandFunc func(context.Context, *agent.ContainerCommandRequest) error
	ContainerDeleteFunc  func(context.Context, *agent.ContainerDeleteRequest) error
	ContainerLogFunc     func(context.Context, *agent.ContainerLogRequest) (*ContainerLogContext, error)
	ContainerInspectFunc func(context.Context, *agent.ContainerInspectRequest) (string, error)
)

type WorkerFunctions struct {
	Watch            WatchFunc
	Close            CloseFunc
	ContainerCommand ContainerCommandFunc
	ContaierDelete   ContainerDeleteFunc
	ContainerLog     ContainerLogFunc
	ContainerInspect ContainerInspectFunc
}

type contextKey int

const (
	contextConfigKey        contextKey = 0
	contextMetadataKeyToken            = "lens-node-token" // #nosec G101
)

func TokenToConnectionParams(grpcToken *config.ValidJWT) *ConnectionParams {
	host := grpcToken.Issuer
	if len(grpcToken.Host) != 0 {
		host = grpcToken.Host
	}

	return &ConnectionParams{
		nodeID:  grpcToken.Subject,
		address: host,
		token:   grpcToken.StringifiedToken,
	}
}

func (g *Connection) SetClient(client agent.AgentClient) {
	g.Client = client
}

func (g *Connection) SetConn(conn *grpc.ClientConn) {
	g.Conn = conn
}

// Singleton instance
var grpcConn *Connection

func fetchCertificatesFromURL(ctx context.Context, addr string) (*x509.CertPool, error) {
	log.Info().Msg("Retrieving certificate")

	req, err := http.NewRequestWithContext(ctx, http.MethodHead, addr, http.NoBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create the http request: %s", err.Error())
	}

	//nolint:bodyclose //closed already
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request for certificates: %s", err.Error())
	}

	defer utils.LogDeferredErr(resp.Body.Close, log.Warn(), "error closing http response")

	if resp.TLS == nil {
		return nil, errors.New("TLS info is missing")
	}

	if !resp.TLS.HandshakeComplete {
		return nil, errors.New("TLS handshake was incomplete")
	}

	certificates := resp.TLS.PeerCertificates
	if len(certificates) < 1 {
		return nil, errors.New("certificates not found")
	}

	pool := x509.NewCertPool()
	for _, cert := range certificates {
		pool.AddCert(cert)
	}

	return pool, nil
}

func Init(grpcContext context.Context,
	connParams *ConnectionParams,
	appConfig *config.Configuration,
	workerFuncs *WorkerFunctions,
) {
	log.Info().Msg("Spinning up gRPC Agent client...")
	if grpcConn == nil {
		grpcConn = &Connection{}
	}

	ctx, cancel := context.WithCancel(grpcContext)
	loop := ClientLoop{
		cancel:      cancel,
		AppConfig:   appConfig,
		Ctx:         ctx,
		WorkerFuncs: *workerFuncs,
	}

	err := health.Serve(loop.Ctx)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to start serving health")
	}

	loop.Ctx = metadata.AppendToOutgoingContext(loop.Ctx, contextMetadataKeyToken, connParams.token)

	if grpcConn.Conn == nil {
		var creds credentials.TransportCredentials

		address := connParams.address
		if !strings.HasPrefix(address, "http") {
			address = fmt.Sprintf("https://%s", address)
		}

		parsedUrl, err := url.Parse(address)
		if err != nil {
			log.Panic().Err(err).Str("address", address).Msg("Failed to parse URL")
		}

		if parsedUrl.Scheme == "https" {
			certPool, err := fetchCertificatesFromURL(loop.Ctx, address)
			if err != nil {
				log.Panic().Err(err).Msg("Could not fetch valid certificate")
			} else {
				creds = credentials.NewClientTLSFromCert(certPool, "")
			}
		} else {
			log.Warn().Msg("Using insecure connection")
			creds = insecure.NewCredentials()
		}

		opts := []grpc.DialOption{
			grpc.WithTransportCredentials(creds),
			grpc.WithBlock(),
			grpc.WithKeepaliveParams(
				keepalive.ClientParameters{
					Time:                appConfig.GrpcKeepalive,
					Timeout:             appConfig.GrpcTimeout,
					PermitWithoutStream: true,
				}),
		}

		grpcAddress := fmt.Sprintf("%s%s", parsedUrl.Host, parsedUrl.Path)
		log.Info().Str("address", grpcAddress).Msg("Dialing to address.")
		conn, err := grpc.Dial(grpcAddress, opts...)
		if err != nil {
			log.Panic().Stack().Err(err).Msg("Failed to dial gRPC")
		}

		for {
			state := conn.GetState()
			if state != connectivity.Ready {
				log.Debug().Msgf("Waiting for state to change: %d", state)
				conn.WaitForStateChange(loop.Ctx, state)
				log.Debug().Msgf("State Changed to: %d", conn.GetState())
			} else {
				break
			}
		}
		if err != nil {
			log.Error().Stack().Err(err).Msg("gRPC connection error")
		}
		grpcConn.Conn = conn
	}

	loop.grpcLoop(connParams)
}

func (cl *ClientLoop) grpcProcessCommand(command *agent.AgentCommand) {
	switch {
	case command.GetContainerState() != nil:
		go executeWatchContainerState(cl.Ctx, command.GetContainerState(), cl.WorkerFuncs.Watch)
	case command.GetClose() != nil:
		go cl.executeClose(command.GetClose())
	case command.GetContainerCommand() != nil:
		go executeContainerCommand(cl.Ctx, command.GetContainerCommand(), cl.WorkerFuncs.ContainerCommand)
	case command.GetContainerDelete() != nil:
		go executeContainerDelete(cl.Ctx, command.GetContainerDelete(), cl.WorkerFuncs.ContaierDelete)
	case command.GetContainerLog() != nil:
		go executeContainerLog(cl.Ctx, command.GetContainerLog(), cl.WorkerFuncs.ContainerLog)
	case command.GetContainerInspect() != nil:
		go executeContainerInspect(cl.Ctx, command.GetContainerInspect(), cl.WorkerFuncs.ContainerInspect)
	default:
		log.Warn().Msg("Unknown agent command")
	}
}

func (cl *ClientLoop) grpcLoop(connParams *ConnectionParams) {
	var stream agent.Agent_ConnectClient
	var err error
	defer cl.cancel()
	defer grpcConn.Conn.Close()
	for {
		if grpcConn.Client == nil {
			client := agent.NewAgentClient(grpcConn.Conn)
			grpcConn.SetClient(client)

			stream, err = grpcConn.Client.Connect(
				cl.Ctx, &agent.AgentInfo{Id: connParams.nodeID, Version: version.BuildVersion()},
				grpc.WaitForReady(true),
			)
			if err != nil {
				log.Error().Stack().Err(err).Send()
				time.Sleep(time.Second)
				grpcConn.Client = nil
				continue
			}
			log.Info().Msg("Stream connection is up")
			health.SetHealthGRPCStatus(true)
		}

		command := new(agent.AgentCommand)
		err = stream.RecvMsg(command)
		if err != nil {
			s := status.Convert(err)
			if s != nil && (s.Code() == codes.Unauthenticated || s.Code() == codes.PermissionDenied || s.Code() == codes.NotFound) {
				log.Error().Err(err).Msg("Invalid token")
				break
			}

			grpcConn.Client = nil
			health.SetHealthGRPCStatus(false)

			if err == io.EOF {
				log.Info().Msg("End of stream")
			} else {
				log.Error().Stack().Err(err).Msg("Cannot receive stream")
			}

			time.Sleep(cl.AppConfig.GrpcTimeout)
			continue
		}

		cl.grpcProcessCommand(command)
	}
}

func streamContainerStatus(
	streamCtx context.Context,
	stream agent.Agent_ContainerStateClient,
	req *agent.ContainerStateRequest,
	eventsContext *ContainerWatchContext,
) {
	for {
		select {
		case <-streamCtx.Done():
			return
		case eventError := <-eventsContext.Error:
			log.Error().Err(eventError).Msg("Container status watcher error")
			return
		case event := <-eventsContext.Events:
			err := stream.Send(&agent.ContainerStateListMessage{
				Data: event,
			})
			if err != nil {
				log.Error().Err(err).Msg("Container status channel error")
				return
			}

			if req.OneShot != nil && *req.OneShot {
				err := stream.CloseSend()
				if err == nil {
					log.Info().Msg("Closed container status channel")
				} else {
					log.Error().Err(err).Msg("Failed to close container status channel")
				}

				return
			}
			break
		}
	}
}

func executeWatchContainerState(ctx context.Context, req *agent.ContainerStateRequest, watchFn WatchFunc) {
	if watchFn == nil {
		log.Error().Msg("Watch function not implemented")
		return
	}

	log.Info().Msg("Opening container status channel")

	stream, err := grpcConn.Client.ContainerState(ctx, grpc.WaitForReady(true))
	if err != nil {
		log.Error().Err(err).Msg("Failed to open container status channel")
		return
	}

	defer func() {
		err = stream.CloseSend()
		if err != nil {
			log.Error().Err(err).Stack().Msg("Failed to close container status stream")
		}
	}()

	streamCtx := stream.Context()

	eventsContext, err := watchFn(streamCtx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to open container status reader")
		return
	}

	// The channel consumer must run in a gofunc so RecvMsg can receive server side stream close events
	go streamContainerStatus(streamCtx, stream, req, eventsContext)

	// RecvMsg must be called in order to get an error if the server closes the stream
	for {
		var msg interface{}
		err := stream.RecvMsg(&msg)
		if err != nil {
			break
		}
	}

	<-streamCtx.Done()

	log.Info().Msg("Container status channel closed")
}

func executeContainerDelete(ctx context.Context, req *agent.ContainerDeleteRequest, deleteFn ContainerDeleteFunc) {
	if deleteFn == nil {
		log.Error().Msg("Delete function not implemented")
		return
	}

	log.Info().Str("name", req.Name).Msg("Deleting container")

	err := deleteFn(ctx, req)
	if err != nil {
		log.Error().Stack().Err(err).Msg("Failed to delete multiple containers")
	}
}

func (cl *ClientLoop) executeClose(command *agent.CloseConnectionRequest) {
	closeFunc := cl.WorkerFuncs.Close

	if closeFunc == nil {
		log.Error().Msg("Close function not implemented")
		return
	}

	log.Debug().Str("reason", agent.CloseReason_name[int32(command.GetReason())]).Msg("gRPC connection remotely closed")

	err := closeFunc(cl.Ctx, command.Reason)
	if err != nil {
		log.Error().Stack().Err(err).Msg("Close handler error")
	}
}

func executeContainerCommand(ctx context.Context, command *agent.ContainerCommandRequest, containerCommandFunc ContainerCommandFunc) {
	if containerCommandFunc == nil {
		log.Error().Msg("Container command function not implemented")
		return
	}

	log.Info().
		Str("operation", command.Operation.String()).
		Str("name", command.Name).
		Msg("Executing")

	err := containerCommandFunc(ctx, command)
	if err != nil {
		log.Error().Stack().Err(err).Msg("Container Command error")
	}
}

func streamContainerLog(reader ContainerLogReader,
	client agent.Agent_ContainerLogClient,
	name string,
	streaming bool,
	logContext *ContainerLogContext,
) {
	for {
		event := <-reader.Next()
		if event.Error != nil {
			if event.Error == io.EOF && !streaming {
				log.Trace().Str("name", name).Msg("Container log finished non streaming (EOF)")
				break
			}

			if event.Error == context.Canceled {
				log.Trace().Str("name", name).Msg("Container log finished context cancel (server close)")
				break
			}

			log.Error().Err(event.Error).Stack().Str("name", name).Msg("Container log reader error")

			if client.Context().Err() == nil {
				err := client.CloseSend()
				if err != nil {
					log.Error().Err(err).Stack().Str("name", name).Msg("Failed to close client")
				}
			}

			break
		}

		if logContext.Echo {
			log.Debug().Str("name", name).Str("log", event.Message).Msg("Container log")
		}

		err := client.Send(&agent.ContainerLogMessage{
			Log: event.Message,
		})
		if err != nil {
			log.Error().Err(err).Stack().Str("name", name).Msg("Container log channel error")
			break
		}
	}
}

func executeContainerLog(ctx context.Context, command *agent.ContainerLogRequest, logFunc ContainerLogFunc) {
	if logFunc == nil {
		log.Error().Msg("Container log function not implemented")
		return
	}

	name := command.Name

	log.Debug().Str("name", name).Uint32("tail", command.GetTail()).
		Bool("stream", command.GetStreaming()).Msg("Getting container logs")

	streamCtx := metadata.AppendToOutgoingContext(ctx, "lens-container-name", name)

	stream, err := grpcConn.Client.ContainerLog(streamCtx, grpc.WaitForReady(true))
	if err != nil {
		log.Error().Err(err).Str("name", name).Msg("Failed to open container log channel")
		return
	}

	defer func() {
		err = stream.CloseSend()
		if err != nil {
			log.Error().Err(err).Stack().Str("name", name).Msg("Failed to close container log stream")
		}
	}()

	streamCtx = stream.Context()

	logContext, err := logFunc(streamCtx, command)
	if err != nil {
		log.Error().Err(err).Str("name", name).Msg("Failed to open container log reader")
		return
	}

	reader := logContext.Reader

	defer func() {
		err = reader.Close()
		if err != nil {
			log.Error().Err(err).Str("name", name).Msg("Failed to close container log reader")
		}
	}()

	go streamContainerLog(reader, stream, name, command.GetStreaming(), logContext)

	for {
		var msg interface{}
		err := stream.RecvMsg(&msg)
		if err != nil {
			break
		}
	}

	<-streamCtx.Done()

	log.Trace().Str("name", name).Msg("Container log exited")
}

func executeContainerInspect(ctx context.Context, command *agent.ContainerInspectRequest, inspectFunc ContainerInspectFunc) {
	if inspectFunc == nil {
		log.Error().Msg("Container inspect function not implemented")
		return
	}

	name := command.Name

	log.Info().Str("name", name).Msg("Getting container inspection")

	inspection, err := inspectFunc(ctx, command)
	if err != nil {
		log.Error().Stack().Err(err).Msg("Failed to inspect container")
	}

	resp := &agent.ContainerInspectMessage{
		Name:       name,
		Inspection: inspection,
	}

	_, err = grpcConn.Client.ContainerInspect(ctx, resp)
	if err != nil {
		log.Error().Stack().Err(err).Msg("Container inspection response error")
		return
	}
}

func WithGRPCConfig(parentContext context.Context, cfg any) context.Context {
	return context.WithValue(parentContext, contextConfigKey, cfg)
}

func GetConfigFromContext(ctx context.Context) any {
	return ctx.Value(contextConfigKey)
}
