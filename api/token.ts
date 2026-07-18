import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AccessToken } from 'livekit-server-sdk'
import { customAlphabet } from 'nanoid'
import type { ApiErrorBody, TokenRequest, TokenResponse } from '../src/types/token.ts'

const MAX_NAME_LENGTH = 40
const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
const TOKEN_TTL_SECONDS = 60 * 60 * 2 // 2 hours

const identitySuffix = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)

function sendError(res: VercelResponse, status: number, code: string, message: string) {
  const body: ApiErrorBody = { error: { code, message } }
  res.status(status).json(body)
}

function parseBody(req: VercelRequest): Partial<TokenRequest> | null {
  if (req.body == null) return {}
  if (typeof req.body === 'object') return req.body as Partial<TokenRequest>
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Partial<TokenRequest>
    } catch {
      return null
    }
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    sendError(res, 405, 'method_not_allowed', 'Only POST requests are supported.')
    return
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const livekitUrl = process.env.LIVEKIT_URL

  if (!apiKey || !apiSecret || !livekitUrl) {
    console.error('LiveKit server environment variables are not configured')
    sendError(res, 500, 'server_misconfigured', 'The token service is not configured.')
    return
  }

  const body = parseBody(req)
  if (body === null) {
    sendError(res, 400, 'invalid_json', 'Request body must be valid JSON.')
    return
  }

  const roomId = typeof body.roomId === 'string' ? body.roomId.trim() : ''
  const participantName = typeof body.participantName === 'string' ? body.participantName.trim() : ''

  if (!roomId) {
    sendError(res, 400, 'invalid_room_id', 'roomId is required.')
    return
  }
  if (!ROOM_ID_PATTERN.test(roomId)) {
    sendError(res, 400, 'invalid_room_id', 'roomId contains invalid characters.')
    return
  }
  if (!participantName) {
    sendError(res, 400, 'invalid_participant_name', 'participantName is required.')
    return
  }
  if (participantName.length > MAX_NAME_LENGTH) {
    sendError(
      res,
      400,
      'invalid_participant_name',
      `participantName must be ${MAX_NAME_LENGTH} characters or fewer.`,
    )
    return
  }

  try {
    const accessToken = new AccessToken(apiKey, apiSecret, {
      // Identity must be unique per room; the display name is kept separate
      // so two people can share the same display name without colliding.
      identity: `${participantName}-${identitySuffix()}`,
      name: participantName,
      ttl: TOKEN_TTL_SECONDS,
    })

    accessToken.addGrant({
      room: roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    })

    const token = await accessToken.toJwt()
    const responseBody: TokenResponse = { token }
    res.status(200).json(responseBody)
  } catch (err) {
    console.error('Failed to generate LiveKit token:', err)
    sendError(res, 500, 'token_generation_failed', 'Could not generate a token.')
  }
}
