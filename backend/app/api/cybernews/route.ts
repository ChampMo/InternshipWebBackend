import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { withCORS } from '@/lib/cors'
import { ObjectId } from 'mongodb'

// ✅ GET: ดึงทั้งหมด
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const news = await db.collection('Cyber news').find({}).toArray()
    return withCORS(NextResponse.json(news))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 }))
  }
}

// ✅ POST: สร้างข่าวใหม่
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    const result = await db.collection('Cyber news').insertOne(body)
    return withCORS(NextResponse.json({ insertedId: result.insertedId }))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'ไม่สามารถเพิ่มข่าวได้' }, { status: 500 }))
  }
}

// ✅ PUT: แก้ไขข่าว
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return withCORS(NextResponse.json({ error: 'ต้องระบุ id' }, { status: 400 }))
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    const result = await db.collection('Cyber news').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return withCORS(NextResponse.json({ modifiedCount: result.modifiedCount }))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'ไม่สามารถอัปเดตข่าวได้' }, { status: 500 }))
  }
}

// ✅ DELETE: ลบข่าว
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return withCORS(NextResponse.json({ error: 'ต้องระบุ id เพื่อลบ' }, { status: 400 }))
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    const result = await db.collection('Cyber news').deleteOne({ _id: new ObjectId(id) })
    return withCORS(NextResponse.json({ deletedCount: result.deletedCount }))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'ไม่สามารถลบข่าวได้' }, { status: 500 }))
  }
}

// ✅ OPTIONS: สำหรับ Preflight
export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}
