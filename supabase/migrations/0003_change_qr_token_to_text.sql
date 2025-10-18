-- qr_token을 uuid에서 text로 변경하여 짧은 토큰 지원

-- qr_token 컬럼의 타입을 text로 변경
alter table public.attendees alter column qr_token type text using qr_token::text;

-- 인덱스 추가 (빠른 토큰 조회를 위해)
create index if not exists attendees_qr_token_idx on public.attendees (qr_token);
