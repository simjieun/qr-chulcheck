"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface DashboardStats {
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  checkedInPercentage: number;
}

interface Attendee {
  id: string;
  employee_number: string;
  name: string;
  team: string;
  email: string;
  is_checked_in: boolean;
  qr_code_url: string;
  clothing_size: string | null;
  sports_team: string | null;
}

interface AttendeeListResponse {
  success: boolean;
  data: Attendee[];
  error?: string;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    fetchAttendees();

    // 30초마다 데이터 새로고침
    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchAttendees();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // URL 쿼리 파라미터에서 filter 값 가져오기
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'checked_in', 'not_checked_in'].includes(filterParam)) {
      setFilter(filterParam as 'all' | 'checked_in' | 'not_checked_in');
    }
  }, [searchParams]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error || "데이터를 불러올 수 없습니다.");
      }
    } catch (err) {
      setError("데이터를 불러올 수 없습니다.");
      console.error("Dashboard fetch error:", err);
    }
  };

  const fetchAttendees = async () => {
    try {
      const response = await fetch('/api/attendees');
      const data: AttendeeListResponse = await response.json();

      if (data.success) {
        setAttendees(data.data);
        setError(null);
      } else {
        setError(data.error || "참석자 목록을 불러올 수 없습니다.");
      }
    } catch (err) {
      setError("참석자 목록을 불러올 수 없습니다.");
      console.error("Attendees fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateURLParams = (newFilter: 'all' | 'checked_in' | 'not_checked_in') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', newFilter);
    router.push(`${pathname}?${params.toString()}`);
  };

  const filteredAttendees = attendees.filter(attendee => {
    // 필터 적용
    if (filter === 'checked_in' && !attendee.is_checked_in) return false;
    if (filter === 'not_checked_in' && attendee.is_checked_in) return false;

    // 검색어 적용
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        attendee.name.toLowerCase().includes(term) ||
        attendee.team.toLowerCase().includes(term) ||
        attendee.employee_number.includes(term) ||
        attendee.email.toLowerCase().includes(term)
      );
    }

    return true;
  });

  const getFilterCounts = () => {
    const total = attendees.length;
    const checkedIn = attendees.filter(a => a.is_checked_in).length;
    const notCheckedIn = total - checkedIn;

    return { total, checkedIn, notCheckedIn };
  };

  const { total, checkedIn, notCheckedIn } = getFilterCounts();

  const handleManualCheckIn = async (attendeeId: string, attendeeName: string) => {
    if (!confirm(`${attendeeName}님을 출석 처리하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('/api/manual-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ attendeeId })
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        // 데이터 새로고침
        fetchDashboardStats();
        fetchAttendees();
      } else {
        alert(result.message || '출석 처리에 실패했습니다.');
      }
    } catch (err) {
      alert('출석 처리 중 오류가 발생했습니다.');
      console.error('Manual check-in error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 내비게이션 */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-red-600 tracking-tight">Encar</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/scoreboard"
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                점수판
              </Link>
              <Link
                href="/attendee-register"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                참석자 등록
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            2025 엔카닷컴 체육대회
          </h1>
          <p className="mt-2 text-xl text-slate-600">
            실시간 출석 현황
          </p>
        </div>

        {/* 통계 카드들 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* 전체 참석자 */}
            <div
              onClick={() => {
                setFilter('all');
                updateURLParams('all');
              }}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">전체 참석자</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}명</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 출석자 */}
            <div
              onClick={() => {
                setFilter('checked_in');
                updateURLParams('checked_in');
              }}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">출석자</p>
                  <p className="text-2xl font-bold text-green-600">{stats.checkedIn}명</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 미출석자 */}
            <div
              onClick={() => {
                setFilter('not_checked_in');
                updateURLParams('not_checked_in');
              }}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">미출석자</p>
                  <p className="text-2xl font-bold text-red-600">{stats.notCheckedIn}명</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 출석률 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">출석률</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.checkedInPercentage}%</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 진행률 바 */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-900">전체 출석 현황</h3>
              <button
                onClick={() => {
                  fetchDashboardStats();
                  fetchAttendees();
                }}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </button>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${stats.checkedInPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>출석: {stats.checkedIn}명</span>
              <span>미출석: {stats.notCheckedIn}명</span>
            </div>
          </div>
        )}

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* 필터 버튼들 */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setFilter('all');
                  updateURLParams('all');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                전체 ({total})
              </button>
              <button
                onClick={() => {
                  setFilter('checked_in');
                  updateURLParams('checked_in');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === 'checked_in'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                출석 ({checkedIn})
              </button>
              <button
                onClick={() => {
                  setFilter('not_checked_in');
                  updateURLParams('not_checked_in');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === 'not_checked_in'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                미출석 ({notCheckedIn})
              </button>
            </div>

            {/* 검색 입력 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="이름, 팀, 사번, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
              />
            </div>
          </div>
        </div>

        {/* 참석자 목록 */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-6 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">
                {filter === 'all' && '전체 참석자'}
                {filter === 'checked_in' && '출석자'}
                {filter === 'not_checked_in' && '미출석자'}
                {searchTerm && ` (${filteredAttendees.length}명 검색됨)`}
              </h3>
            </div>

            {filteredAttendees.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-slate-900">참석자가 없습니다</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {searchTerm ? '검색 조건에 맞는 참석자가 없습니다.' : '현재 조건에 맞는 참석자가 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredAttendees.map((attendee) => (
                  <div key={attendee.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                          attendee.is_checked_in ? 'bg-green-500' : 'bg-slate-400'
                        }`}>
                          {attendee.is_checked_in ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            attendee.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-slate-900">{attendee.name}</h4>
                          <div className="text-sm text-slate-500 space-y-1">
                            <p>팀: {attendee.team} | 사번: {attendee.employee_number}</p>
                            <p>이메일: {attendee.email}</p>
                            {(attendee.clothing_size || attendee.sports_team) && (
                              <p>
                                {attendee.clothing_size && `옷사이즈: ${attendee.clothing_size}`}
                                {attendee.clothing_size && attendee.sports_team && ' | '}
                                {attendee.sports_team && `체육대회팀: ${attendee.sports_team}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          attendee.is_checked_in
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attendee.is_checked_in ? '출석' : '미출석'}
                        </span>
                        {!attendee.is_checked_in && (
                          <button
                            onClick={() => handleManualCheckIn(attendee.id, attendee.name)}
                            className="inline-flex items-center px-3 py-1 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            출석 처리
                          </button>
                        )}
                        <a
                          href={attendee.qr_code_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                        >
                          QR 코드
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
