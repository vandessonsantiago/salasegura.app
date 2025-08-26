declare global {
  namespace Express {
    interface Request {
      body: unknown
      headers: {
        authorization?: string
        [key: string]: string | string[] | undefined
      }
      user?: unknown
    }

    interface Response {
      status(code: number): this
      json(body: unknown): this
      send(body: unknown): this
    }
  }
}

export {}
