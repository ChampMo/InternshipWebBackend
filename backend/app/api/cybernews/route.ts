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
      tagMap.set(tag.tagId, tag.tagName) // ใช้ tagId เป็น key
    })
    return withCORS(NextResponse.json(news.map(item => ({
      ...item,
      tag: tagMap.get(item.tag) || item.tag // แปลง tagId เป็น tagName
    }))))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 }))
  }
}

// ✅ POST: สร้างข่าวใหม่
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // ตรวจสอบและจัดรูปแบบ body ที่ต้องการ
    const {
      title,
      tag,
      Summary,
      Detail,
      Impact,
      Advice,
      NewsID,
      imgUrl
    } = body

    if (!title || !tag || !Summary || !Detail || !Impact || !Advice || !NewsID || !imgUrl) {
      return withCORS(NextResponse.json({ error: 'กรุณาระบุข้อมูลให้ครบถ้วน' }, { status: 400 }))
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const tags = await db.collection('Tags')
    const tagDoc = await tags.findOne({ tagName: tag })
      if (!tagDoc) {
        return withCORS(NextResponse.json({ error: 'Tag not found' }, { status: 404 }))
      }

      const newNews = {
        title,
        tag: tagDoc.tagId, // หรือจะใช้ tagName ก็ได้
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
    const { id, tag, ...updateData } = body

    if (!id) {
      return withCORS(NextResponse.json({ error: 'ต้องระบุ id' }, { status: 400 }))
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)

    // ถ้า tag เป็นชื่อ tag (tagName) ให้แปลงเป็น tagId ก่อน
    let tagId = tag
    if (typeof tag === 'string' && tag.length && tag.length !== 36) { // สมมติ tagId เป็น uuid 36 ตัว
      const tagsCol = await db.collection('Tags')
      const tagDoc = await tagsCol.findOne({ tagName: tag })
      if (!tagDoc) {
        return withCORS(NextResponse.json({ error: 'Tag not found' }, { status: 404 }))
      }
      tagId = tagDoc.tagId
    }

    updateData.tag = tagId
    updateData.updatedAt = new Date()

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
