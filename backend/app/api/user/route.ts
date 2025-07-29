import clientPromise from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

export async function GET() {
  console.log('Fetching all users...')
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const collection = db.collection('Users')
  const roles = db.collection('Roles')
  const companies = db.collection('Companies')

  const data = await collection.find({}).toArray()
  const roleMap = new Map<string, string>()
  const rolesData = await roles.find({}).toArray()
  rolesData.forEach(role => {
    roleMap.set(role.roleId, role.roleName)
  })

  const companyMap = new Map<string, string>()
  const companiesData = await companies.find({}).toArray()
  companiesData.forEach(company => {
    companyMap.set(company.companyId, company.companyName)
  })

  const usersWithRC = data.map(user => ({
    ...user,
    roleName: roleMap.get(user.roleId) || 'Role has been removed',
    companyName: companyMap.get(user.companyId) || 'Company has been removed'
  }))
  return withCORS(NextResponse.json(usersWithRC, { status: 200 }))
}

export async function DELETE(req: NextRequest) {
  const { userId } = await req.json()
  console.log('Deleting user with ID:', userId)
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


export async function PUT(req: NextRequest) {
  const { userId, roleId, companyId } = await req.json()
  
  if (!userId) {
    return withCORS(NextResponse.json({ message: 'User ID is required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const Users = db.collection('Users')
  const user = await Users.findOne({ userId })
  if (!user) {
    return withCORS(NextResponse.json({ message: 'User not found' }, { status: 404 }))
  }
  const updatedUser: any = {
    companyId: companyId,
    roleId: roleId,
  }
  const result = await Users.updateOne({ userId }, { $set: updatedUser })

  return withCORS(NextResponse.json({ message: 'User updated successfully', result }, { status: 200 }))

}
