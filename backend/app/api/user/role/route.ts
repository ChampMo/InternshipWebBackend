import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}
// create a new role
export async function POST(req: NextRequest) {
  const { roleName, jira, cyberNews, ti, admin } = await req.json()

  if (!roleName) {
    return withCORS(NextResponse.json({ message: 'Role name is required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const roles = db.collection('Roles')

  const role = await roles.findOne({ roleName })
  if (role) {
    return withCORS(NextResponse.json({ message: 'This role name is already in use.' }, { status: 400 }))
  }
    const newRole = {
        roleName,
        jira: jira || false,
        cyberNews: cyberNews || false,
        ti: ti || false,
        admin: admin || false,
        createdAt: new Date(),
        updatedAt: new Date()
    }
    await roles.insertOne(newRole)
    return withCORS(NextResponse.json({ message: 'Role created successfully' }, { status: 201 }))
}

// get all roles
export async function GET(req: NextRequest) {



  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const roles = db.collection('Roles')

  const allRoles = await roles.find({}).toArray()
  return withCORS(NextResponse.json(allRoles, { status: 200 }))
}

// delete a role
export async function DELETE(req: NextRequest) {
  const { roleName } = await req.json()

  if (!roleName) {
    return withCORS(NextResponse.json({ message: 'Role name is required' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const roles = db.collection('Roles')

  const role = await roles.findOne({ roleName })
  if (!role) {
    return withCORS(NextResponse.json({ message: 'This role name is not found.' }, { status: 404 }))
  }
  await roles.deleteOne({ roleName })
  return withCORS(NextResponse.json({ message: 'Role deleted successfully' }, { status: 200 }))
}

// update a role
export async function PUT(req: NextRequest) {
  const { roleName, jira, cyberNews, ti, admin } = await req.json()

  if (!roleName) {
    return withCORS(NextResponse.json({ message: 'Role name is not found' }, { status: 400 }))
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const roles = db.collection('Roles')

  const role = await roles.findOne({ roleName })
  if (!role) {
    return withCORS(NextResponse.json({ message: 'This role name is not found.' }, { status: 404 }))
  }
    const updatedRole = {
        roleName,
        jira: jira,
        cyberNews: cyberNews,
        ti: ti,
        admin: admin,
        updatedAt: new Date()
    }
    await roles.updateOne({ roleName }, { $set: updatedRole })
    return withCORS(NextResponse.json({ message: 'Role updated successfully' }, { status: 200 }))
}
