// app/api/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { withCORS } from '@/lib/cors'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json()

  if (!email || !otp) {
    return withCORS(NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const otps = db.collection('OTPs')

  const record = await otps.findOne({ email, otp })

  if (!record) {
    return withCORS(NextResponse.json({ message: 'Invalid OTP' }, { status: 401 }))
  }

  const now = new Date()
  if (now > new Date(record.expiresAt)) {
    return withCORS(NextResponse.json({ message: 'OTP expired' }, { status: 410 }))
  }

  // ✅ OTP ใช้งานได้
  await otps.deleteMany({ email }) // ลบออกหลังยืนยัน

  return withCORS(NextResponse.json({ message: 'OTP verified successfully' }))
}
