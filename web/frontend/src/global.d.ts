declare namespace NodeJS {
  export interface Global {
    serviceStatus: DyoServiceStatusCheckers | undefined
  }
}
