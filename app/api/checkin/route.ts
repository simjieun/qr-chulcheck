import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { AttendeeRow } from "@/types/database";

interface CheckinRequest {
  token: string;
}

interface CheckinResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    team: string;
    employeeId: string;
    isCheckedIn: boolean;
    alreadyCheckedIn?: boolean;
  };
  error?: string;
}

export async function POST(request: Request) {
  try {
    console.log("=== 체크인 API 호출 ===");
    
    const body: CheckinRequest = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "토큰이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    console.log(`🎫 체크인 토큰: ${token.substring(0, 20)}...`);

    const supabase = getSupabaseAdminClient();

    // 토큰으로 직원 정보 조회
    const { data: attendee, error: fetchError } = await supabase
      .from('attendees')
      .select('*')
      .eq('qr_token', token)
      .single();

    if (fetchError || !attendee) {
      console.log("❌ 유효하지 않은 토큰:", fetchError?.message);
      return NextResponse.json(
        { success: false, error: "유효하지 않은 QR 코드입니다." },
        { status: 400 }
      );
    }

    console.log(`👤 직원 정보: ${attendee.name} (${attendee.employee_number})`);

    // 이미 체크인했는지 확인
    if (attendee.is_checked_in) {
      console.log("⚠️ 이미 체크인한 직원");
      return NextResponse.json({
        success: true,
        data: {
          id: attendee.id,
          name: attendee.name,
          team: attendee.team,
          employeeId: attendee.employee_number,
          isCheckedIn: attendee.is_checked_in,
          alreadyCheckedIn: true
        }
      });
    }

    // 체크인 상태 업데이트
    const { data: updatedAttendee, error: updateError } = await supabase
      .from('attendees')
      .update({
        is_checked_in: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', attendee.id)
      .select()
      .single();

    if (updateError || !updatedAttendee) {
      console.error("❌ 체크인 업데이트 실패:", updateError?.message);
      return NextResponse.json(
        { success: false, error: "체크인 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
    
    console.log(`✅ 체크인 완료: ${attendee.name}`);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAttendee.id,
        name: updatedAttendee.name,
        team: updatedAttendee.team,
        employeeId: updatedAttendee.employee_number,
        isCheckedIn: updatedAttendee.is_checked_in,
        alreadyCheckedIn: false
      }
    });

  } catch (error) {
    console.error("❌ 체크인 처리 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "체크인 처리 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}

// 체크인 상태 조회 API (선택사항)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: "토큰이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 토큰으로 직원 정보 조회
    const { data: attendee, error: fetchError } = await supabase
      .from('attendees')
      .select('*')
      .eq('qr_token', token)
      .single();
    
    if (fetchError || !attendee) {
      return NextResponse.json(
        { success: false, error: "체크인 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: attendee.id,
        name: attendee.name,
        team: attendee.team,
        employeeId: attendee.employee_number,
        isCheckedIn: attendee.is_checked_in,
        alreadyCheckedIn: attendee.is_checked_in
      }
    });

  } catch (error) {
    console.error("❌ 체크인 조회 오류:", error);
    return NextResponse.json(
      { success: false, error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}