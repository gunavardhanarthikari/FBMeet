import type { ApiErrorBody, TokenRequest, TokenResponse } from '@/types/token'

const TOKEN_ENDPOINT = '/api/token'
const REQUEST_TIMEOUT_MS = 10_000

export class TokenRequestError extends Error {
  readonly code: string

  constructor(message: string, code = 'unknown_error') {
    super(message)
    this.name = 'TokenRequestError'
    this.code = code
  }
}

function isTokenResponse(value: unknown): value is TokenResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<TokenResponse>).token === 'string'
  )
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<ApiErrorBody>).error === 'object' &&
    (value as Partial<ApiErrorBody>).error !== null
  )
}

/**
 * Requests a LiveKit access token for the given room/participant from the
 * server-side /api/token endpoint. Never touches LiveKit itself — this only
 * returns the JWT string, ready for a future `room.connect()` call.
 */
export async function requestToken(roomId: string, participantName: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    const payload: TokenRequest = { roomId, participantName }
    response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new TokenRequestError('The request timed out. Please try again.', 'timeout')
    }
    throw new TokenRequestError(
      'Could not reach the token service. Check your connection.',
      'network_error',
    )
  } finally {
    clearTimeout(timeoutId)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new TokenRequestError(
      'Received an invalid response from the server.',
      'invalid_response',
    )
  }

  if (!response.ok) {
    if (isApiErrorBody(data)) {
      throw new TokenRequestError(data.error.message, data.error.code)
    }
    throw new TokenRequestError('Failed to get a meeting token.', 'unknown_error')
  }

  if (!isTokenResponse(data)) {
    throw new TokenRequestError(
      'Received an invalid response from the server.',
      'invalid_response',
    )
  }

  return data.token
}
