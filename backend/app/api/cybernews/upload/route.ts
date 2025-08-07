import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as Blob // ใช้ Blob แทน File

    if (!file) {
      return withCORS(NextResponse.json({ error: 'No file uploaded' }, { status: 400 }))
    }

    const fileName = `${Date.now()}_image`
    const bucket = 'images'
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { // ใช้ file (Blob) ตรงนี้
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.log('supabase error:', error)
      return withCORS(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    const { data: publicUrlData } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(fileName)

    return withCORS(NextResponse.json({
      url: publicUrlData.publicUrl,
      fileName
    }, { status: 201 }))
  } catch (e: any) {
    console.log('catch error:', e)
    return withCORS(NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 }))
  }
}