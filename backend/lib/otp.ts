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
    subject: '🔐 Your Cyber Command OTP Code',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="background-color: #007EE5; color: white; padding: 24px 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Cyber Command</h1>
          <p style="margin: 4px 0 0;">Secure Access Verification</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">
            You are attempting to verify your identity with Cyber Command. Please use the OTP code below to complete the process.
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <span style="display: inline-block; font-size: 36px; letter-spacing: 8px; color: #007EE5; font-weight: bold;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 14px; color: #666;">
            This OTP is valid for <strong>15 minutes</strong>. Please do not share this code with anyone.
          </p>
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            If you did not request this code, please ignore this email or contact our support team.
          </p>
        </div>
        <div style="background-color: #f8f8f8; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          © ${new Date().getFullYear()} Cyber Command. All rights reserved.
        </div>
      </div>
    `
  }


  // ✅ ส่ง email
  await transporter.sendMail(mailOptions)
}
