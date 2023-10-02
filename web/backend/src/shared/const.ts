import { coerce } from 'semver'

export const PRODUCTION = 'production'

export const JWT_EXPIRATION_MILLIS = 10 * 60 * 1000 // 10 minutes
export const CONTAINER_DELETE_TIMEOUT = 1000 // millis
export const DEFAULT_CONTAINER_LOG_TAIL = 40

// NOTE(@m8vago): This should be incremented, when a new release includes a proto file change
const AGENT_PROTO_COMPATIBILITY_MINIMUM_VERSION = '0.8.1'
export const AGENT_SUPPORTED_MINIMUM_VERSION = coerce(AGENT_PROTO_COMPATIBILITY_MINIMUM_VERSION)

export const API_CREATED_LOCATION_HEADERS = {
  Location: {
    description: 'URL of the created object.',
    schema: {
      type: 'string',
    },
  },
}

export const UID_MAX = 2147483647
