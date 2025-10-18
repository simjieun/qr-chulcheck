import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

// 종목 목록 (순서대로)
export const EVENTS = [
  "글래디 에이터",
  "지네발 릴레이",
  "초대형 굴렁쇠",
  "도넛 릴레이",
  "박터트리기",
  "인간 컬링",
  "계주"
] as const;

// 팀 목록
export const TEAMS = ["빨강", "노랑", "초록", "파랑"] as const;

export async function GET() {
  console.log("=== 점수판 조회 시작 ===");

  try {
    const supabase = getSupabaseAdminClient();

    // 모든 점수 데이터 가져오기
    const { data: scores, error } = await supabase
      .from("scoreboard")
      .select("*")
      .order("event_name", { ascending: true })
      .order("rank", { ascending: true });

    if (error) {
      console.error("❌ 점수판 조회 실패:", error);
      throw error;
    }

    // 팀별 총점 계산
    const teamTotals = TEAMS.reduce((acc, team) => {
      const teamScores = scores?.filter(s => s.team_name === team) || [];
      const total = teamScores.reduce((sum, s) => sum + s.score, 0);
      acc[team] = total;
      return acc;
    }, {} as Record<string, number>);

    console.log("✅ 점수판 조회 성공");

    return NextResponse.json({
      success: true,
      data: {
        scores: scores || [],
        teamTotals,
        events: EVENTS,
        teams: TEAMS
      }
    });

  } catch (error) {
    console.error("❌ 점수판 조회 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "점수판을 불러올 수 없습니다."
      },
      { status: 500 }
    );
  }
}
