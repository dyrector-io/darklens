import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger'

const createSwaggerConfig = (configService: ConfigService): Omit<OpenAPIObject, 'paths'> =>
  new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation.')
    .setVersion(configService.get<string>('npm_package_version'))
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Bearer',
        description: 'Please enter token in following format: ',
      },
      'jwt',
    )
    .addTag(
      'nodes',
      'Nodes are the deployment targets. Nodes are registered by installing at least one of the agents - crane for Kubernetes, dagent for Docker. These agents connect the platform to your node. One team can have as many nodes as they like.</br></br>Node installation takes place with Shell or PowerShell scripts, which can be created or revoked. More details in dyrector.io platform [documentation](https://docs.dyrector.io/get-started/components#node).',
    )
    .addTag(
      'health',
      'Health refers to the status of the different services that make up the platform. It can be checked to see if the platform works properly.',
    )
    .build()

export default createSwaggerConfig
