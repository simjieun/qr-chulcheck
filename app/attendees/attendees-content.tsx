"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface Attendee {
  id: string;
  employee_number: string;
  name: string;
  team: string;
  email: string;
  check_in_at: string | null;
  qr_code_url: string;
}

interface AttendeeListResponse {
  success: boolean;
  data: Attendee[];
  error?: string;
}

export default function AttendeesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // URL 파라미터 업데이트 함수
  const updateURLParams = (newFilter: 'all' | 'checked_in' | 'not_checked_in') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', newFilter);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    fetchAttendees();

    // URL 쿼리 파라미터에서 filter 값 가져오기
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'checked_in', 'not_checked_in'].includes(filterParam)) {
      setFilter(filterParam as 'all' | 'checked_in' | 'not_checked_in');
    }
  }, [searchParams]);

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

  const filteredAttendees = attendees.filter(attendee => {
    // 필터 적용
    if (filter === 'checked_in' && !attendee.check_in_at) return false;
    if (filter === 'not_checked_in' && attendee.check_in_at) return false;

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
    const checkedIn = attendees.filter(a => a.check_in_at).length;
    const notCheckedIn = total - checkedIn;

    return { total, checkedIn, notCheckedIn };
  };

  const { total, checkedIn, notCheckedIn } = getFilterCounts();

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <>
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          참석자 목록
        </h1>
        <p className="mt-2 text-xl text-slate-600">
          전체 참석자 현황 및 출석 상태
        </p>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">전체 참석자</p>
              <p className="text-2xl font-bold text-slate-900">{total}명</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">출석자</p>
              <p className="text-2xl font-bold text-green-600">{checkedIn}명</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">미출석자</p>
              <p className="text-2xl font-bold text-red-600">{notCheckedIn}명</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

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
                        attendee.check_in_at ? 'bg-green-500' : 'bg-slate-400'
                      }`}>
                        {attendee.check_in_at ? (
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
                          {attendee.check_in_at && (
                            <p className="text-green-600 font-medium">
                              출석 시간: {formatDateTime(attendee.check_in_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        attendee.check_in_at 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {attendee.check_in_at ? '출석' : '미출석'}
                      </span>
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
    </>
  );
}
