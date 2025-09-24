import Link from "next/link";
import { UploadForm } from "@/components/upload-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          홈으로 돌아가기
        </Link>
      </div>

      <header className="space-y-3">
        <p className="text-sm font-semibold text-blue-600">체육대회 출석 관리</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          직원 QR 코드 생성 및 이메일 발송
        </h1>
        <p className="max-w-2xl text-base text-slate-600">
          엑셀 파일을 업로드하면 각 직원의 출석용 QR 코드가 생성되고, 등록된 이메일로 자동 발송됩니다.
        </p>
      </header>

      <UploadForm />

      <section className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-600">
        <h2 className="text-base font-semibold text-slate-800">엑셀 파일 양식 안내</h2>
        <p className="mt-2">
          다음과 같이 <span className="font-semibold text-slate-900">직원명</span>, <span className="font-semibold text-slate-900">팀명</span>,
          <span className="font-semibold text-slate-900">이메일</span>, <span className="font-semibold text-slate-900">사번</span> 컬럼을 포함한 첫 번째 시트를 사용해주세요.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1">
          <li>엑셀 파일은 <strong>.xlsx</strong> 또는 <strong>.xls</strong> 형식만 지원합니다.</li>
          <li>사번은 숫자 또는 문자열 모두 허용되며 공백 없이 입력해주세요.</li>
          <li>중복 이메일 또는 사번이 있는 경우 마지막 행의 정보로 업데이트됩니다.</li>
        </ul>
      </section>
    </main>
  );
}