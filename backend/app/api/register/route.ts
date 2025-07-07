// app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { z } from "zod";

// Schema ตรวจสอบ input
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const data = await req.json();
    
  try {
    // ✅ Validate input ด้วย Zod
    const parsed = RegisterSchema.parse(data);
    const { email, password } = parsed;
    const client = await clientPromise;
    const db = client.db("cyber_web_backend");
    const users = db.collection("Users");
    console.log('Registering user:', email);
    // ✅ ตรวจสอบว่า email ซ้ำหรือไม่
    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // ✅ เข้ารหัส password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      createdAt: new Date(),
      accountType: 'default'
    };

    // ✅ บันทึกลง MongoDB
    const result = await users.insertOne(newUser);

    return NextResponse.json({
      message: "User registered",
      id: result.insertedId,
    });
  } catch (error: any) {
    // ✅ แสดงรายละเอียด error ถ้า validate ไม่ผ่าน
    return NextResponse.json(
      {
        error: "Invalid input",
        detail: error?.errors || error.message || "Unknown error",
      },
      { status: 400 }
    );
  }
}
