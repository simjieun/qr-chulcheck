'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const EVENTS = [
  "글래디 에이터",
  "지네발 릴레이",
  "초대형 굴렁쇠",
  "도넛 릴레이",
  "박터트리기",
  "인간 컬링",
  "계주"
];

const TEAMS = ["빨강", "노랑", "초록", "파랑"];

const DEFAULT_SCORES = {
  1: 50,
  2: 30,
  3: 20,
  4: 10
};

export default function ScoreInputPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    eventName: '',
    teamName: '',
    rank: 1,
    score: DEFAULT_SCORES[1]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scoreboard/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '점수 입력에 실패했습니다.');
      }

      alert('점수가 성공적으로 입력되었습니다!');

      // 폼 초기화
      setFormData({
        eventName: '',
        teamName: '',
        rank: 1,
        score: DEFAULT_SCORES[1]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRankChange = (rank: number) => {
    setFormData(prev => ({
      ...prev,
      rank,
      score: DEFAULT_SCORES[rank as keyof typeof DEFAULT_SCORES]
    }));
  };

  const getTeamColor = (team: string) => {
    const colors: Record<string, string> = {
      빨강: 'border-red-500 bg-red-50',
      노랑: 'border-yellow-500 bg-yellow-50',
      초록: 'border-green-500 bg-green-50',
      파랑: 'border-blue-500 bg-blue-50'
    };
    return colors[team] || 'border-slate-300 bg-white';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 내비게이션 */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-red-600 tracking-tight">
                Encar
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/scoreboard"
                className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                점수판 보기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">점수 입력</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 종목 선택 */}
            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 mb-2">
                종목 <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {EVENTS.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, eventName: event }))}
                    className={`px-4 py-3 text-left rounded-md border-2 transition-colors ${
                      formData.eventName === event
                        ? 'border-red-500 bg-red-50 text-red-900 font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>

            {/* 팀 선택 */}
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium text-slate-700 mb-2">
                팀 <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TEAMS.map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, teamName: team }))}
                    className={`px-4 py-3 rounded-md border-2 font-medium transition-colors ${
                      formData.teamName === team
                        ? getTeamColor(team) + ' border-2'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {team}팀
                  </button>
                ))}
              </div>
            </div>

            {/* 순위 선택 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                순위 <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((rank) => (
                  <button
                    key={rank}
                    type="button"
                    onClick={() => handleRankChange(rank)}
                    className={`px-4 py-3 rounded-md border-2 font-medium transition-colors ${
                      formData.rank === rank
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {rank}등
                  </button>
                ))}
              </div>
            </div>

            {/* 점수 입력 */}
            <div>
              <label htmlFor="score" className="block text-sm font-medium text-slate-700 mb-1">
                점수 <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="score"
                name="score"
                required
                value={formData.score}
                onChange={(e) => setFormData(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                placeholder="점수를 입력하세요"
              />
              <p className="mt-1 text-sm text-slate-500">
                기본 점수: 1등 50점, 2등 30점, 3등 20점, 4등 10점
              </p>
            </div>

            {/* 입력 요약 */}
            {formData.eventName && formData.teamName && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-medium text-blue-900 mb-2">입력 내용 확인</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>종목: <span className="font-medium">{formData.eventName}</span></p>
                  <p>팀: <span className="font-medium">{formData.teamName}팀</span></p>
                  <p>순위: <span className="font-medium">{formData.rank}등</span></p>
                  <p>점수: <span className="font-medium text-lg">{formData.score}점</span></p>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading || !formData.eventName || !formData.teamName}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
              >
                {loading ? '입력 중...' : '점수 입력'}
              </button>
              <Link
                href="/scoreboard"
                className="flex-1 text-center border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors font-medium"
              >
                취소
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
