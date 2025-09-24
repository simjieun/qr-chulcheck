import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

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
    console.log("=== Python 이메일 전송 API 시작 ===");
    
    const body: SendEmailRequest = await request.json();
    const { to, name, team, checkInUrl, qrImageBase64, qrCodeUrl, attachmentFileName } = body;

    // 필수 필드 검증
    if (!to || !name || !team || !checkInUrl || !qrImageBase64 || !qrCodeUrl) {
      console.log("❌ 필수 필드 누락:", { to: !!to, name: !!name, team: !!team, checkInUrl: !!checkInUrl, qrImageBase64: !!qrImageBase64, qrCodeUrl: !!qrCodeUrl });
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // SMTP 환경변수 확인
    if (!process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM_EMAIL) {
      console.log("❌ SMTP 환경변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "이메일 서비스가 설정되지 않았습니다. SMTP 환경변수를 확인해주세요." },
        { status: 500 }
      );
    }

    console.log(`📧 Python 이메일 전송 시작: ${to}`);

    // Python 스크립트에 전달할 데이터
    const emailData = {
      to_email: to,
      to_name: name,
      team: team,
      check_in_url: checkInUrl,
      qr_code_base64: qrImageBase64,
      qr_code_url: qrCodeUrl,
      attachment_file_name: attachmentFileName || `${name}-qr-code.png`
    };

    // Python 스크립트 경로
    const scriptPath = path.join(process.cwd(), 'scripts', 'send_email.py');
    const command = `python3 "${scriptPath}" '${JSON.stringify(emailData)}'`;

    console.log("🐍 Python 스크립트 실행:", command);

    // Python 스크립트 실행
    const { stdout, stderr } = await execAsync(command);

    if (stderr && stderr.trim()) {
      console.log("⚠️ Python 스크립트 경고:", stderr);
    }

    // Python 스크립트 결과 파싱
    let result;
    try {
      result = JSON.parse(stdout.trim());
    } catch (parseError) {
      console.log("❌ Python 응답 파싱 실패:", stdout);
      throw new Error(`Python 스크립트 응답을 파싱할 수 없습니다: ${stdout}`);
    }

    if (!result.success) {
      console.log("❌ Python 이메일 전송 실패:", result);
      return NextResponse.json(
        { error: "이메일 전송에 실패했습니다.", details: result.error },
        { status: 500 }
      );
    }

    console.log("✅ Python 이메일 전송 성공:", result);
    return NextResponse.json({ 
      success: true, 
      message: result.message || "이메일이 성공적으로 전송되었습니다." 
    });

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
