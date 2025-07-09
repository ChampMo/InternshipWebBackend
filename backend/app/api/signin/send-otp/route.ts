import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'
import { sendOTP } from '@/lib/otp'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
    console.log('Received email:', email)
  if (!email) {
    return withCORS(NextResponse.json({ message: 'Email is required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const users = db.collection('Users')

  const user = await users.findOne({ email: email.toLowerCase() })
  if (!user) {
    return withCORS(NextResponse.json({ message: 'Invalid email' }, { status: 404 }))
  }

  try {
    await sendOTP(email)
    return withCORS(NextResponse.json({ message: 'OTP sent successfully' }))
  } catch (error) {
    return withCORS(NextResponse.json({ message: 'Failed to send OTP', error: error }, { status: 500 }))
  }
}
