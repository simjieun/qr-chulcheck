import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  console.log("=== 수동 출석 처리 시작 ===");

  try {
    const body = await request.json();
    const { attendeeId } = body;

    if (!attendeeId) {
      return NextResponse.json(
        { success: false, message: "참석자 ID가 누락되었습니다." },
        { status: 400 }
      );
    }

    console.log(`📝 참석자 ID: ${attendeeId} 출석 처리 중...`);

    const supabase = getSupabaseAdminClient();

    // 참석자 정보 조회
    const { data: attendee, error: fetchError } = await supabase
      .from("attendees")
      .select("*")
      .eq("id", attendeeId)
      .single();

    if (fetchError || !attendee) {
      console.error(`❌ 참석자 조회 실패:`, fetchError);
      return NextResponse.json(
        { success: false, message: "참석자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 출석한 경우
    if (attendee.is_checked_in) {
      return NextResponse.json(
        { success: false, message: "이미 출석 처리된 참석자입니다." },
        { status: 400 }
      );
    }

    // 출석 처리
    const { error: updateError } = await supabase
      .from("attendees")
      .update({ is_checked_in: true })
      .eq("id", attendeeId);

    if (updateError) {
      console.error(`❌ 출석 처리 실패:`, updateError);
      throw updateError;
    }

    console.log(`✅ ${attendee.name} 출석 처리 완료`);

    return NextResponse.json({
      success: true,
      message: `${attendee.name}님이 출석 처리되었습니다.`,
      data: {
        id: attendee.id,
        name: attendee.name,
        is_checked_in: true
      }
    });

  } catch (error) {
    console.error("❌ 수동 출석 처리 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "출석 처리 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}