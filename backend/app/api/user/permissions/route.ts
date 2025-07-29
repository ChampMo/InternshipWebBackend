import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

// Get all permissions
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const collection = db.collection('Users')
    const roles = db.collection('Roles')
    
    if (!userId) {
        return withCORS(NextResponse.json({ message: 'User ID is required' }, { status: 400 }))
    }
    const user = await collection.findOne({ userId })
    if (!user) {
        return withCORS(NextResponse.json({ message: 'User not found' }, { status: 404 }))
    }
    const role = await roles.findOne({ roleId: user.roleId })
    if (!role) {
        return withCORS(NextResponse.json({ message: 'Role not found' }, { status: 404 }))
    }   

    const permissions = {
        roleId: role.roleId,
        roleName: role.roleName,
        jira: role.jira,
        cyberNews: role.cyberNews,
        ti: role.ti,
        admin: role.admin
    }
    console.log('Permissions for user:', userId, permissions)
    return withCORS(NextResponse.json(permissions, { status: 200 }))
}
