// lib/jwt.ts
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'dev_secret'

export function signToken(payload: object, expiresIn = '7d') {
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, secret)
  } catch (err) {
    return null
  }
}
