SHELL = /bin/sh

.PHONY: protogen
protogen:
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
