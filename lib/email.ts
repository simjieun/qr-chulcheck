import { env } from "./env";
import nodemailer from "nodemailer";

interface SendQrEmailOptions {
  to: string;
  name: string;
  team: string;
  checkInUrl: string;
  qrImageBase64: string;
  qrCodeUrl: string;
  attachmentFileName?: string;
}

export async function sendQrEmail({
  to,
  name,
  team,
  checkInUrl,
  qrImageBase64,
  qrCodeUrl,
  attachmentFileName
}: SendQrEmailOptions) {
  console.log("📧 Nodemailer 이메일 전송 시작");

  console.log("📧 이메일 전송 데이터:", {
    to_email: to,
    to_name: name,
    team: team,
    check_in_url: checkInUrl.substring(0, 50) + "...",
    qr_code_base64_length: qrImageBase64.length
  });

  try {
    // SMTP transporter 생성
    const transporter = nodemailer.createTransport({
      host: env.smtpServer,
      port: env.smtpPort,
      secure: false, // TLS 사용 (포트 587)
      auth: {
        user: env.smtpUsername,
        pass: env.smtpPassword,
      },
    });

    // QR 코드 base64 데이터 처리 (data:image/png;base64, 제거)
    let qrImageData = qrImageBase64;
    if (qrImageData.startsWith('data:image')) {
      qrImageData = qrImageData.split(',')[1];
    }

    // HTML 이메일 본문 생성
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

    // 이메일 전송
    const info = await transporter.sendMail({
      from: env.smtpFromEmail,
      to: to,
      subject: 'QR 체크인 코드가 도착했습니다',
      html: htmlBody,
      attachments: [
        {
          filename: attachmentFileName || 'qr_code.png',
          content: qrImageData,
          encoding: 'base64',
          cid: 'qr_code' // HTML의 cid:qr_code와 매칭
        }
      ]
    });

    console.log("✅ Nodemailer 이메일 전송 성공:", info.messageId);
    return { success: true, message: `이메일이 성공적으로 전송되었습니다: ${to}` };

  } catch (error) {
    console.error("❌ Nodemailer 이메일 전송 오류:", error);
    throw new Error(`이메일 전송 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
  }
}
