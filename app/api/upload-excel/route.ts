import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import * as QRCode from "qrcode";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { env } from "@/lib/env";
import { sendQrEmail } from "@/lib/email";
import type { EmployeeRow, NormalizedEmployee } from "@/types/attendance";
import { read, utils } from "xlsx";

interface UploadResult {
  total: number;
  stored: number;
  emailed: number;
  failures: Array<{ row: number; reason: string; identifier?: string }>;
}

export const runtime = "nodejs";

function sanitizeForStorage(text: string): string {
  // 한글이 포함된 경우 Base64로 인코딩하여 안전한 형태로 변환
  const hasKorean = /[가-힣]/.test(text);
  
  if (hasKorean) {
    // 한글이 포함된 경우 Base64로 인코딩 (URL-safe)
    const encoded = Buffer.from(text, 'utf8').toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return `team_${encoded}`;
  }
  
  // 영문인 경우 안전한 문자만 남기기
  return text
    .replace(/[^a-zA-Z0-9]/g, '-') // 영문, 숫자가 아닌 문자를 - 으로 변환
    .replace(/-+/g, '-') // 연속된 - 를 하나로 합치기
    .replace(/^-|-$/g, '') // 앞뒤 - 제거
    .toLowerCase() // 소문자로 변환
    || 'team'; // 빈 문자열이면 'team'으로 대체
}

function normalizeRow(row: EmployeeRow): NormalizedEmployee | null {
  const name = String(row["직원명"] ?? "").trim();
  const team = String(row["팀명"] ?? "").trim();
  const email = String(row["이메일"] ?? "").trim();
  const employeeNumberRaw = row["사번"];
  const employeeNumber = typeof employeeNumberRaw === "number"
    ? String(employeeNumberRaw)
    : String(employeeNumberRaw ?? "").trim();

  if (!name || !team || !email || !employeeNumber) {
    return null;
  }

  return { name, team, email, employeeNumber };
}

export async function POST(request: Request) {
  console.log("=== 엑셀 업로드 시작 ===");
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    console.log("❌ 파일이 없습니다");
    return NextResponse.json(
      { message: "엑셀 파일이 포함되지 않았습니다." },
      { status: 400 }
    );
  }

  console.log(`📄 파일 정보: ${file.name}, 크기: ${file.size}, 타입: ${file.type}`);

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
  ];
  if (file.type && !allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { message: "지원하지 않는 파일 형식입니다." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json(
      { message: "엑셀 파일에 시트가 존재하지 않습니다." },
      { status: 400 }
    );
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = utils.sheet_to_json<EmployeeRow>(sheet, { defval: "" });

  console.log(`📊 엑셀에서 ${rows.length}개 행을 읽었습니다`);
  console.log("📋 첫 번째 행 샘플:", rows[0] || "없음");

  const result: UploadResult = {
    total: rows.length,
    stored: 0,
    emailed: 0,
    failures: []
  };

  if (!rows.length) {
    console.log("⚠️ 처리할 행이 없습니다");
    return NextResponse.json(result);
  }

  const supabase = getSupabaseAdminClient();
  const bucket = env.qrBucket;

  for (const [index, row] of rows.entries()) {
    console.log(`🔄 행 ${index + 2} 처리 중...`);
    console.log("원본 데이터:", row);
    
    const normalized = normalizeRow(row);
    if (!normalized) {
      console.log(`❌ 행 ${index + 2}: 필수 값 누락`);
      result.failures.push({
        row: index + 2,
        reason: "필수 값(직원명, 팀명, 이메일, 사번) 중 누락된 항목이 있습니다."
      });
      continue;
    }

    console.log(`✅ 행 ${index + 2}: 정규화된 데이터`, normalized);

    try {
      const qrToken = randomUUID();
      const checkInUrl = `${env.appUrl}/check-in?token=${qrToken}`;
      const qrBuffer = await QRCode.toBuffer(checkInUrl, {
        errorCorrectionLevel: "M",
        type: "png",
        margin: 2,
        scale: 8
      });

      const safeTeamName = sanitizeForStorage(normalized.team);
      const filePath = `${safeTeamName}/${normalized.employeeNumber}.png`;
      console.log(`🗂️ 파일 경로: ${filePath} (원본 팀명: ${normalized.team})`);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, qrBuffer, {
          contentType: "image/png",
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      console.log(`💾 데이터베이스에 저장 중... (사번: ${normalized.employeeNumber})`);
      const { data: upsertData, error: upsertError } = await supabase
        .from("attendees")
        .upsert(
          {
            employee_number: normalized.employeeNumber,
            name: normalized.name,
            team: normalized.team,
            email: normalized.email,
            qr_token: qrToken,
            qr_code_url: publicUrl,
            qr_code_storage_path: filePath,
            email_sent_at: new Date().toISOString()
          },
          { onConflict: "employee_number" }
        )
        .select();

      if (upsertError) {
        console.log(`❌ DB 저장 실패 (사번: ${normalized.employeeNumber}):`, upsertError);
        throw upsertError;
      }

      console.log(`✅ DB 저장 성공 (사번: ${normalized.employeeNumber}):`, upsertData);

      // 이메일 전송 시도
      try {
        console.log(`📧 이메일 전송 시작 (${normalized.email})`);
        console.log(`📧 이메일 전송 데이터:`, {
          to: normalized.email,
          name: normalized.name,
          team: normalized.team,
          checkInUrl,
          qrImageBase64Length: qrBuffer.toString("base64").length
        });
        
        const emailResult = await sendQrEmail({
          to: normalized.email,
          name: normalized.name,
          team: normalized.team,
          checkInUrl,
          qrImageBase64: qrBuffer.toString("base64"),
          qrCodeUrl: publicUrl
        });
        
        console.log(`✅ 이메일 전송 성공 (${normalized.email}):`, emailResult);
        result.emailed += 1;
      } catch (emailError) {
        console.log(`❌ 이메일 전송 실패 (${normalized.email}):`, emailError);
        console.log(`❌ 이메일 전송 실패 상세:`, {
          message: emailError instanceof Error ? emailError.message : '알 수 없는 오류',
          stack: emailError instanceof Error ? emailError.stack : undefined
        });
        // 이메일 전송 실패해도 데이터 저장은 성공으로 처리
      }

      result.stored += 1;
      console.log(`🎉 행 ${index + 2} 처리 완료!`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "QR 코드 생성 또는 이메일 발송 중 오류가 발생했습니다.";
      console.log(`❌ 행 ${index + 2} 처리 실패:`, error);
      result.failures.push({
        row: index + 2,
        identifier: `${normalized?.name ?? ""} (${normalized?.email ?? ""})`,
        reason: message
      });
    }
  }

  console.log("=== 업로드 완료 ===");
  console.log(`📈 결과: 총 ${result.total}개, 저장 ${result.stored}개, 이메일 ${result.emailed}개, 실패 ${result.failures.length}개`);
  console.log("실패 목록:", result.failures);

  return NextResponse.json(result);
}
