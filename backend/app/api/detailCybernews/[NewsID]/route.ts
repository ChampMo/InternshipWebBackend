import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { withCORS } from '@/lib/cors'

// ใช้ MongoDB → ให้ชัดเจนว่าใช้ Node runtime
export const runtime = 'nodejs'
// (ทางเลือก) ใกล้ไทย: export const preferredRegion = ['sin1'] as const

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ NewsID: string }> }
) {
  try {
    const { NewsID } = await params

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    const news = await db.collection('Cyber news').findOne({ NewsID })
    if (!news) {
      return withCORS(NextResponse.json({ error: 'ไม่พบข่าวสำหรับรหัสนี้' }, { status: 404 }))
    }

    let tagName: string | null = null
    if (news.tag) {
      const tagDoc = await db.collection('Tags').findOne({ tagId: news.tag })
      tagName = (tagDoc?.tagName as string) ?? null
    }

    return withCORS(NextResponse.json({ ...news, tagName }))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 }))
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ NewsID: string }> }
) {
  try {
    const { NewsID } = await params
    const body = await req.json()

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    const result = await db.collection('Cyber news').updateOne(
      { NewsID },
      { $set: body }
    )

    if (result.matchedCount === 0) {
      return withCORS(NextResponse.json({ error: 'ไม่พบข่าวสำหรับรหัสนี้' }, { status: 404 }))
    }

    return withCORS(NextResponse.json({ message: 'อัปเดตข่าวสำเร็จ' }))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 }))
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ NewsID: string }> }
) {
  try {
    const { NewsID } = await params

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    const result = await db.collection('Cyber news').deleteOne({ NewsID })
    if (result.deletedCount === 0) {
      return withCORS(NextResponse.json({ error: 'ไม่พบข่าวสำหรับรหัสนี้' }, { status: 404 }))
    }

    return withCORS(NextResponse.json({ message: 'ลบข่าวสำเร็จ' }))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 }))
  }
}

export function OPTIONS() {
  // ตอบ preflight; 204 ก็ได้ จะสะอาดสุด
  return withCORS(new NextResponse(null, { status: 204 }))
}
