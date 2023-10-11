SHELL = /bin/sh

GO_PACKAGE = github.com/dyrector-io/darklens/protobuf/go
AGENT_IMAGE := ghcr.io/dyrector-io/darklens/agent

IMAGE_VERSION ?= latest

GOARCHS?=amd64 arm64

GOOS?=linux
ifeq ($(GOOS),windows)
	OUT_EXT=.exe
endif

GOPARAMS:= CGO_ENABLED=0

PACKAGE := github.com/dyrector-io/darklens/golang
LDFLAGS := -ldflags "-X '${PACKAGE}/internal/version.BuildTimestamp=${BUILD_TIMESTAMP}'\
  -X '${PACKAGE}/internal/version.CommitHash=${ORG_GOLANG_HASH}'\
  -extldflags '-static'"

.PHONY: binfmt
binfmt:
	docker run --privileged --rm tonistiigi/binfmt --install arm64,amd64

.PHONY: protogen
protogen:| protogen-agent protogen-backend

.PHONY: protogen-backend
protogen-backend:
	MSYS_NO_PATHCONV=1 docker run --rm -u ${UID}:${GID} -v ${PWD}:/usr/work ghcr.io/dyrector-io/dyrectorio/alpine-proto:3.17-4 ash -c "\
		mkdir -p ./web/backend/src/grpc && \
		protoc \
			--experimental_allow_proto3_optional \
			--plugin=/usr/local/lib/node_modules/ts-proto/protoc-gen-ts_proto \
			--ts_proto_opt=nestJs=true \
			--ts_proto_opt=addNestjsRestParameter=true \
			--ts_proto_opt=outputJsonMethods=true \
			--ts_proto_opt=addGrpcMetadata=true \
			--ts_proto_out=./web/backend/src/grpc \
			protobuf/proto/*.proto" && \
	cp -r protobuf/proto web/backend/ && \
	cd ./web/backend/src/grpc && \
	npx prettier -w "./**.ts"

.PHONY: protogen-agent
protogen-agent:
	MSYS_NO_PATHCONV=1 docker run --rm -u ${UID}:${GID} -v ${PWD}:/usr/work ghcr.io/dyrector-io/dyrectorio/alpine-proto:3.17-4 ash -c "\
		mkdir -p protobuf/go && \
		protoc -I. \
			--go_out /tmp \
			--go_opt module=$(REMOTE) \
			--go-grpc_out /tmp \
			--go-grpc_opt module=$(REMOTE) \
			protobuf/proto/*.proto && \
		cp -r /tmp/${GO_PACKAGE}/* ./protobuf/go"

.PHONY: compile-agent
compile-agent:
	cd agent/cmd && \
	$(foreach arch, $(GOARCHS), $(foreach os, $(GOOS), ${GOPARAMS} GOARCH=$(arch) GOOS=${os} go build ${LDFLAGS} -o ../build/agent-${os}-${arch}${OUT_EXT};))

.PHONY: build-agent
build-agent: compile-agent
	cd agent/build && \
	docker buildx build --build-arg AGENT_BINARY=agent --build-arg REVISION=${ORG_GOLANG_HASH} --platform=linux/amd64 --load -t ${AGENT_IMAGE}:$(IMAGE_VERSION) .
