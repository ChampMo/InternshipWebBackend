// app/api/register/route.ts

import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { registerSchema } from '@/lib/validators/registerSchema'
import bcrypt from 'bcrypt'
import { withCORS } from '@/lib/cors'
import { v4 as uuidv4 } from 'uuid'

// ✅ ตั้งค่าตรง origin ที่คุณอนุญาต (เช่นเฉพาะ frontend localhost)
export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}


// ✅ สำหรับ Register API (POST)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const parsed = registerSchema.parse(data)
    const { email, password, accountType } = parsed

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const users = db.collection('Users')

    const existing = await users.findOne({ email:email.toLowerCase() })
    if (existing) {
      return withCORS(NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      ))
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      userId: uuidv4(),
      email:email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      accountType: accountType
    }

    const result = await users.insertOne(newUser)

    return withCORS(NextResponse.json({
      message: 'User registered',
      id: result.insertedId
    }))
  } catch (error: any) {
    return withCORS(NextResponse.json(
      {
        error: 'Invalid input',
        detail: error?.errors || error.message || 'Unknown error',
      },
      { status: 400 }
    ))
  }
}
