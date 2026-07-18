export interface TokenRequest {
  roomId: string
  participantName: string
}

export interface TokenResponse {
  token: string
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}
