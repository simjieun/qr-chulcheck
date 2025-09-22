import { NextResponse } from "next/server";
import { Resend } from "resend";
import React from "react";
import { EmailTemplate } from "@/components/email-template";
import { env, assertServerEnv } from "@/lib/env";

const resend = new Resend(env.resendApiKey);

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
    console.log("=== 이메일 전송 API 시작 ===");
    
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

    // RESEND_API_KEY 확인
    if (!env.resendApiKey) {
      console.log("❌ RESEND_API_KEY가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "이메일 서비스가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 개발/테스트 모드: 본인 이메일로만 전송 가능
    const testMode = !env.resendApiKey || env.resendApiKey.startsWith('re_');
    const finalRecipient = testMode ? env.testEmail : to;
    
    console.log(`📧 이메일 전송 시작: ${to} ${testMode ? `(테스트 모드: ${finalRecipient}로 전송)` : ''}`);

    const { data, error } = await resend.emails.send({
      from: "체육대회 <onboarding@resend.dev>",
      to: [finalRecipient],
      subject: `${team} 체육대회 QR 코드 안내`,
      react: EmailTemplate({
        firstName: name,
        team: team,
        checkInUrl: checkInUrl,
        qrCodeUrl: qrCodeUrl,
      }) as React.ReactElement,
      attachments: [
        {
          filename: attachmentFileName || `${name}-qr-code.png`,
          content: qrImageBase64,
          contentType: "image/png",
        },
      ],
    });

    if (error) {
      console.log("❌ 이메일 전송 실패:", error);
      return NextResponse.json(
        { error: "이메일 전송에 실패했습니다.", details: error },
        { status: 500 }
      );
    }

    console.log("✅ 이메일 전송 성공:", data);
    return NextResponse.json({ 
      success: true, 
      data,
      message: "이메일이 성공적으로 전송되었습니다." 
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
