// Same dark-teal palette used for mock participants, reused so real remote
// participants get a stable (but arbitrary) tile background per identity.
const SEED_COLORS = ['#0f423d', '#123a44', '#0d3336', '#15413c', '#0e3a3f', '#103031', '#123c3a']

export function getParticipantSeedColor(identity: string): string {
  let hash = 0
  for (let i = 0; i < identity.length; i++) {
    hash = (hash * 31 + identity.charCodeAt(i)) | 0
  }
  return SEED_COLORS[Math.abs(hash) % SEED_COLORS.length]
}
