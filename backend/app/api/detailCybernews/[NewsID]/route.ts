import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '../../../../lib/mongodb'
import { withCORS } from '../../../../lib/cors'

export async function GET(
  req: NextRequest,
  { params }: { params: { NewsID: string } }
) {
  try {
    console.log('Received NewsID:', params.NewsID); // Debug log

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    // ค้นหาข่าวโดยตรงด้วย string NewsID
    const news = await db.collection('Cyber news').findOne({ NewsID: params.NewsID })

    console.log('News found:', news); // Debug log

    if (!news) {
      return withCORS(
        NextResponse.json({ error: 'ไม่พบข่าวสำหรับรหัสนี้' }, { status: 404 })
      )
    }

    return withCORS(NextResponse.json(news))
  } catch (e) {
    console.error('Error fetching news:', e)
    return withCORS(
      NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
    )
  }
}

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}
