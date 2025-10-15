#!/usr/bin/env python3
"""
QR 코드 이메일 전송 스크립트
Gmail SMTP를 사용하여 이메일을 전송합니다.
"""

import os
import sys
import json
import smtplib
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from typing import Dict, Any

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

def send_qr_email(
    to_email: str,
    name: str,
    team: str,
    check_in_url: str,
    qr_image_base64: str,
    smtp_server: str,
    smtp_port: int,
    smtp_username: str,
    smtp_password: str,
    from_email: str
) -> Dict[str, Any]:
    """
    QR 코드 이메일 전송

    Args:
        to_email: 수신자 이메일
        name: 수신자 이름
        team: 팀명
        check_in_url: 체크인 URL
        qr_image_base64: QR 코드 이미지 (base64 인코딩)
        smtp_server: SMTP 서버 주소
        smtp_port: SMTP 포트
        smtp_username: SMTP 사용자명
        smtp_password: SMTP 비밀번호
        from_email: 발신자 이메일

    Returns:
        결과 딕셔너리 (success, message)
    """
    try:
        # 이메일 메시지 생성
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
        # base64 데이터에서 data:image/png;base64, 부분 제거
        if qr_image_base64.startswith('data:image'):
            qr_image_base64 = qr_image_base64.split(',')[1]

        qr_image_data = base64.b64decode(qr_image_base64)
        qr_image = MIMEImage(qr_image_data)
        qr_image.add_header('Content-ID', '<qr_code>')
        qr_image.add_header('Content-Disposition', 'inline', filename='qr_code.png')
        msg.attach(qr_image)

        # SMTP 서버 연결 및 이메일 전송
        print(f"📧 SMTP 서버 연결 중: {smtp_server}:{smtp_port}", file=sys.stderr)
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.set_debuglevel(0)  # 디버그 모드 (1로 설정하면 상세 로그 출력)
            server.starttls()  # TLS 시작

            print(f"🔐 SMTP 인증 중: {smtp_username}", file=sys.stderr)
            server.login(smtp_username, smtp_password)

            print(f"📨 이메일 전송 중: {to_email}", file=sys.stderr)
            server.send_message(msg)

        print(f"✅ 이메일 전송 성공: {to_email}", file=sys.stderr)
        return {
            "success": True,
            "message": f"이메일이 성공적으로 전송되었습니다: {to_email}"
        }

    except Exception as e:
        print(f"❌ 이메일 전송 실패: {str(e)}", file=sys.stderr)
        return {
            "success": False,
            "message": f"이메일 전송 실패: {str(e)}"
        }

def main():
    """메인 함수 - JSON 입력을 받아서 이메일 전송"""
    try:
        # stdin으로부터 JSON 데이터 읽기
        input_data = json.loads(sys.stdin.read())

        # 필수 파라미터 확인
        required_fields = [
            'to_email', 'name', 'team', 'check_in_url', 'qr_image_base64',
            'smtp_server', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email'
        ]

        for field in required_fields:
            if field not in input_data:
                raise ValueError(f"필수 파라미터 누락: {field}")

        # 이메일 전송
        result = send_qr_email(
            to_email=input_data['to_email'],
            name=input_data['name'],
            team=input_data['team'],
            check_in_url=input_data['check_in_url'],
            qr_image_base64=input_data['qr_image_base64'],
            smtp_server=input_data['smtp_server'],
            smtp_port=int(input_data['smtp_port']),
            smtp_username=input_data['smtp_username'],
            smtp_password=input_data['smtp_password'],
            from_email=input_data['from_email']
        )

        # 결과 출력 (JSON)
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0 if result['success'] else 1)

    except Exception as e:
        error_result = {
            "success": False,
            "message": f"오류 발생: {str(e)}"
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
