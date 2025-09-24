import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

interface DashboardStats {
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  checkedInPercentage: number;
}

export async function GET() {
  try {
    console.log("=== 대시보드 현황 조회 API 호출 ===");
    
    const supabase = getSupabaseAdminClient();

    // 전체 참석자 수 조회
    const { count: totalCount, error: totalError } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error("❌ 전체 참석자 조회 실패:", totalError.message);
      throw totalError;
    }

    // 체크인 완료한 참석자 수 조회
    const { count: checkedInCount, error: checkedInError } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .not('check_in_at', 'is', null);

    if (checkedInError) {
      console.error("❌ 체크인 참석자 조회 실패:", checkedInError.message);
      throw checkedInError;
    }

    const total = totalCount || 0;
    const checkedIn = checkedInCount || 0;
    const notCheckedIn = total - checkedIn;
    const checkedInPercentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    const stats: DashboardStats = {
      total,
      checkedIn,
      notCheckedIn,
      checkedInPercentage
    };

    console.log(`✅ 대시보드 현황: 전체 ${total}명, 출석 ${checkedIn}명, 미출석 ${notCheckedIn}명 (${checkedInPercentage}%)`);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("❌ 대시보드 조회 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "대시보드 데이터 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      },
      { status: 500 }
    );
  }
}