import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

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
    tokenId: uuidv4(),
    name,
    token,
    type,
    status: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  await tokens.insertOne(newToken)
  return withCORS(NextResponse.json({ message: 'Token created successfully' }, { status: 201 }))
}

// get all tokens
export async function GET(req: NextRequest) {
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const tokens = db.collection('Tokens')

  const allTokens = await tokens.find({}).toArray()
  return withCORS(NextResponse.json(allTokens, { status: 200 }))
}

// delete a token
export async function DELETE(req: NextRequest) {
  const { tokenId } = await req.json()

  if (!tokenId) {
    return withCORS(NextResponse.json({ message: 'Token ID is required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const tokens = db.collection('Tokens')

  const result = await tokens.deleteOne({ tokenId })
  if (result.deletedCount === 0) {
    return withCORS(NextResponse.json({ message: 'Token not found' }, { status: 404 }))
  }
  
  return withCORS(NextResponse.json({ message: 'Token deleted successfully' }, { status: 200 }))
}

// Update a token
export async function PUT(req: NextRequest) {
  const { tokenId, name, type } = await req.json()

  if (!tokenId || !name || !type) {
    return withCORS(NextResponse.json({ message: 'All fields are required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const tokens = db.collection('Tokens')

  const updatedToken = {
    name,
    type,
    updatedAt: new Date()
  }

  const result = await tokens.updateOne({ tokenId }, { $set: updatedToken })
  
  if (result.modifiedCount === 0) {
    return withCORS(NextResponse.json({ message: 'Token not found or no changes made' }, { status: 404 }))
  }
  
  return withCORS(NextResponse.json({ message: 'Token updated successfully' }, { status: 200 }))
}
