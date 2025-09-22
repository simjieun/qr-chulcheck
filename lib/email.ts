import { env } from "./env";

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
  const apiUrl = `${env.appUrl}/api/send-qr-email`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      name,
      team,
      checkInUrl,
      qrImageBase64,
      qrCodeUrl,
      attachmentFileName
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`이메일 전송 실패: ${errorBody}`);
  }

  const result = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string };
  if (!result.success) {
    throw new Error("이메일 전송 결과를 확인할 수 없습니다.");
  }

  console.log("✅ 이메일 전송 성공:", result.message);
}
