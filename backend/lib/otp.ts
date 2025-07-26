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
    subject: 'Cyber Command - Your Security Verification Code',
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Verification - Cyber Command</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: 'Arial', 'Helvetica', sans-serif;
                background-color: #f5f5f5;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 4px 20px rgba(0, 126, 229, 0.1);
            }
            .header {
                background-color: #007EE5;
                background: linear-gradient(135deg, #007EE5 0%, #0066CC 100%);
                padding: 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="3" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="70" cy="70" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
                pointer-events: none;
            }
            .logo {
                color: #ffffff;
                font-size: 28px;
                font-weight: bold;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                position: relative;
                z-index: 1;
            }
            .logo::before {
                content: '🛡️';
                margin-right: 8px;
            }
            .subtitle {
                color: #D2ECFF;
                font-size: 14px;
                margin: 8px 0 0 0;
                position: relative;
                z-index: 1;
            }
            .content {
                padding: 40px 30px;
                color: #333333;
                text-align: center;
            }
            .security-icon {
                font-size: 48px;
                margin: 0 0 20px 0;
            }
            .title {
                font-size: 24px;
                color: #007EE5;
                margin: 0 0 15px 0;
                font-weight: bold;
            }
            .description {
                font-size: 16px;
                color: #666666;
                margin: 0 0 30px 0;
                line-height: 1.5;
            }
            .otp-container {
                background-color: #D2ECFF;
                background: linear-gradient(135deg, #D2ECFF 0%, #E8F4FF 100%);
                border: 3px solid #007EE5;
                border-radius: 16px;
                padding: 30px;
                margin: 30px 0;
                position: relative;
            }
            .otp-container::before {
                content: '🔐';
                position: absolute;
                top: -15px;
                left: 50%;
                transform: translateX(-50%);
                background: #ffffff;
                padding: 8px 12px;
                border-radius: 25px;
                border: 3px solid #007EE5;
                font-size: 20px;
            }
            .otp-label {
                color: #007EE5;
                font-size: 16px;
                font-weight: bold;
                margin: 0 0 15px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .otp-code {
                background: #ffffff;
                color: #007EE5;
                font-size: 36px;
                font-weight: bold;
                font-family: 'Courier New', monospace;
                padding: 20px 30px;
                border-radius: 12px;
                border: 2px solid #007EE5;
                letter-spacing: 8px;
                margin: 0;
                box-shadow: 0 4px 15px rgba(0, 126, 229, 0.2);
            }
            .expiry-info {
                background: #fff3cd;
                border: 2px solid #ffc107;
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
                color: #856404;
                text-align: center;
            }
            .expiry-info h3 {
                margin: 0 0 10px 0;
                color: #856404;
                font-size: 16px;
            }
            .expiry-info .time {
                font-size: 18px;
                font-weight: bold;
                color: #d63384;
            }
            .security-tips {
                background: #f8f9fa;
                border-left: 4px solid #007EE5;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
                text-align: left;
            }
            .security-tips h3 {
                margin: 0 0 15px 0;
                color: #007EE5;
                font-size: 16px;
            }
            .security-tips ul {
                margin: 0;
                padding: 0 0 0 20px;
                color: #666666;
            }
            .security-tips li {
                margin: 8px 0;
                font-size: 14px;
            }
            .footer {
                background: #f8f9fa;
                padding: 25px 30px;
                text-align: center;
                border-top: 3px solid #D2ECFF;
            }
            .footer-logo {
                color: #007EE5;
                font-size: 16px;
                font-weight: bold;
                margin: 0 0 10px 0;
            }
            .footer-text {
                color: #666666;
                font-size: 12px;
                margin: 5px 0;
            }
            .warning-box {
                background: #ffe6e6;
                border: 2px solid #ff4757;
                border-radius: 8px;
                padding: 15px;
                margin: 25px 0;
                color: #c0392b;
                text-align: center;
            }
            .warning-box strong {
                color: #a93226;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    box-shadow: none;
                }
                .header, .content, .footer {
                    padding: 20px;
                }
                .otp-code {
                    font-size: 28px;
                    letter-spacing: 4px;
                    padding: 15px 20px;
                }
                .otp-container {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">CYBER COMMAND</h1>
                <p class="subtitle">Security Verification System</p>
            </div>
            
            <div class="content">
                <div class="security-icon">🔒</div>
                <h2 class="title">Security Verification Required</h2>
                <p class="description">
                    We've received a request to verify your identity. Please use the verification code below to complete your security authentication.
                </p>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="expiry-info">
                    <h3>⏰ Time Sensitive</h3>
                    <p>This code will expire in <span class="time">15 minutes</span></p>
                    <p>Please complete your verification promptly</p>
                </div>
                
                <div class="security-tips">
                    <h3>🛡️ Security Guidelines</h3>
                    <ul>
                        <li>Never share this code with anyone</li>
                        <li>Our support team will never ask for your verification code</li>
                        <li>If you didn't request this code, please contact us immediately</li>
                        <li>This code is only valid for 15 minutes</li>
                    </ul>
                </div>
                
                <div class="warning-box">
                    <strong>⚠️ Important:</strong> If you did not request this verification code, please ignore this email and contact our security team immediately.
                </div>
                
                <p style="color: #666666; font-size: 14px; margin-top: 30px;">
                    This is an automated security message from Cyber Command. Please do not reply to this email.
                </p>
            </div>
            
            <div class="footer">
                <div class="footer-logo">CYBER COMMAND</div>
                <p class="footer-text">Advanced Cybersecurity Solutions</p>
                <p class="footer-text">© 2024 Cyber Command. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  // ✅ ส่ง email
  await transporter.sendMail(mailOptions)
}