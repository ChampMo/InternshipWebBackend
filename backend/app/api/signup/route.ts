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
    const roles = db.collection('Roles')
    const companies = db.collection('Companies')

    const existing = await users.findOne({ email:email.toLowerCase() })
    if (existing) {
      return withCORS(NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      ))
    }
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

    const existingRole = await roles.findOne({ roleName: role })
    if (!existingRole) {
      return withCORS(NextResponse.json(
        { message: 'Role not found' },
        { status: 400 }
      ))
    }

    const existingCompany = await companies.findOne({ companyName: company })

    if (!existingCompany) {
      return withCORS(NextResponse.json(
        { message: 'Role not found' },
        { status: 400 }
      ))
    }
    const newUser = {
      userId: uuidv4(),
      email:email.toLowerCase(),
      password: hashedPassword,
      roleId: existingRole.roleId,
      companyId: existingCompany.companyId,
      createdAt: new Date()
    }

    const result = await users.insertOne(newUser)
    const resultmail = await sendAccount(email, password)
    return withCORS(NextResponse.json({
      message: 'Registration successful',
      sendMail: resultmail ? true : false,
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
