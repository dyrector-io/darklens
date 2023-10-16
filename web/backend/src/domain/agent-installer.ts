import { ConfigService } from '@nestjs/config'
import { readFileSync } from 'fs'
import Handlebars from 'handlebars'
import { join } from 'path'
import { cwd } from 'process'
import {
  CruxBadRequestException,
  CruxPreconditionFailedException,
  CruxUnauthorizedException,
} from 'src/exception/crux-exception'
import { JWT_EXPIRATION_MILLIS } from 'src/shared/const'
import { getAgentVersionFromPackage } from 'src/shared/package'
import { Agent, AgentOptions } from './agent'
import { AgentToken } from './agent-token'
import { BasicNode, NodeScriptType } from './node'

export type AgentInstallerOptions = {
  token: AgentToken
  signedToken: string
  scriptType: NodeScriptType
}

export default class AgentInstaller {
  private scriptCompiler: ScriptCompiler

  private readonly expirationDate: Date

  constructor(
    private readonly configService: ConfigService,
    readonly node: BasicNode,
    private readonly options: AgentInstallerOptions,
  ) {
    this.scriptCompiler = this.loadScriptAndCompiler(this.options.scriptType)

    this.expirationDate = new Date(options.token.iat * 1000 + JWT_EXPIRATION_MILLIS)
  }

  get expireAt(): Date {
    return this.expirationDate
  }

  get expired(): boolean {
    const now = new Date()
    return now.getTime() - this.expirationDate.getTime() > JWT_EXPIRATION_MILLIS
  }

  getScript(): string {
    const disableForcePull = this.configService.get<boolean>('AGENT_INSTALL_SCRIPT_DISABLE_PULL', false)
    const agentImageTag = this.configService.get<string>('AGENT_IMAGE', getAgentVersionFromPackage(this.configService))

    const installScriptParams: InstallScriptConfig = {
      name: this.node.name.toLowerCase().replace(/\s/g, ''),
      token: this.options.signedToken,
      disableForcePull,
      agentImageTag,
    }

    return this.scriptCompiler.compile(installScriptParams)
  }

  complete(agentOptions: Omit<AgentOptions, 'outdated'>) {
    this.throwIfExpired()

    const { connection } = agentOptions

    if (this.options.signedToken !== connection.jwt) {
      throw new CruxUnauthorizedException({
        message: 'Invalid token.',
      })
    }

    const agent = new Agent({
      ...agentOptions,
      outdated: false,
    })

    return agent
  }

  private loadScriptAndCompiler(scriptType: NodeScriptType): ScriptCompiler {
    const extension = this.getInstallScriptExtension(scriptType)
    const agentFilename = `install-docker${extension}.hbr`
    const scriptFile = readFileSync(join(cwd(), 'assets', 'install-script', agentFilename), 'utf8')

    return {
      compile: Handlebars.compile(scriptFile),
      file: scriptFile,
    }
  }

  private throwIfExpired() {
    if (this.expired) {
      throw new CruxPreconditionFailedException({
        message: 'Install script expired',
        property: 'expireAt',
      })
    }
  }

  private getInstallScriptExtension(scriptType: NodeScriptType): string {
    switch (scriptType) {
      case 'shell':
        return '.sh'
      case 'powershell':
        return '.ps1'
      default:
        throw new CruxBadRequestException({
          message: 'Unknown script type',
          property: 'scriptType',
          value: scriptType,
        })
    }
  }
}

export type InstallScriptConfig = {
  name: string
  token: string
  agentImageTag: string
  disableForcePull?: boolean
}

export type ScriptCompiler = {
  file: Buffer | string
  compile: Handlebars.TemplateDelegate
}
