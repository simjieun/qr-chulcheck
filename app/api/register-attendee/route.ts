import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import * as QRCode from "qrcode";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// 짧은 토큰 생성 (8자리)
function generateShortToken(): string {
  return randomBytes(6).toString('base64url').substring(0, 8);
}

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

export async function POST(request: Request) {
  console.log("=== 수동 참석자 등록 시작 ===");

  try {
    const body = await request.json();
    const { name, team, email, employeeNumber, clothingSize, sportsTeam } = body;

    // 필수 필드 검증
    if (!name || !team || !email || !employeeNumber) {
      return NextResponse.json(
        { message: "필수 필드(직원명, 팀명, 이메일, 사번)가 누락되었습니다." },
        { status: 400 }
      );
    }

    console.log(`📝 참석자 정보: ${name} (${employeeNumber}), ${team}, ${email}`);

    const supabase = getSupabaseAdminClient();
    const bucket = env.qrBucket;

    // QR 토큰 생성
    const qrToken = generateShortToken();
    const checkInUrl = `${env.appUrl}/check-in?token=${qrToken}`;

    console.log(`🔗 체크인 URL: ${checkInUrl}`);

    // QR 코드 생성
    const qrBuffer = await QRCode.toBuffer(checkInUrl, {
      errorCorrectionLevel: "M",
      type: "png",
      margin: 2,
      scale: 8
    });

    console.log(`✅ QR 코드 생성 완료`);

    // Storage에 업로드
    const safeTeamName = sanitizeForStorage(team);
    const filePath = `${safeTeamName}/${employeeNumber}.png`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, qrBuffer, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) {
      console.error(`❌ Storage 업로드 실패:`, uploadError);
      throw uploadError;
    }

    console.log(`✅ Storage 업로드 완료: ${filePath}`);

    // Public URL 생성
    const {
      data: { publicUrl }
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    // DB에 저장
    const { error: upsertError } = await supabase
      .from("attendees")
      .upsert(
        {
          employee_number: employeeNumber,
          name,
          team,
          email,
          qr_token: qrToken,
          qr_code_url: publicUrl,
          qr_code_storage_path: filePath,
          clothing_size: clothingSize || null,
          sports_team: sportsTeam || null
        },
        { onConflict: "employee_number" }
      )
      .select();

    if (upsertError) {
      console.error(`❌ DB 저장 실패:`, upsertError);
      throw upsertError;
    }

    console.log(`✅ DB 저장 완료`);
    console.log("=== 수동 참석자 등록 완료 ===");

    return NextResponse.json({
      success: true,
      message: "참석자가 성공적으로 등록되었습니다.",
      attendee: {
        name,
        team,
        email,
        employeeNumber,
        clothingSize,
        sportsTeam
      }
    });

  } catch (error) {
    console.error("❌ 참석자 등록 오류:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "참석자 등록 중 오류가 발생했습니다.",
        success: false
      },
      { status: 500 }
    );
  }
}