// lib/verifyAuth.ts
import { NextRequest } from 'next/server'
import { verifyToken } from './jwt'

type Claims = { email?: string; [k: string]: unknown }

export function getEmailFromAuthHeader(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7).trim() // ตัด "Bearer "

  const decoded = verifyToken<Claims>(token) // T | null
  return decoded?.email ?? null
}
