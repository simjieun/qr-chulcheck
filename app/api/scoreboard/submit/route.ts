import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

interface ScoreSubmission {
  eventName: string;
  teamName: string;
  rank: number;
  score: number;
}

export async function POST(request: Request) {
  console.log("=== 점수 입력 시작 ===");

  try {
    const body = await request.json();
    const { eventName, teamName, rank, score }: ScoreSubmission = body;

    // 필수 필드 검증
    if (!eventName || !teamName || rank === undefined || score === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "필수 필드(종목명, 팀명, 순위, 점수)가 누락되었습니다."
        },
        { status: 400 }
      );
    }

    console.log(`📝 점수 입력: ${eventName} - ${teamName} (${rank}등, ${score}점)`);

    const supabase = getSupabaseAdminClient();

    // Upsert: 종목명과 팀명이 같으면 업데이트, 없으면 삽입
    const { data, error } = await supabase
      .from("scoreboard")
      .upsert(
        {
          event_name: eventName,
          team_name: teamName,
          rank,
          score
        },
        { onConflict: "event_name,team_name" }
      )
      .select();

    if (error) {
      console.error(`❌ 점수 입력 실패:`, error);
      throw error;
    }

    console.log(`✅ 점수 입력 완료`);

    return NextResponse.json({
      success: true,
      message: "점수가 성공적으로 입력되었습니다.",
      data: data?.[0]
    });

  } catch (error) {
    console.error("❌ 점수 입력 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "점수 입력 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}