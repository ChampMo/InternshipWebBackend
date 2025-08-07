import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcrypt'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

export async function POST(req: NextRequest) {
  const { userId, oldPassword, password } = await req.json()
  
  if (!userId || !oldPassword || !password) {
    return withCORS(NextResponse.json({ message: 'User ID, old password, and new password are required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const users = db.collection('Users')
  
  const user = await users.findOne({ userId })
  if (!user) {
    return withCORS(NextResponse.json({ message: 'User not found' }, { status: 404 }))
  }
  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
  if (!isOldPasswordValid) {
    return withCORS(NextResponse.json({ message: 'Old password is incorrect' }, { status: 401 }))
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  await users.updateOne({ userId }, { $set: { password: hashedPassword } })

  return withCORS(NextResponse.json({ message: 'Password reset successfully' }))
}
