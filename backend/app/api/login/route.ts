// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  const { email, password, accountType, name } = await req.json()

  const client = await clientPromise
  const db = client.db('cyber_web_backend')
  const users = db.collection('Users')

  let user = await users.findOne({ email })

  if (accountType === 'google') {
    if (!user) {
      // 🔄 สมัครใหม่ทันทีถ้าไม่มี user
      const newUser = {
        email,
        name: name || email.split('@')[0],
        password: null, // google login ไม่มีรหัสผ่าน
        createdAt: new Date(),
        accountType: 'google'
      }

      const result = await users.insertOne(newUser)
      user = { ...newUser, _id: result.insertedId }
    }

    const token = signToken({ email: user.email, name: user.name })

    return NextResponse.json({
      message: 'Google login successful',
      token,
      user: { name: user.name, email: user.email }
    })
  } else {
    if (!user) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 401 })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = signToken({ email: user.email, name: user.name })

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: { name: user.name, email: user.email }
    })
  }
}
