// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  const { email, password, accountType } = await req.json()

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const users = db.collection('Users')

  let user = await users.findOne({ email })

  if (accountType === 'google') {

    if (!user) {
      const newUser = {
        email,
        name: email.split('@')[0],
        password: null, // google login ไม่มีรหัสผ่าน
        createdAt: new Date(),
        accountType: 'google'
      }
      const result = await users.insertOne(newUser)
      user = { ...newUser, _id: result.insertedId }
      

      const token = signToken({ email: user.email, name: user.name })

      return NextResponse.json({
        message: 'Google login successful',
        token,
        user: { name: user.name, email: user.email }
      })
    }else if (user.accountType === 'google') {
      // ✅ ถ้ามี user แล้ว ให้ส่ง token กลับไป
      const token = signToken({ email: user.email, name: user.name })

      return NextResponse.json({
        message: 'Google login successful',
        token,
        user: { name: user.name, email: user.email }
      })
    }else{
      // ✅ ถ้า user มี accountType อื่น ให้แจ้งว่าไม่สามารถใช้ Google login ได้
      return NextResponse.json({ error: 'This account is not registered with Google' }, { status: 401 })
    }
    
  } else {
    if (!user) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 401 })
    }
    if (user.accountType !== 'default') {
      return NextResponse.json({ error: 'This account is not registered with email/password' }, { status: 401 })
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
