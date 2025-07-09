import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcrypt'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return withCORS(NextResponse.json({ message: 'Email and new password are required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const users = db.collection('Users')

  const user = await users.findOne({ email: email.toLowerCase() })
  if (!user) {
    return withCORS(NextResponse.json({ message: 'Invalid email' }, { status: 404 }))
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  
  await users.updateOne({ email: email.toLowerCase() }, { $set: { password: hashedPassword } })

  return withCORS(NextResponse.json({ message: 'Password reset successfully' }))
}
