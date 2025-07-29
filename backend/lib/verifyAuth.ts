// lib/verifyAuth.ts
import { NextRequest } from 'next/server'
import { verifyToken } from './jwt'

/**
 * ตรวจสอบ Authorization header และถอดรหัส token
 * @param req NextRequest
 * @returns email string ถ้าถูกต้อง, otherwise null
 */
export function getEmailFromAuthHeader(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.split(' ')[1]

  try {
    const decoded = verifyToken(token)
    return decoded.email || null
  } catch (err) {
    return null
  }
}
