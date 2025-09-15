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

    // รองรับ multi-tag system
    let tagNames: string[] = []
    
    // ตรวจสอบว่ามี tags field (array ของ tagId)
    if (news.tags && Array.isArray(news.tags)) {
      const tagsCollection = db.collection('Tags')
      const tagDocs = await tagsCollection.find({ 
        tagId: { $in: news.tags } 
      }).toArray()
      tagNames = tagDocs.map(tagDoc => tagDoc.tagName)
    }
    // รองรับ legacy single tag field
    else if (news.tag) {
      const tagDoc = await db.collection('Tags').findOne({ tagId: news.tag })
      if (tagDoc) {
        tagNames = [tagDoc.tagName]
      }
    }

    return withCORS(NextResponse.json({ 
      ...news, 
      tagNames, // ส่ง tagNames array กลับไป
      tagName: tagNames[0] || null // เก็บ legacy support
    }))
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
    const { tags, tag, ...updateData } = body

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    // ประมวลผล tags
    let finalTags = []
    if (tags && Array.isArray(tags)) {
      finalTags = tags
    } else if (tag) {
      // รองรับ single tag
      if (typeof tag === 'string' && tag.length !== 36) {
        // ถ้าเป็น tagName ให้แปลงเป็น tagId
        const tagsCol = await db.collection('Tags')
        const tagDoc = await tagsCol.findOne({ tagName: tag })
        if (!tagDoc) {
          return withCORS(NextResponse.json({ error: 'Tag not found' }, { status: 404 }))
        }
        finalTags = [tagDoc.tagId]
      } else {
        finalTags = [tag]
      }
    }

    // เตรียมข้อมูลสำหรับ update
    const updateFields = {
      ...updateData,
      tags: finalTags,
      updatedAt: new Date()
    }

    // ลบ fields ที่ไม่ต้องการ
    delete updateFields.NewsID
    delete updateFields.id

    const result = await db.collection('Cyber news').updateOne(
      { NewsID },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return withCORS(NextResponse.json({ error: 'ไม่พบข่าวสำหรับรหัสนี้' }, { status: 404 }))
    }

    // ดึงข่าวที่อัปเดตแล้วและแปลง tags เป็น tagNames
    const updatedNews = await db.collection('Cyber news').findOne({ NewsID })
    
    if (updatedNews) {
      // ดึง tag names จาก tag collection
      let tagNames = []
      if (updatedNews.tags && Array.isArray(updatedNews.tags)) {
        const tagsCollection = db.collection('Tags')
        const tagDocs = await tagsCollection.find({ 
          tagId: { $in: updatedNews.tags } 
        }).toArray()
        tagNames = tagDocs.map(tagDoc => tagDoc.tagName)
      }

      // ส่งข้อมูลข่าวที่อัปเดตแล้วพร้อม tagNames
      return withCORS(NextResponse.json({ 
        ...updatedNews, 
        tagNames,
        message: 'อัปเดตข่าวสำเร็จ' 
      }))
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
