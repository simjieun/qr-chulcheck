import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("=== 참석자 목록 조회 시작 ===");
    
    const supabase = getSupabaseAdminClient();
    
    const { data: attendees, error } = await supabase
      .from("attendees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ 참석자 목록 조회 실패:", error);
      return NextResponse.json(
        { success: false, error: "참석자 목록을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    console.log(`✅ 참석자 목록 조회 성공: ${attendees?.length || 0}명`);
    
    return NextResponse.json({
      success: true,
      data: attendees || []
    });
    
  } catch (error) {
    console.error("❌ 참석자 목록 조회 중 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "서버 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }
}