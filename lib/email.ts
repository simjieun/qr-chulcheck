import { env } from "./env";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

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
  console.log("🐍 Python 이메일 전송 시작");
  
  // Python 스크립트 경로
  const pythonScriptPath = path.join(process.cwd(), "scripts", "send_email.py");
  
  // 이메일 데이터 준비
  const emailData = {
    to_email: to,
    to_name: name,
    team: team,
    check_in_url: checkInUrl,
    qr_code_base64: qrImageBase64
  };

  console.log("🐍 Python에 전달할 데이터:", {
    to_email: emailData.to_email,
    to_name: emailData.to_name,
    team: emailData.team,
    check_in_url: emailData.check_in_url.substring(0, 50) + "...",
    qr_code_base64_length: emailData.qr_code_base64.length
  });

  try {
    // JSON 데이터를 안전하게 이스케이프
    const jsonData = JSON.stringify(emailData).replace(/'/g, "'\"'\"'");
    
    // 환경 변수 설정
    const envVars = {
      ...process.env,
      SMTP_SERVER: env.smtpServer,
      SMTP_PORT: env.smtpPort.toString(),
      SMTP_USERNAME: env.smtpUsername,
      SMTP_PASSWORD: env.smtpPassword,
      SMTP_FROM_EMAIL: env.smtpFromEmail
    };
    
    // Python 스크립트 실행
    const command = `python3 "${pythonScriptPath}" '${jsonData}'`;
    console.log("🐍 실행할 명령어:", command.substring(0, 100) + "...");
    
    const { stdout, stderr } = await execAsync(command, { env: envVars });
    
    if (stderr) {
      console.log("🐍 Python stderr:", stderr);
    }
    
    console.log("🐍 Python stdout:", stdout);
    
    // 결과 파싱
    const result = JSON.parse(stdout);
    
    if (!result.success) {
      throw new Error(`Python 이메일 전송 실패: ${result.error}`);
    }
    
    console.log("✅ Python 이메일 전송 성공:", result.message);
    return result;
    
  } catch (error) {
    console.error("❌ Python 이메일 전송 오류:", error);
    throw new Error(`Python 이메일 전송 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
  }
}
