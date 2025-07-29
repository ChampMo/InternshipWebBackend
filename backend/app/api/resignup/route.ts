// app/api/register/route.ts

import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { registerSchema } from '@/lib/validators/registerSchema'
import bcrypt from 'bcrypt'
import { withCORS } from '@/lib/cors'
import { v4 as uuidv4 } from 'uuid'
import { sendAccount } from '@/lib/account'
import { send } from 'process'
import { tr } from 'zod/v4/locales'

// ✅ ตั้งค่าตรง origin ที่คุณอนุญาต (เช่นเฉพาะ frontend localhost)
export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}


// ✅ สำหรับ Register API (POST)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const parsed = registerSchema.parse(data)
    const { email, role, company } = parsed
    console.log('Received registration data:',  email, role, company)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const users = db.collection('Users')

    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const password = generatePassword();

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      userId: uuidv4(),
      email:email.toLowerCase(),
      password: hashedPassword,
      role: role,
      company: company,
      createdAt: new Date()
    }

    const existingUser = await users.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      await users.updateOne(
        { email: email.toLowerCase() },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
    }
    const resultmail = await sendAccount(email, password)
    return withCORS(NextResponse.json({
      message: 'User registered successfully',
      sendMail: resultmail ? true : false
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
