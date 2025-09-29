import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'


export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}


// create a new tag
export async function POST(req: NextRequest) {
  const { tagName } = await req.json()

  if (!tagName) {
    return withCORS(NextResponse.json({ message: 'Tag name is required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const tags = db.collection('Tags')

  const tag = await tags.findOne({ tagName })
  if (tag) {
    return withCORS(NextResponse.json({ message: 'This tag name is already in use.' }, { status: 400 }))
  }
  const newTag = {
    tagId: crypto.randomUUID(),
    tagName,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  await tags.insertOne(newTag)
  return withCORS(NextResponse.json({ message: 'Tag created successfully' }, { status: 201 }))
}

// get all tags
export async function GET(request: NextRequest) {
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const tags = db.collection('Tags')

  // ถ้ามี query tagId จะดึง tag เดียว
  const { searchParams } = new URL(request.url)
  const tagId = searchParams.get('tagId')
  if (tagId) {
    const tag = await tags.findOne({ tagId })
    if (!tag) {
      return withCORS(NextResponse.json({ message: 'Tag not found' }, { status: 404 }))
    }
    return withCORS(NextResponse.json(tag, { status: 200 }))
  }

  // ถ้าไม่มี query tagId จะดึงทั้งหมด
  const allTags = await tags.find({}).toArray()
  return withCORS(NextResponse.json(allTags, { status: 200 }))
}

// delete a tag
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tagId = searchParams.get('tagId')

  if (!tagId) {
    return withCORS(NextResponse.json({ message: 'Tag ID is required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const tags = db.collection('Tags')

  const tag = await tags.findOne({ tagId })
  if (!tag) {
    return withCORS(NextResponse.json({ message: 'Tag not found' }, { status: 404 }))
  }

  await tags.deleteOne({ tagId })

  return withCORS(NextResponse.json({ message: 'Tag deleted successfully' }, { status: 200 }))
}

// update a tag
export async function PUT(req: NextRequest) {
  const { tagName } = await req.json()
  const { searchParams } = new URL(req.url)
  const tagId = searchParams.get('tagId')

  if (!tagId || !tagName) {
    return withCORS(NextResponse.json({ message: 'Tag ID and name are required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const tags = db.collection('Tags')

  const tag = await tags.findOne({ tagId })
  if (!tag) {
    return withCORS(NextResponse.json({ message: 'Tag not found' }, { status: 404 }))
  }

  // ตรวจสอบว่าชื่อ tag ใหม่ซ้ำกับที่มีอยู่แล้วหรือไม่ (ยกเว้น tag ปัจจุบัน)
  if (tagName && tagName !== tag.tagName) {
    const existingTag = await tags.findOne({ tagName })
    if (existingTag) {
      return withCORS(NextResponse.json({ message: 'This tag name is already in use.' }, { status: 400 }))
    }
  }

  await tags.updateOne(
    { tagId },
    { $set: { tagName, updatedAt: new Date() } }
  )

  return withCORS(NextResponse.json({ message: 'Tag updated successfully' }, { status: 200 }))
}