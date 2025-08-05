import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

// create a new token
export async function POST(req: NextRequest) {
  const { token, name, type } = await req.json()

  if (!token || !name || !type) {
    return withCORS(NextResponse.json({ message: 'All fields are required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const tokens = db.collection('Tokens')

  const tokenExists = await tokens.findOne({ token })
  if (tokenExists) {
    return withCORS(NextResponse.json({ message: 'This token is already in use.' }, { status: 400 }))
  }
  const newToken = {
    token,
    name,
    type,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  await tokens.insertOne(newToken)
  return withCORS(NextResponse.json({ message: 'Token created successfully' }, { status: 201 }))
}
