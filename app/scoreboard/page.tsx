'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScoreData {
  id: string;
  event_name: string;
  team_name: string;
  rank: number;
  score: number;
}

interface ScoreboardData {
  scores: ScoreData[];
  teamTotals: Record<string, number>;
  events: string[];
  teams: string[];
}

export default function ScoreboardPage() {
  const [data, setData] = useState<ScoreboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScoreboard();
    // 30초마다 자동 새로고침
    const interval = setInterval(fetchScoreboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchScoreboard = async () => {
    try {
      const response = await fetch('/api/scoreboard');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || '점수판을 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('점수판을 불러올 수 없습니다.');
      console.error('Scoreboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamColor = (team: string) => {
    const colors: Record<string, string> = {
      빨강: 'bg-red-500',
      노랑: 'bg-yellow-500',
      초록: 'bg-green-500',
      파랑: 'bg-blue-500'
    };
    return colors[team] || 'bg-slate-500';
  };

  const getTeamTextColor = (team: string) => {
    const colors: Record<string, string> = {
      빨강: 'text-red-600',
      노랑: 'text-yellow-600',
      초록: 'text-green-600',
      파랑: 'text-blue-600'
    };
    return colors[team] || 'text-slate-600';
  };

  const getScoreForTeamAndEvent = (teamName: string, eventName: string) => {
    if (!data) return null;
    return data.scores.find(s => s.team_name === teamName && s.event_name === eventName);
  };

  // 팀별 순위 계산
  const getTeamRankings = () => {
    if (!data) return [];
    return Object.entries(data.teamTotals)
      .map(([team, total]) => ({ team, total }))
      .sort((a, b) => b.total - a.total);
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
                href="/scoreboard/input"
                className="inline-flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                점수 입력
              </Link>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            🏆 엔육대 점수판
          </h1>
          <p className="mt-2 text-xl text-slate-600">
            실시간 팀별 점수 현황
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/4"></div>
              <div className="h-64 bg-slate-200 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
          </div>
        ) : data ? (
          <>
            {/* 팀별 총점 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {getTeamRankings().map((item, index) => (
                <div key={item.team} className="bg-white rounded-lg shadow p-6 relative overflow-hidden">
                  {index === 0 && (
                    <div className="absolute top-2 right-2 text-2xl">🥇</div>
                  )}
                  <div className={`w-16 h-16 ${getTeamColor(item.team)} rounded-full mx-auto mb-3`}></div>
                  <h3 className={`text-xl font-bold text-center ${getTeamTextColor(item.team)}`}>
                    {item.team}팀
                  </h3>
                  <p className="text-3xl font-bold text-center text-slate-900 mt-2">
                    {item.total}점
                  </p>
                  <p className="text-sm text-slate-500 text-center mt-1">
                    {index + 1}등
                  </p>
                </div>
              ))}
            </div>

            {/* 종목별 점수표 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-900">종목별 점수</h3>
                  <button
                    onClick={fetchScoreboard}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    새로고침
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      </th>
                      {data.teams.map(team => (
                        <th key={team} className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 ${getTeamColor(team)} rounded-full mb-1`}></div>
                            {team}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {data.events.map((event, eventIndex) => (
                      <tr key={event} className={eventIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {event}
                        </td>
                        {data.teams.map(team => {
                          const scoreData = getScoreForTeamAndEvent(team, event);
                          return (
                            <td key={team} className="px-6 py-4 whitespace-nowrap text-center">
                              {scoreData ? (
                                <div>
                                  <div className={`text-2xl font-bold ${getTeamTextColor(team)}`}>
                                    {scoreData.score}점
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {scoreData.rank}등
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        총점
                      </td>
                      {data.teams.map(team => (
                        <td key={team} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className={`text-2xl font-bold ${getTeamTextColor(team)}`}>
                            {data.teamTotals[team] || 0}점
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
