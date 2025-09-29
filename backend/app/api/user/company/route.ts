import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}
// create a new company
export async function POST(req: NextRequest) {
  const { companyName, companyKey} = await req.json()

  if (!companyName) {
    return withCORS(NextResponse.json({ message: 'Company name is required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const companies = db.collection('Companies')

  const company = await companies.findOne({ companyName })
  if (company) {
    return withCORS(NextResponse.json({ message: 'This company name is already in use.' }, { status: 400 }))
  }
    const newCompany = {
      companyId: crypto.randomUUID(),
      companyName,
      companyKey,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await companies.insertOne(newCompany)
    return withCORS(NextResponse.json({ message: 'Company created successfully' }, { status: 201 }))
}

// get all companies
export async function GET() {

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const companies = db.collection('Companies')

  const allCompanies = await companies.find({}).toArray()
  return withCORS(NextResponse.json(allCompanies, { status: 200 }))
}

// delete a company
export async function DELETE(req: NextRequest) {
  const { companyId } = await req.json()

  if (!companyId) {
    return withCORS(NextResponse.json({ message: 'Company ID is required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const companies = db.collection('Companies')

  const company = await companies.findOne({ companyId })
  if (!company) {
    return withCORS(NextResponse.json({ message: 'Company not found' }, { status: 404 }))
  }

  await companies.deleteOne({ companyId })

  return withCORS(NextResponse.json({ message: 'Company deleted successfully' }, { status: 200 }))
}

// update a company
export async function PUT(req: NextRequest) {
  const { companyId, companyName } = await req.json()

  if (!companyId || !companyName) {
    return withCORS(NextResponse.json({ message: 'Company ID and name are required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const companies = db.collection('Companies')

  const company = await companies.findOne({ companyId })
  if (!company) {
    return withCORS(NextResponse.json({ message: 'Company not found' }, { status: 404 }))
  }

  // ตรวจสอบว่าชื่อ company ใหม่ซ้ำกับที่มีอยู่แล้วหรือไม่ (ยกเว้น company ปัจจุบัน)
  if (companyName && companyName !== company.companyName) {
    const existingCompany = await companies.findOne({ companyName })
    if (existingCompany) {
      return withCORS(NextResponse.json({ message: 'This company name is already in use.' }, { status: 400 }))
    }
  }

  await companies.updateOne(
    { companyId },
    { $set: { companyName, updatedAt: new Date() } }
  )

  return withCORS(NextResponse.json({ message: 'Company updated successfully' }, { status: 200 }))
}
