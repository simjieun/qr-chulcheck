import * as React from "react";
import {
  Html,
  Body,
  Container,
  Text,
  Heading,
  Button,
  Img,
  Section,
  Hr,
} from "@react-email/components";

interface EmailTemplateProps {
  firstName: string;
  team: string;
  checkInUrl: string;
  qrCodeUrl: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  team,
  checkInUrl,
  qrCodeUrl,
}) => (
  <Html>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          {/* 헤더 */}
          <Heading style={h1}>🏃‍♂️ 체육대회 QR 코드 안내</Heading>
          
          {/* 인사말 */}
          <Text style={text}>
            안녕하세요, <strong>{firstName}</strong>님!
          </Text>
          
          <Text style={text}>
            <strong>{team}</strong> 팀 체육대회 출석 확인을 위한 QR 코드를 안내드립니다.
          </Text>

          {/* QR 코드 섹션 */}
          <Section style={qrSection}>
            <Text style={qrTitle}>📱 출석 확인 QR 코드</Text>
            <Img
              src={qrCodeUrl}
              alt="체육대회 출석 확인 QR 코드"
              width="200"
              height="200"
              style={qrImage}
            />
            <Text style={qrDescription}>
              현장에서 위 QR 코드를 스캔하여 출석을 완료해주세요
            </Text>
          </Section>

          <Hr style={hr} />

          {/* 버튼 섹션 */}
          <Section style={buttonSection}>
            <Text style={text}>
              QR 코드 스캔이 어려우시다면 아래 버튼을 눌러주세요:
            </Text>
            <Button
              style={button}
              href={checkInUrl}
            >
              ✅ 체크인 바로가기
            </Button>
          </Section>

          <Hr style={hr} />

          {/* 안내사항 */}
          <Section style={infoSection}>
            <Text style={infoTitle}>📋 안내사항</Text>
            <Text style={infoText}>
              • 체육대회 당일 현장에서 QR 코드를 스캔해주세요<br />
              • 출석 확인은 체육대회 시작 전까지 완료해주세요<br />
              • 문의사항이 있으시면 담당자에게 연락해주세요
            </Text>
          </Section>

          {/* 푸터 */}
          <Text style={footer}>
            체육대회에서 뵙겠습니다! 🎉<br />
            감사합니다.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// 스타일 정의
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const box = {
  padding: "0 48px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const qrSection = {
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
};

const qrTitle = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const qrImage = {
  margin: "0 auto 16px",
  border: "2px solid #e1e5e9",
  borderRadius: "8px",
};

const qrDescription = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0",
  textAlign: "center" as const,
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#007ee6",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  margin: "16px 0",
};

const hr = {
  borderColor: "#e1e5e9",
  margin: "20px 0",
};

const infoSection = {
  margin: "24px 0",
  padding: "20px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
};

const infoTitle = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "26px",
  margin: "0 0 12px",
};

const infoText = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  textAlign: "center" as const,
  marginTop: "32px",
};

export default EmailTemplate;
