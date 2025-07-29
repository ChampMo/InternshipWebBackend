// lib/otp.ts
import nodemailer from 'nodemailer'


export const sendAccount = async (email: string, password:string) => {


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // ex: your@gmail.com
      pass: process.env.EMAIL_PASS
    }
  })

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to Cyber Command - Your Account Details',
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Cyber Command</title>
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
                background: linear-gradient(135deg, #007EE5 0%, #0066CC 100%);
                padding: 40px 30px;
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
                font-size: 32px;
                font-weight: bold;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                position: relative;
                z-index: 1;
            }
            .logo::before {
                content: '🛡️';
                margin-right: 10px;
            }
            .subtitle {
                color: #D2ECFF;
                font-size: 16px;
                margin: 10px 0 0 0;
                position: relative;
                z-index: 1;
            }
            .content {
                padding: 40px 30px;
                color: #333333;
            }
            .welcome-message {
                font-size: 24px;
                color: #007EE5;
                margin: 0 0 20px 0;
                font-weight: bold;
            }
            .account-box {
                background: linear-gradient(135deg, #D2ECFF 0%, #E8F4FF 100%);
                border: 2px solid #007EE5;
                border-radius: 12px;
                padding: 25px;
                margin: 30px 0;
                position: relative;
            }
            .account-box::before {
                content: '🔐';
                position: absolute;
                top: -10px;
                left: 20px;
                background: #ffffff;
                padding: 5px 10px;
                border-radius: 20px;
                border: 2px solid #007EE5;
            }
            .account-title {
                color: #007EE5;
                font-size: 18px;
                font-weight: bold;
                margin: 0 0 15px 0;
                text-align: center;
            }
            .account-details {
                background: #ffffff;
                border-radius: 8px;
                padding: 20px;
                border-left: 4px solid #007EE5;
            }
            .detail-row {
                display: table;
                width: 100%;
                margin: 10px 0;
                padding: 10px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            .detail-label {
                display: table-cell;
                width: 40%;
                font-weight: bold;
                color: #007EE5;
                font-size: 14px;
                vertical-align: middle;
            }
            .detail-value {
                display: table-cell;
                width: 60%;
                color: #333333;
                font-family: 'Courier New', monospace;
                background: #f8f9fa;
                padding: 5px 10px;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
                vertical-align: middle;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: bold;
                color: #007EE5;
                font-size: 14px;
            }
            .detail-value {
                color: #333333;
                font-family: 'Courier New', monospace;
                background: #f8f9fa;
                padding: 5px 10px;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
            }
            .security-notice {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
                color: #856404;
            }
            .security-notice h3 {
                margin: 0 0 10px 0;
                color: #856404;
                font-size: 16px;
            }
            .security-notice ul {
                margin: 10px 0 0 20px;
                padding: 0;
            }
            .security-notice li {
                margin: 5px 0;
            }
            .cta-button {
                display: inline-block;
                background-color: #007EE5;
                background: linear-gradient(135deg, #007EE5 0%, #0066CC 100%);
                color: #ffffff !important;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0, 126, 229, 0.3);
                transition: all 0.3s ease;
                border: none;
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 126, 229, 0.4);
            }
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 3px solid #D2ECFF;
            }
            .footer-logo {
                color: #007EE5;
                font-size: 18px;
                font-weight: bold;
                margin: 0 0 15px 0;
            }
            .footer-text {
                color: #666666;
                font-size: 14px;
                margin: 5px 0;
            }
            .social-links {
                margin: 20px 0 0 0;
            }
            .social-links a {
                color: #007EE5;
                text-decoration: none;
                margin: 0 15px;
                font-weight: bold;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    box-shadow: none;
                }
                .header, .content, .footer {
                    padding: 20px;
                }
                .detail-row {
                    display: table;
                    width: 100%;
                }
                .detail-label,
                .detail-value {
                    display: table-cell;
                    vertical-align: middle;
                }
                .detail-value {
                    width: 60%;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">CYBER COMMAND</h1>
                <p class="subtitle">Advanced Cybersecurity Solutions</p>
            </div>
            
            <div class="content">
                <h2 class="welcome-message">Welcome to Cyber Command!</h2>
                
                <p>Dear Valued Customer,</p>
                
                <p>We're excited to welcome you to Cyber Command, your trusted partner in cybersecurity excellence. Your account has been successfully created and is ready to use.</p>
                
                <div class="account-box">
                    <h3 class="account-title">Your Account Credentials</h3>
                    <div class="account-details">
                        <div class="detail-row">
                            <span class="detail-label">Email Address:</span>
                            <span class="detail-value">${email}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Password:</span>
                            <span class="detail-value">${password}</span>
                        </div>
                    </div>
                </div>
                
                <div class="security-notice">
                    <h3>🔒 Important Security Information</h3>
                    <ul>
                        <li><strong>Change your password immediately</strong> after your first login</li>
                        <li>Never share your credentials with anyone</li>
                        <li>Enable two-factor authentication for enhanced security</li>
                        <li>Log out completely when using shared computers</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="#" class="cta-button">Access Your Account</a>
                </div>
                
                <p>Best regards,<br>
                <strong>The Cyber Command Team</strong></p>
            </div>
            
            <div class="footer">
                <div class="footer-logo">CYBER COMMAND</div>
                <p class="footer-text">Protecting your digital assets with advanced cybersecurity solutions</p>
                <p class="footer-text">© 2024 Cyber Command. All rights reserved.</p>
                <div class="social-links">
                    <a href="#">Support Center</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `
  }
  
  await transporter.sendMail(mailOptions)
  return true
}