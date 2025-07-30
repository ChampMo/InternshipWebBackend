import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '../../../lib/mongodb'
import { withCORS } from '../../../lib/cors'

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const news = await db.collection('Cyber news').find({}).toArray()
    return withCORS(NextResponse.json(news))
  } catch (e) {
    return withCORS(NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 }))
  }
}

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}