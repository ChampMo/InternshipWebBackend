import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'

export async function GET() {
    console.log("✅ Mongo URI:", process.env.MONGODB_URI)

  const client = await clientPromise
  const db = client.db('cyber_web_backend') // เปลี่ยนเป็นชื่อฐานข้อมูลของคุณ
  const collection = db.collection('Users')

  const data = await collection.find({}).limit(10).toArray()

  return NextResponse.json({ data })
}