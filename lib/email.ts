import { env } from "./env";
import { spawn } from "node:child_process";
import path from "node:path";

interface SendQrEmailOptions {
  to: string;
  name: string;
  team: string;
  checkInUrl: string;
  qrImageBase64: string;
  qrCodeUrl: string;
  attachmentFileName?: string;
}

interface BatchEmailData {
  to_email: string;
  name: string;
  team: string;
  check_in_url: string;
  qr_image_base64: string;
}

interface BatchEmailResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    success: boolean;
    email: string;
    message: string;
  }>;
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
  console.log("📧 Python SMTP 이메일 전송 시작");

  console.log("📧 이메일 전송 데이터:", {
    to_email: to,
    to_name: name,
    team: team,
    check_in_url: checkInUrl.substring(0, 50) + "...",
    qr_code_base64_length: qrImageBase64.length
  });

  try {
    // Python 스크립트 경로
    const scriptPath = path.join(process.cwd(), 'scripts', 'send_email.py');

    // Python 스크립트로 전달할 데이터
    const inputData = {
      to_email: to,
      name: name,
      team: team,
      check_in_url: checkInUrl,
      qr_image_base64: qrImageBase64.startsWith('data:image')
        ? qrImageBase64
        : `data:image/png;base64,${qrImageBase64}`,
      smtp_server: env.smtpServer,
      smtp_port: env.smtpPort,
      smtp_username: env.smtpUsername,
      smtp_password: env.smtpPassword,
      from_email: env.smtpFromEmail
    };

    // Python 스크립트 실행
    const result = await new Promise<{ success: boolean; message: string }>((resolve, reject) => {
      const python = spawn('python3', [scriptPath]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('Python stderr:', data.toString());
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`JSON 파싱 실패: ${stdout}`));
          }
        } else {
          reject(new Error(`Python 스크립트 실행 실패 (코드 ${code}): ${stderr || stdout}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Python 프로세스 오류: ${error.message}`));
      });

      // 입력 데이터를 stdin으로 전달
      python.stdin.write(JSON.stringify(inputData));
      python.stdin.end();
    });

    if (result.success) {
      console.log("✅ Python 이메일 전송 성공:", result.message);
      return { success: true, message: result.message };
    } else {
      throw new Error(result.message);
    }

  } catch (error) {
    console.error("❌ Python 이메일 전송 오류:", error);
    throw new Error(`이메일 전송 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
  }
}

/**
 * 배치로 여러 이메일을 전송 (SMTP 연결 재사용)
 * @param emails 이메일 데이터 배열
 * @returns 배치 전송 결과
 */
export async function sendBatchQrEmails(
  emails: Array<SendQrEmailOptions>
): Promise<BatchEmailResult> {
  console.log(`📧 Python 배치 이메일 전송 시작 (${emails.length}개)`);

  try {
    // Python 배치 스크립트 경로
    const scriptPath = path.join(process.cwd(), 'scripts', 'send_email_batch.py');

    // 배치 이메일 데이터 준비
    const batchEmails: BatchEmailData[] = emails.map(email => ({
      to_email: email.to,
      name: email.name,
      team: email.team,
      check_in_url: email.checkInUrl,
      qr_image_base64: email.qrImageBase64.startsWith('data:image')
        ? email.qrImageBase64
        : `data:image/png;base64,${email.qrImageBase64}`
    }));

    // Python 스크립트로 전달할 데이터
    const inputData = {
      emails: batchEmails,
      smtp_server: env.smtpServer,
      smtp_port: env.smtpPort,
      smtp_username: env.smtpUsername,
      smtp_password: env.smtpPassword,
      from_email: env.smtpFromEmail
    };

    // Python 스크립트 실행
    const result = await new Promise<BatchEmailResult>((resolve, reject) => {
      const python = spawn('python3', [scriptPath]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('Python stderr:', data.toString());
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`JSON 파싱 실패: ${stdout}`));
          }
        } else {
          reject(new Error(`Python 스크립트 실행 실패 (코드 ${code}): ${stderr || stdout}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Python 프로세스 오류: ${error.message}`));
      });

      // 입력 데이터를 stdin으로 전달
      python.stdin.write(JSON.stringify(inputData));
      python.stdin.end();
    });

    console.log(`✅ 배치 이메일 전송 완료: 성공 ${result.succeeded}/${result.total}`);
    return result;

  } catch (error) {
    console.error("❌ Python 배치 이메일 전송 오류:", error);
    throw new Error(`배치 이메일 전송 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
  }
}
