import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt' // ฟังก์ชันถอดรหัส JWT

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token); // ✅ ถอดรหัส JWT ด้วย lib เช่น jsonwebtoken
    return NextResponse.json({ message: 'Token valid', user: decoded });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
