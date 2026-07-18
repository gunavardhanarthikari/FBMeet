// Developer verification for the /api/token endpoint.
//
// Usage: run `vercel dev` (serves /api on http://localhost:3000), then in
// another terminal: npm run verify:token
//
// This intentionally never logs or decodes the JWT itself — only whether
// a token was successfully received.

const baseUrl = process.env.VERIFY_TOKEN_BASE_URL ?? 'http://localhost:3000'

async function main() {
  const response = await fetch(`${baseUrl}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId: 'verify-room', participantName: 'Verifier' }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error(`✗ Token request failed (${response.status}): ${data?.error?.message ?? 'unknown error'}`)
    process.exit(1)
  }

  if (typeof data.token !== 'string' || data.token.length === 0) {
    console.error('✗ Response did not include a token')
    process.exit(1)
  }

  console.log('✓ Token received')
}

main().catch((err) => {
  console.error('✗ Could not reach the token endpoint:', err.message)
  process.exit(1)
})
