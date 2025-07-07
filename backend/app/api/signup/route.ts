// app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { registerSchema } from "@/lib/validators/registerSchema";
import bcrypt from "bcrypt";



export async function POST(req: NextRequest) {
  const data = await req.json();
    
    const parsed = registerSchema.parse(data);
    const { email, password } = parsed;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const users = db.collection("Users");
    // ✅ ตรวจสอบว่า email ซ้ำหรือไม่
    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

  try {

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
