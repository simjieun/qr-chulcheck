"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface CheckinData {
  id: string;
  name: string;
  team: string;
  employeeId: string;
  checkedInAt: string;
  alreadyCheckedIn?: boolean;
}

export default function CheckinPage() {
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const qrToken = searchParams.get("token");

  useEffect(() => {
    if (!qrToken) {
      setError("유효하지 않은 QR 코드입니다.");
      setIsLoading(false);
      return;
    }

    // QR 코드 데이터 조회 및 체크인 처리
    handleCheckin(qrToken);
  }, [qrToken]);

  const handleCheckin = async (token: string) => {
    try {
      console.log("🎫 체크인 시도:", token);
      
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "체크인 처리에 실패했습니다.");
      }

      if (data.success && data.data) {
        console.log("✅ 체크인 성공:", data.data);
        setCheckinData(data.data);
        setIsCheckedIn(true);
        
        // 이미 체크인한 경우 메시지 표시
        if (data.data.alreadyCheckedIn) {
          console.log("⚠️ 이미 체크인된 사용자");
        }
      } else {
        throw new Error("체크인 응답이 올바르지 않습니다.");
      }
      
    } catch (err) {
      console.error("❌ 체크인 오류:", err);
      const errorMessage = err instanceof Error ? err.message : "체크인 처리 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h1 className="text-2xl font-bold text-slate-900">체크인 처리중...</h1>
          <p className="text-slate-600">잠시만 기다려주세요.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-12">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">체크인 실패</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="text-center space-y-8 w-full">
        {isCheckedIn && (
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {isCheckedIn ? (checkinData?.alreadyCheckedIn ? "이미 체크인됨" : "체크인 완료!") : "체크인"}
          </h1>
          <p className="text-slate-600 mb-8">
            {isCheckedIn ? 
              (checkinData?.alreadyCheckedIn ? 
                "이미 체크인하신 기록이 있습니다." : 
                "성공적으로 출석 체크되었습니다."
              ) : 
              "출석을 확인하고 있습니다."
            }
          </p>
        </div>

        {checkinData && (
          <div className="w-full bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-4">출석 정보</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">이름</span>
                <span className="font-medium text-slate-900">{checkinData.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">팀</span>
                <span className="font-medium text-slate-900">{checkinData.team}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">사번</span>
                <span className="font-medium text-slate-900">{checkinData.employeeId}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">체크인 시간</span>
                <span className="font-medium text-slate-900">
                  {new Date(checkinData.checkedInAt).toLocaleString("ko-KR")}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="w-full space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}