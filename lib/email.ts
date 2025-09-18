import { assertServerEnv } from "./env";

interface SendQrEmailOptions {
  to: string;
  name: string;
  team: string;
  checkInUrl: string;
  qrImageBase64: string;
  attachmentFileName: string;
}

export async function sendQrEmail({
  to,
  name,
  team,
  checkInUrl,
  qrImageBase64,
  attachmentFileName
}: SendQrEmailOptions) {
  const supabaseUrl = assertServerEnv("supabaseUrl");
  const serviceRoleKey = assertServerEnv("supabaseServiceRoleKey");

  const response = await fetch(`${supabaseUrl}/functions/v1/send-qrcode-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({
      to,
      name,
      team,
      checkInUrl,
      qrImageBase64,
      attachmentFileName
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`이메일 전송 실패: ${errorBody}`);
  }

  const result = (await response.json().catch(() => ({}))) as { success?: boolean };
  if (!result.success) {
    throw new Error("이메일 전송 결과를 확인할 수 없습니다.");
  }
}
