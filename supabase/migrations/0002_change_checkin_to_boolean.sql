-- check_in_at (timestamptz)을 is_checked_in (boolean)으로 변경
-- 기존 데이터가 있는 경우 check_in_at이 null이 아니면 true로 변환

-- 임시로 새 컬럼 추가
alter table public.attendees add column if not exists is_checked_in boolean not null default false;

-- 기존 데이터 마이그레이션: check_in_at이 null이 아니면 is_checked_in을 true로 설정
update public.attendees
set is_checked_in = true
where check_in_at is not null;

-- 기존 check_in_at 컬럼 삭제
alter table public.attendees drop column if exists check_in_at;

