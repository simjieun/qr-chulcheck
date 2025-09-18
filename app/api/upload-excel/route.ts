import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import * as QRCode from "qrcode";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { env } from "@/lib/env";
import { sendQrEmail } from "@/lib/email";
import type { EmployeeRow, NormalizedEmployee } from "@/types/attendance";
import { read, utils } from "xlsx";

interface UploadResult {
  total: number;
  stored: number;
  emailed: number;
  failures: Array<{ row: number; reason: string; identifier?: string }>;
}

export const runtime = "nodejs";

function normalizeRow(row: EmployeeRow): NormalizedEmployee | null {
  const name = String(row["직원명"] ?? "").trim();
  const team = String(row["팀명"] ?? "").trim();
  const email = String(row["이메일"] ?? "").trim();
  const employeeNumberRaw = row["사번"];
  const employeeNumber = typeof employeeNumberRaw === "number"
    ? String(employeeNumberRaw)
    : String(employeeNumberRaw ?? "").trim();

  if (!name || !team || !email || !employeeNumber) {
    return null;
  }

  return { name, team, email, employeeNumber };
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { message: "엑셀 파일이 포함되지 않았습니다." },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
  ];
  if (file.type && !allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { message: "지원하지 않는 파일 형식입니다." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json(
      { message: "엑셀 파일에 시트가 존재하지 않습니다." },
      { status: 400 }
    );
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = utils.sheet_to_json<EmployeeRow>(sheet, { defval: "" });

  const result: UploadResult = {
    total: rows.length,
    stored: 0,
    emailed: 0,
    failures: []
  };

  if (!rows.length) {
    return NextResponse.json(result);
  }

  const supabase = getSupabaseAdminClient();
  const bucket = env.qrBucket;

  for (const [index, row] of rows.entries()) {
    const normalized = normalizeRow(row);
    if (!normalized) {
      result.failures.push({
        row: index + 2,
        reason: "필수 값(직원명, 팀명, 이메일, 사번) 중 누락된 항목이 있습니다."
      });
      continue;
    }

    try {
      const qrToken = randomUUID();
      const checkInUrl = `${env.appUrl}/check-in?token=${qrToken}`;
      const qrBuffer = await QRCode.toBuffer(checkInUrl, {
        errorCorrectionLevel: "M",
        type: "png",
        margin: 2,
        scale: 8
      });

      const filePath = `${normalized.team}/${normalized.employeeNumber}.png`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, qrBuffer, {
          contentType: "image/png",
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      const { error: upsertError } = await supabase
        .from("attendees")
        .upsert(
          {
            employee_number: normalized.employeeNumber,
            name: normalized.name,
            team: normalized.team,
            email: normalized.email,
            qr_token: qrToken,
            qr_code_url: publicUrl,
            qr_code_storage_path: filePath,
            email_sent_at: new Date().toISOString()
          },
          { onConflict: "employee_number" }
        );

      if (upsertError) {
        throw upsertError;
      }

      await sendQrEmail({
        to: normalized.email,
        name: normalized.name,
        team: normalized.team,
        checkInUrl,
        qrImageBase64: qrBuffer.toString("base64"),
        attachmentFileName: `${normalized.name}-qr.png`
      });

      result.stored += 1;
      result.emailed += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "QR 코드 생성 또는 이메일 발송 중 오류가 발생했습니다.";
      result.failures.push({
        row: index + 2,
        identifier: `${normalized?.name ?? ""} (${normalized?.email ?? ""})`,
        reason: message
      });
    }
  }

  return NextResponse.json(result);
}
