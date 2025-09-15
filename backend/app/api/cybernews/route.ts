import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

// ✅ GET: ดึงทั้งหมด
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const news = await db.collection('Cyber news').find({}).toArray()
    const tags = await db.collection('Tags').find({}).toArray()
    
    // map tagId => tagName
    const tagMap = new Map<string, string>()
    tags.forEach(tag => {
      tagMap.set(tag.tagId, tag.tagName)
    })
    
    return withCORS(NextResponse.json(news.map(item => ({
      ...item,
      // รองรับทั้ง single tag และ multiple tags
      tags: Array.isArray(item.tags) 
        ? item.tags.map(tagId => tagMap.get(tagId) || tagId)
        : item.tag ? [tagMap.get(item.tag) || item.tag] : []
    }))))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 }))
  }
}

// ✅ POST: สร้างข่าวใหม่
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      title,
      tags, // รับเป็น array ของ tagId
      tag,  // รองรับ single tag เดิม
      Summary,
      Detail,
      Impact,
      Advice,
      NewsID,
      imgUrl
    } = body

    if (!title || (!tags && !tag) || !Summary || !Detail || !Impact || !Advice || !NewsID || !imgUrl) {
      return withCORS(NextResponse.json({ error: 'กรุณาระบุข้อมูลให้ครบถ้วน' }, { status: 400 }))
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    // รองรับทั้ง multiple tags และ single tag
    let finalTags = []
    if (tags && Array.isArray(tags)) {
      // กรณีส่ง array ของ tagId มา
      finalTags = tags
    } else if (tag) {
      // กรณีส่ง single tag มา (backward compatibility)
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

    const newNews = {
      title,
      tags: finalTags, // เก็บเป็น array ของ tagId
      Summary,
      Detail,
      Impact,
      Advice,
      NewsID,
      imgUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('Cyber news').insertOne(newNews)
    return withCORS(NextResponse.json({ insertedId: result.insertedId }))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'ไม่สามารถเพิ่มข่าวได้' }, { status: 500 }))
  }
}

// ✅ PUT: แก้ไขข่าว
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, tags, tag, ...updateData } = body

    if (!id) {
      return withCORS(NextResponse.json({ error: 'ต้องระบุ id' }, { status: 400 }))
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    // รองรับทั้ง multiple tags และ single tag
    let finalTags = []
    if (tags && Array.isArray(tags)) {
      finalTags = tags
    } else if (tag) {
      if (typeof tag === 'string' && tag.length !== 36) {
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

    updateData.tags = finalTags
    updateData.updatedAt = new Date()

    const result = await db.collection('Cyber news').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return withCORS(NextResponse.json({ error: 'ไม่พบข่าวที่ต้องการอัปเดต' }, { status: 404 }))
    }

    // ดึงข่าวที่อัปเดตแล้วและแปลง tags เป็น tagNames
    const updatedNews = await db.collection('Cyber news').findOne({ _id: new ObjectId(id) })
    
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