// lib/otp.ts
import nodemailer from 'nodemailer'
import clientPromise from './mongodb'

// สร้าง OTP 6 หลักแบบสุ่ม
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const sendOTP = async (email: string) => {
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15)

  // ✅ บันทึก OTP ลงใน MongoDB (optional)
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB)
  const otps = db.collection('OTPs')

  // ลบ OTP เก่าของ email นี้ก่อน
  await otps.deleteMany({ email })

  // บันทึก OTP ใหม่
  await otps.insertOne({
    email,
    otp,
    expiresAt,
    createdAt: new Date()
  })

  // ✅ สร้าง mail transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // ex: your@gmail.com
      pass: process.env.EMAIL_PASS
    }
  })

  // ✅ ตั้งค่า email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    html: `
      <p>🔐 Your OTP code is: <strong>${otp}</strong></p>
      <p>This code will expire in 15 minutes.</p>
    `
  }

  // ✅ ส่ง email
  await transporter.sendMail(mailOptions)
}
