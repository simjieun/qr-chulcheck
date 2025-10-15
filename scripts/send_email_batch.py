#!/usr/bin/env python3
"""
QR 코드 배치 이메일 전송 스크립트
Gmail SMTP 연결을 재사용하여 여러 이메일을 효율적으로 전송합니다.
"""

import os
import sys
import json
import smtplib
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from typing import Dict, Any, List

def create_email_html(name: str, team: str, check_in_url: str) -> str:
    """HTML 이메일 본문 생성"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .qr-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .qr-image {{
                max-width: 200px;
                height: auto;
            }}
            .button {{
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>안녕하세요, {name}님!</h1>
                <p>{team} 팀 체크인용 QR 코드를 보내드립니다.</p>
            </div>

            <div class="qr-container">
                <img src="cid:qr_code" alt="QR Code" class="qr-image">
                <p>위의 QR 코드를 스캔하시거나 아래 버튼을 클릭해주세요.</p>
                <a href="{check_in_url}" class="button">체크인하기</a>
            </div>

            <div class="footer">
                <p>이 이메일은 자동으로 발송되었습니다.</p>
                <p>문의사항이 있으시면 관리자에게 연락해주세요.</p>
            </div>
        </div>
    </body>
    </html>
    """

def create_email_message(
    to_email: str,
    name: str,
    team: str,
    check_in_url: str,
    qr_image_base64: str,
    from_email: str
) -> MIMEMultipart:
    """이메일 메시지 객체 생성"""
    msg = MIMEMultipart('related')
    msg['Subject'] = 'QR 체크인 코드가 도착했습니다'
    msg['From'] = from_email
    msg['To'] = to_email

    # HTML 본문 추가
    html_body = create_email_html(name, team, check_in_url)
    msg_alternative = MIMEMultipart('alternative')
    msg.attach(msg_alternative)

    msg_html = MIMEText(html_body, 'html', 'utf-8')
    msg_alternative.attach(msg_html)

    # QR 코드 이미지 첨부
    if qr_image_base64.startswith('data:image'):
        qr_image_base64 = qr_image_base64.split(',')[1]

    qr_image_data = base64.b64decode(qr_image_base64)
    qr_image = MIMEImage(qr_image_data)
    qr_image.add_header('Content-ID', '<qr_code>')
    qr_image.add_header('Content-Disposition', 'inline', filename='qr_code.png')
    msg.attach(qr_image)

    return msg

def send_batch_emails(
    emails: List[Dict[str, str]],
    smtp_server: str,
    smtp_port: int,
    smtp_username: str,
    smtp_password: str,
    from_email: str
) -> List[Dict[str, Any]]:
    """
    배치로 이메일 전송 (하나의 SMTP 연결 재사용)

    Args:
        emails: 이메일 정보 리스트 (to_email, name, team, check_in_url, qr_image_base64)
        smtp_server: SMTP 서버 주소
        smtp_port: SMTP 포트
        smtp_username: SMTP 사용자명
        smtp_password: SMTP 비밀번호
        from_email: 발신자 이메일

    Returns:
        각 이메일의 전송 결과 리스트
    """
    results = []

    try:
        # SMTP 서버에 한 번만 연결
        print(f"🔌 SMTP 서버 연결 중: {smtp_server}:{smtp_port}", file=sys.stderr)
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=30)
        server.set_debuglevel(0)
        server.starttls()

        print(f"🔐 SMTP 인증 중: {smtp_username}", file=sys.stderr)
        server.login(smtp_username, smtp_password)

        print(f"📧 배치 이메일 전송 시작 (총 {len(emails)}개)", file=sys.stderr)

        # 각 이메일 전송
        for idx, email_data in enumerate(emails, 1):
            try:
                msg = create_email_message(
                    to_email=email_data['to_email'],
                    name=email_data['name'],
                    team=email_data['team'],
                    check_in_url=email_data['check_in_url'],
                    qr_image_base64=email_data['qr_image_base64'],
                    from_email=from_email
                )

                server.send_message(msg)

                print(f"✅ [{idx}/{len(emails)}] 이메일 전송 성공: {email_data['to_email']}", file=sys.stderr)
                results.append({
                    "success": True,
                    "email": email_data['to_email'],
                    "message": f"이메일이 성공적으로 전송되었습니다: {email_data['to_email']}"
                })

            except Exception as e:
                print(f"❌ [{idx}/{len(emails)}] 이메일 전송 실패: {email_data['to_email']} - {str(e)}", file=sys.stderr)
                results.append({
                    "success": False,
                    "email": email_data['to_email'],
                    "message": f"이메일 전송 실패: {str(e)}"
                })

        # SMTP 연결 종료
        server.quit()
        print(f"✅ SMTP 연결 종료 (성공: {sum(1 for r in results if r['success'])}/{len(results)})", file=sys.stderr)

    except Exception as e:
        print(f"❌ SMTP 연결 오류: {str(e)}", file=sys.stderr)
        # 연결 실패 시 모든 이메일을 실패로 처리
        for email_data in emails:
            results.append({
                "success": False,
                "email": email_data.get('to_email', 'unknown'),
                "message": f"SMTP 연결 실패: {str(e)}"
            })

    return results

def main():
    """메인 함수 - JSON 배치 입력을 받아서 이메일 전송"""
    try:
        # stdin으로부터 JSON 데이터 읽기
        input_data = json.loads(sys.stdin.read())

        # 필수 파라미터 확인
        if 'emails' not in input_data:
            raise ValueError("필수 파라미터 누락: emails")

        required_smtp_fields = ['smtp_server', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email']
        for field in required_smtp_fields:
            if field not in input_data:
                raise ValueError(f"필수 파라미터 누락: {field}")

        # 배치 이메일 전송
        results = send_batch_emails(
            emails=input_data['emails'],
            smtp_server=input_data['smtp_server'],
            smtp_port=int(input_data['smtp_port']),
            smtp_username=input_data['smtp_username'],
            smtp_password=input_data['smtp_password'],
            from_email=input_data['from_email']
        )

        # 결과 출력 (JSON)
        output = {
            "success": all(r['success'] for r in results),
            "total": len(results),
            "succeeded": sum(1 for r in results if r['success']),
            "failed": sum(1 for r in results if not r['success']),
            "results": results
        }

        print(json.dumps(output, ensure_ascii=False))
        sys.exit(0 if output['success'] else 1)

    except Exception as e:
        error_result = {
            "success": False,
            "message": f"오류 발생: {str(e)}",
            "total": 0,
            "succeeded": 0,
            "failed": 0,
            "results": []
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
