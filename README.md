# qr-chulcheck

체육대회날 직원들의 출석체크를 위한 QR 코드 관리 서비스입니다. 엑셀 명단을 업로드하면 직원별 QR 코드를 생성하고 지정된 이메일로 발송합니다.

> **패키지 관리자**: 프로젝트는 Yarn Berry(버전 4.9.4)를 기본 패키지 관리자로 사용하도록 설정되어 있습니다. `.yarnrc.yml`과 `.yarn/` 디렉터리를 그대로 유지한 채 `yarn` 명령을 사용해 주세요.

## 주요 기능

- 엑셀(`직원명`, `팀명`, `이메일`, `사번`) 업로드 시 직원별 출석 토큰 생성
- Supabase Storage 에 QR 코드 이미지 저장 및 공개 URL 생성
- Supabase Edge Function 을 통해 QR 코드가 첨부된 이메일 발송
- 업로드 결과 요약을 통해 성공/실패 내역 확인

## 기술 스택

- [Next.js](https://nextjs.org/) 14 (App Router, Server Actions)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/) Progress 컴포넌트
- [Supabase](https://supabase.com/) (Postgres, Storage, Edge Functions)
- [Resend](https://resend.com/) (이메일 발송 – Supabase Edge Function 내에서 사용)

## 프로젝트 실행 방법

1. 의존성 설치

   Yarn Berry 환경이 포함되어 있으므로 다음 명령으로 의존성을 설치합니다.

   ```bash
   yarn install
   ```

2. 환경 변수 설정 – `.env.example` 파일을 참고하여 `.env.local` 파일을 생성합니다.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   SUPABASE_QR_BUCKET=qr-codes
   APP_URL=http://localhost:3000
   RESEND_API_KEY=your-resend-api-key
   EMAIL_FROM=attendance@your-domain.com
   ```

3. Supabase 설정

   - `supabase/migrations/0001_create_attendees.sql`을 실행하여 `attendees` 테이블과 트리거를 생성합니다.
   - `qr-codes` 이름의 Storage 버킷을 생성하고 Public 접근을 허용합니다.
   - Supabase CLI 또는 대시보드를 이용해 `supabase/functions/send-qrcode-email` Edge Function 을 배포하고, `RESEND_API_KEY`, `EMAIL_FROM` 환경 변수를 설정합니다.

4. 개발 서버 실행

   ```bash
   yarn dev
   ```

   브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 업로드 화면을 확인합니다.

## 업로드 엑셀 양식

- 첫 번째 시트의 헤더는 `직원명`, `팀명`, `이메일`, `사번` 순서를 권장합니다.
- 중복 사번이 존재할 경우 마지막 행의 데이터로 덮어씁니다.
- 필수 컬럼 중 하나라도 비어있는 경우 해당 행은 실패 목록에 표시됩니다.

## API 개요

- `POST /api/upload-excel`
  - FormData(`file`) 형태의 엑셀 파일을 수신합니다.
  - 직원별 QR 코드를 생성하여 Supabase Storage 에 저장합니다.
  - `attendees` 테이블에 직원 정보를 upsert 합니다.
  - Supabase Edge Function(`send-qrcode-email`)을 호출해 이메일을 발송합니다.
  - 성공/실패 요약을 JSON 으로 반환합니다.

## 향후 구현 예정

- QR 코드 스캔 페이지 및 실시간 출석 체크 반영
- 홈 화면에서 참석/미참석 인원 현황 대시보드 제공

