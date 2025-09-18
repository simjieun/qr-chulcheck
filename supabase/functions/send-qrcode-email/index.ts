import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { Resend } from "npm:resend@3.2.0";

interface Payload {
  to?: string;
  name?: string;
  team?: string;
  checkInUrl?: string;
  qrImageBase64?: string;
  attachmentFileName?: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const payload = (await req.json().catch(() => ({}))) as Payload;
  const { to, name, team, checkInUrl, qrImageBase64, attachmentFileName } = payload;

  if (!to || !qrImageBase64) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return Response.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);
  const from = Deno.env.get("EMAIL_FROM") ?? "attendance@example.com";

  const subject = `${team ?? "임직원"} 체육대회 QR 코드 안내`;
  const attendeeName = name ?? "임직원";

  await resend.emails.send({
    from,
    to,
    subject,
    html: `
      <p>${attendeeName}님 안녕하세요.</p>
      <p>체육대회 출석 확인을 위한 QR 코드를 안내드립니다.</p>
      <p>현장에서 아래 버튼을 눌러 출석을 완료하거나, 첨부된 QR 코드를 스캔해주세요.</p>
      ${checkInUrl ? `<p><a href="${checkInUrl}">체크인 바로가기</a></p>` : ""}
      <p>감사합니다.</p>
    `,
    attachments: [
      {
        filename: attachmentFileName ?? "qr-code.png",
        content: qrImageBase64,
        contentType: "image/png"
      }
    ]
  });

  return Response.json({ success: true });
});
