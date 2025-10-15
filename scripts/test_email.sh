#!/bin/bash
# 이메일 전송 테스트 스크립트

# 테스트용 작은 QR 코드 이미지 (1x1 PNG)
TEST_QR_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# 환경 변수 로드
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# 테스트 데이터 생성
cat <<EOF | python3 scripts/send_email.py
{
  "to_email": "${SMTP_USERNAME}",
  "name": "테스트 사용자",
  "team": "테스트 팀",
  "check_in_url": "http://localhost:3000/check-in?token=test1234",
  "qr_image_base64": "data:image/png;base64,${TEST_QR_BASE64}",
  "smtp_server": "${SMTP_SERVER}",
  "smtp_port": ${SMTP_PORT},
  "smtp_username": "${SMTP_USERNAME}",
  "smtp_password": "${SMTP_PASSWORD}",
  "from_email": "${SMTP_FROM_EMAIL}"
}
EOF

echo ""
echo "✅ 테스트 완료!"
echo "📧 발신자: ${SMTP_FROM_EMAIL}"
echo "📧 수신자: ${SMTP_USERNAME}"