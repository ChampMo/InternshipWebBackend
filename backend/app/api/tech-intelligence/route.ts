import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'
import Papa from 'papaparse'

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    console.log('No file uploaded')
    return withCORS(NextResponse.json({ error: 'No file uploaded' }, { status: 400 }))
  }

  // อ่านไฟล์ CSV เป็น text
  const text = await file.text()
  // แปลง CSV เป็น array
  const { data } = Papa.parse<string[]>(text, { skipEmptyLines: true })
  console.log('Raw CSV data:', data)

  // ตรวจสอบ header อัตโนมัติ
  let ips: string[] = []
  if (
    data.length &&
    typeof data[0][0] === 'string' &&
    data[0][0].toLowerCase().includes('ip')
  ) {
    ips = data.slice(1).map(row => row[0]).filter(ip => !!ip)
  } else {
    ips = data.map(row => row[0]).filter(ip => !!ip)
  }
  console.log('Parsed IPs:', ips)

  // ดึง token สำหรับ TI
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const tokens = db.collection('Tokens')
  const token = await tokens.findOne({ type: 'TI', status: true })
  if (!token) {
    console.log('TI token not found')
    return withCORS(NextResponse.json({ message: 'TI token not found' }, { status: 404 }))
  }
  console.log('Using TI token:', token.token)

  // เรียก VirusTotal API ทีละ IP
  const results = []
  for (const ip of ips) {
    console.log(`Checking IP: ${ip}`)
    const res = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
      headers: {
        'x-apikey': token.token,
      },
    })
    const vtData = await res.json()
    console.log(`Result for ${ip}:`, vtData)
    const reputation = vtData.data?.attributes?.reputation ?? 0
    results.push({
        ip,
        country: vtData.data?.attributes?.country
            || (vtData.data?.attributes?.whois?.match(/Country:\s*([A-Z]+)/)?.[1] ?? '-'),
        owner: vtData.data?.attributes?.as_owner || '-',
        reputation,
        status: reputation > 0 ? 'Good' : 'Bad',
    })
  }

  console.log('All results:', results)
  return withCORS(NextResponse.json({ results }, { status: 200 }))
}