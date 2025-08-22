// lib/jwt.ts
import jwt, { type SignOptions, type Secret, type JwtPayload } from 'jsonwebtoken'

const secretEnv = process.env.JWT_SECRET
if (!secretEnv) {
  throw new Error('JWT_SECRET environment variable is not defined')
}
const secret: Secret = secretEnv

export function signToken(
  payload: Record<string, unknown>,
  // ใช้ชนิดตาม jsonwebtoken เพื่อไม่ให้ TS ฟ้อง
  expiresIn: SignOptions['expiresIn'] = '7d'
) {
  const options: SignOptions = { expiresIn }
  return jwt.sign(payload, secret, options)
}

export function verifyToken<T extends object = JwtPayload>(token: string): T | null {
  try {
    return jwt.verify(token, secret) as T
  } catch {
    return null
  }
}
