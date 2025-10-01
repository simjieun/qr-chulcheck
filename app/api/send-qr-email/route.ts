import { NextResponse } from "next/server";
import { sendQrEmail } from "@/lib/email";

interface SendEmailRequest {
  to: string;
  name: string;
  team: string;
  checkInUrl: string;
  qrImageBase64: string;
  qrCodeUrl: string;
  attachmentFileName?: string;
}

export async function POST(request: Request) {
  try {
    console.log("=== Node.js 이메일 전송 API 시작 ===");
    
    const body: SendEmailRequest = await request.json();
    const { to, name, team, checkInUrl, qrImageBase64 } = body;

    // 필수 필드 검증
    if (!to || !name || !team || !checkInUrl || !qrImageBase64) {
      console.log("❌ 필수 필드 누락:", { to: !!to, name: !!name, team: !!team, checkInUrl: !!checkInUrl, qrImageBase64: !!qrImageBase64 });
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    console.log(`🐍 Python 이메일 전송 시작: ${to}`);

    // Python 이메일 전송
    const result = await sendQrEmail({
      to,
      name,
      team,
      checkInUrl,
      qrImageBase64,
      qrCodeUrl: body.qrCodeUrl || ""
    });

    console.log("✅ Python 이메일 전송 성공:", result);
    return NextResponse.json(result);

  } catch (error) {
    console.log("❌ 이메일 전송 오류:", error);
    return NextResponse.json(
      { 
        error: "이메일 전송 중 오류가 발생했습니다.", 
        details: error instanceof Error ? error.message : "알 수 없는 오류" 
      },
      { status: 500 }
    );
  }
}
