import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '../../../../lib/mongodb'
import { withCORS } from '../../../../lib/cors'


export async function GET(
  req: NextRequest,
  context: any
) {
  try {
    const { params } = await context
    const NewsID = params.NewsID

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    const news = await db.collection('Cyber news').findOne({ NewsID })

    if (!news) {
      return withCORS(
        NextResponse.json({ error: 'ไม่พบข่าวสำหรับรหัสนี้' }, { status: 404 })
      )
    }

    // ดึง tag name จาก collection Tags
    let tagName = null
    if (news.tag) {
      const tagDoc = await db.collection('Tags').findOne({ tagId: news.tag })
      tagName = tagDoc?.tagName ?? null
    }

    // ส่ง tagName กลับไปด้วย
    return withCORS(NextResponse.json({ ...news, tagName }))
  } catch (e) {
    return withCORS(
      NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { NewsID: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const body = await req.json()

    const result = await db.collection('Cyber news').updateOne(
      { NewsID: params.NewsID },
      { $set: body }
    )

    if (result.matchedCount === 0) {
      return withCORS(
        NextResponse.json({ error: 'ไม่พบข่าวสำหรับรหัสนี้' }, { status: 404 })
      )
    }

    return withCORS(
      NextResponse.json({ message: 'อัปเดตข่าวสำเร็จ' })
    )
  } catch (e) {
    console.error('Error updating news:', e)
    return withCORS(
      NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { NewsID: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    const result = await db.collection('Cyber news').deleteOne({ NewsID: params.NewsID })

    if (result.deletedCount === 0) {
      return withCORS(
        NextResponse.json({ error: 'ไม่พบข่าวสำหรับรหัสนี้' }, { status: 404 })
      )
    }

    return withCORS(
      NextResponse.json({ message: 'ลบข่าวสำเร็จ' })
    )
  } catch (e) {
    console.error('Error deleting news:', e)
    return withCORS(
      NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
    )
  }
}
export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}
