import nodemailer from "nodemailer";
import { env } from "./env";

interface EmailData {
  to: string;
  name: string;
  team: string;
  checkInUrl: string;
  qrImageBase64: string;
}

export async function sendQREmail(emailData: EmailData) {
  const { to, name, team, checkInUrl, qrImageBase64 } = emailData;

  // SMTP 설정 확인
  if (!env.smtpUsername || !env.smtpPassword || !env.smtpFromEmail) {
    throw new Error("SMTP 환경변수가 설정되지 않았습니다: SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL");
  }

  // Nodemailer 트랜스포터 생성
  const transporter = nodemailer.createTransport({
    host: env.smtpServer || "smtp.gmail.com",
    port: env.smtpPort || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: env.smtpUsername,
      pass: env.smtpPassword,
    },
  });

  // Base64 데이터에서 data:image/png;base64, 제거
  let qrData = qrImageBase64;
  if (qrData.startsWith('data:image')) {
    qrData = qrData.split(',')[1];
  }

  // HTML 이메일 본문
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .qr-container {
                text-align: center;
                margin: 30px 0;
            }
            .qr-image {
                max-width: 200px;
                height: auto;
            }
            .button {
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>안녕하세요, ${name}님!</h1>
                <p>${team} 팀 체크인용 QR 코드를 보내드립니다.</p>
            </div>
            
            <div class="qr-container">
                <img src="cid:qr_code" alt="QR Code" class="qr-image">
                <p>위의 QR 코드를 스캔하시거나 아래 버튼을 클릭해주세요.</p>
                <a href="${checkInUrl}" class="button">체크인하기</a>
            </div>
            
            <div class="footer">
                <p>이 이메일은 자동으로 발송되었습니다.</p>
                <p>문의사항이 있으시면 관리자에게 연락해주세요.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  // 이메일 옵션
  const mailOptions = {
    from: env.smtpFromEmail,
    to: to,
    subject: 'QR 체크인 코드가 도착했습니다',
    html: htmlBody,
    attachments: [
      {
        filename: 'qr_code.png',
        content: qrData,
        encoding: 'base64',
        cid: 'qr_code' // HTML에서 cid:qr_code로 참조
      }
    ]
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: `이메일이 성공적으로 전송되었습니다: ${to}`,
      messageId: result.messageId
    };
  } catch (error) {
    console.error("이메일 전송 오류:", error);
    throw new Error(`이메일 전송 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
  }
}