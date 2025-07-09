import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

export async function DELETE(req: NextRequest) {
  const { userId } = await req.json()

  if (!userId) {
    return withCORS(NextResponse.json({ message: 'User ID is required' }, { status: 400 }))
  }
  
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const users = db.collection('Users')

  const user = await users.findOne({ userId })

  if (!user) {
    return withCORS(NextResponse.json({ message: 'User not found' }, { status: 404 }))
  }

  await users.deleteOne({ userId })

  return withCORS(NextResponse.json({ message: 'User deleted successfully' }, { status: 200 }))
}
