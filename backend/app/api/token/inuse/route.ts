import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

// Update a token
export async function PUT(req: NextRequest) {
  const { tokenId, status } = await req.json()

  if (!tokenId || status === undefined) {
    return withCORS(NextResponse.json({ message: 'All fields are required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const tokens = db.collection('Tokens')

  
  const tokenType = await tokens.findOne({ tokenId }, { projection: { type: 1 } })
  console.log('tokenType',tokenType)
  await tokens.updateMany({ type:tokenType?.type }, { $set: { status: false } })
  
  const updatedToken = {
    status
  }
  const result = await tokens.updateOne({ tokenId }, { $set: updatedToken })
  
  if (result.modifiedCount === 0) {
    return withCORS(NextResponse.json({ message: 'Token not found or no changes made' }, { status: 404 }))
  }
  
  return withCORS(NextResponse.json({ message: 'Token updated successfully' }, { status: 200 }))
}
