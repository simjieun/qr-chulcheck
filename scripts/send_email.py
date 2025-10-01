#!/usr/bin/env python3
import smtplib
import sys
import json
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.base import MIMEBase
from email import encoders
import os
from pathlib import Path

def send_qr_email(email_data):
    """
    QR 코드가 포함된 이메일을 전송하는 함수

    Args:
        email_data (dict): 이메일 전송에 필요한 데이터
            - to_email: 수신자 이메일
            - to_name: 수신자 이름
            - qr_code_base64: QR 코드 이미지 (base64)
            - check_in_url: 체크인 URL
    """

    # 받은 email_data 로깅 (stderr로 출력하여 JSON 파싱 방해 안함)
    print(f"[LOG] send_qr_email 함수로 전달받은 email_data: {json.dumps(email_data, ensure_ascii=False, indent=2)}", file=sys.stderr)
    print(f"[LOG] to_email 값: {email_data.get('to_email', 'NOT_FOUND')}", file=sys.stderr)

    # SMTP 서버 설정 (Gmail 예시 - 필요에 따라 변경)
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')
    from_email = os.getenv('SMTP_FROM_EMAIL')

    if not all([smtp_username, smtp_password, from_email]):
        raise ValueError("SMTP 환경변수가 설정되지 않았습니다: SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL")

    # 이메일 메시지 생성
    msg = MIMEMultipart('related')
    msg['From'] = from_email
    msg['To'] = email_data['to_email']
    msg['Subject'] = 'QR 체크인 코드가 도착했습니다'

    # HTML 이메일 본문 생성
    html_body = f"""
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
                <h1>안녕하세요, {email_data['to_name']}님!</h1>
                <p>{email_data.get('team', '')} 팀 체크인용 QR 코드를 보내드립니다.</p>
            </div>
            
            <div class="qr-container">
                <img src="cid:qr_code" alt="QR Code" class="qr-image">
                <p>위의 QR 코드를 스캔하시거나 아래 버튼을 클릭해주세요.</p>
                <a href="{email_data['check_in_url']}" class="button">체크인하기</a>
            </div>
            
            <div class="footer">
                <p>이 이메일은 자동으로 발송되었습니다.</p>
                <p>문의사항이 있으시면 관리자에게 연락해주세요.</p>
            </div>
        </div>
    </body>
    </html>
    """

    # HTML 본문 추가
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    # QR 코드 이미지 첨부
    if email_data.get('qr_code_base64'):
        # base64 데이터에서 data:image/png;base64, 제거
        qr_data = email_data['qr_code_base64']
        if qr_data.startswith('data:image'):
            qr_data = qr_data.split(',')[1]

        # base64 디코딩
        qr_image_data = base64.b64decode(qr_data)

        # 이미지 첨부 (인라인으로 표시하기 위해 Content-ID 설정)
        qr_image = MIMEImage(qr_image_data)
        qr_image.add_header('Content-ID', '<qr_code>')
        qr_image.add_header('Content-Disposition', 'inline', filename='qr_code.png')
        msg.attach(qr_image)

    # SMTP 서버에 연결하여 이메일 전송
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)

        return {"success": True, "message": f"이메일이 성공적으로 전송되었습니다: {email_data['to_email']}"}

    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    """
    명령행에서 호출될 때 실행되는 메인 함수
    """
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "사용법: python send_email.py '<json_data>'"}))
        sys.exit(1)

    try:
        # JSON 데이터 파싱
        print(f"[LOG] 명령행에서 받은 원시 데이터: {sys.argv[1]}", file=sys.stderr)
        email_data = json.loads(sys.argv[1])
        print(f"[LOG] 파싱된 email_data: {json.dumps(email_data, ensure_ascii=False, indent=2)}", file=sys.stderr)

        # 필수 필드 검증
        required_fields = ['to_email', 'to_name', 'check_in_url']
        for field in required_fields:
            if field not in email_data:
                raise ValueError(f"필수 필드가 없습니다: {field}")

        # 이메일 전송
        result = send_qr_email(email_data)
        print(json.dumps(result, ensure_ascii=False))

        if not result["success"]:
            sys.exit(1)

    except json.JSONDecodeError:
        print(json.dumps({"success": False, "error": "잘못된 JSON 형식입니다"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
