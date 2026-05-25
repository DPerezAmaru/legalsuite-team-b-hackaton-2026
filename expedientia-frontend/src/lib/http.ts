import type { ZodType } from 'zod'

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestConfig<T> {
  method?: HttpMethod
  body?: unknown
  schema?: ZodType<T>
  signal?: AbortSignal
  headers?: HeadersInit
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string; error?: string }
    return data?.message ?? data?.error ?? `Error ${res.status}`
  } catch {
    return `Error ${res.status}`
  }
}

function buildRequestInit(
  method: HttpMethod,
  body: unknown,
  headers: HeadersInit | undefined,
  signal: AbortSignal | undefined,
): RequestInit {
  const hasBody = body !== undefined && body !== null
  if (!hasBody) return { method, headers, signal }

  if (body instanceof FormData) {
    return { method, body, headers, signal }
  }

  return {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
    signal,
  }
}

export async function request<T = unknown>(
  url: string,
  { method = 'GET', body, schema, signal, headers }: RequestConfig<T> = {},
): Promise<T> {
  const res = await fetch(url, buildRequestInit(method, body, headers, signal))

  if (!res.ok) throw new HttpError(res.status, await readError(res))
  if (res.status === 204) return undefined as T

  const json: unknown = await res.json()
  return schema ? schema.parse(json) : (json as T)
}
