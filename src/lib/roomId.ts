import { customAlphabet } from 'nanoid'

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
const generate = customAlphabet(alphabet, 6)

export function generateRoomId(): string {
  return generate()
}
