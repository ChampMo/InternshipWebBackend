// lib/cors.ts
import { NextResponse } from 'next/server'

// ปรับให้ตรงโปรดักชันของคุณ (เพิ่ม localhost ได้)
const ALLOWLIST = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
];

export function withCORS(res: NextResponse, origin?: string): NextResponse {
  const okOrigin = origin && ALLOWLIST.includes(origin) ? origin : ALLOWLIST[0];

  res.headers.set('Access-Control-Allow-Origin', okOrigin);
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // ถ้ามี preflight ขอ header อะไรมา ให้ echo กลับ เพื่อความชัวร์
  if (!res.headers.has('Access-Control-Allow-Headers')) {
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  res.headers.set('Access-Control-Allow-Credentials', 'true');  // ใช้ร่วมกับ origin แบบชี้เฉพาะเท่านั้น
  res.headers.set('Access-Control-Max-Age', '86400');            // cache preflight 24h
  res.headers.set('Vary', 'Origin, Access-Control-Request-Headers');
  return res;
}
