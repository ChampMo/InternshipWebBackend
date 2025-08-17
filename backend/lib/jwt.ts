// lib/jwt.ts
import jwt from 'jsonwebtoken'

const secret: jwt.Secret = process.env.JWT_SECRET as string

if (!secret) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

export function signToken(payload: Record<string, any>, expiresIn: string = '7d') {
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, secret)
  } catch (err) {
    return null
  }
}
