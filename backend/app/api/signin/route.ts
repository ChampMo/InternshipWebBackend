import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import bcrypt from 'bcrypt'
import clientPromise from '@/lib/mongodb'
import { signToken } from '@/lib/jwt'
import { error } from 'console'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const users = db.collection('Users')

  const user = await users.findOne({ email })
  if (!user) {
    return withCORS(NextResponse.json({ message: 'Invalid email' }, { status: 401 }))
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return withCORS(NextResponse.json({ message: 'Invalid password' }, { status: 401 }))
  }

  const token = signToken({ email: user.email, name: user.name })

  return withCORS(NextResponse.json({
    message: 'Login successful',
    token,
    user: { name: user.name, email: user.email }
  }))
}
