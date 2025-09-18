"use client";

import { ChangeEvent, FormEvent, useMemo, useState, useTransition } from "react";
import * as Progress from "@radix-ui/react-progress";
import { clsx } from "clsx";

type UploadState = "idle" | "uploading" | "success" | "error";

interface UploadSummary {
  total: number;
  stored: number;
  emailed: number;
  failures: Array<{ row: number; reason: string; identifier?: string }>;
}

const initialSummary: UploadSummary = {
  total: 0,
  stored: 0,
  emailed: 0,
  failures: []
};

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadState>("idle");
  const [summary, setSummary] = useState<UploadSummary>(initialSummary);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isUploading = status === "uploading" || isPending;

  const progressValue = useMemo(() => {
    if (status === "idle") return 0;
    if (status === "uploading") return 60;
    if (status === "success") return 100;
    if (status === "error") return 100;
    return 0;
  }, [status]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setFile(null);
      return;
    }
    setFile(files[0]);
    setSummary(initialSummary);
    setStatus("idle");
    setErrorMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setErrorMessage("업로드할 엑셀 파일을 선택해주세요.");
      setStatus("error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setStatus("uploading");
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/upload-excel", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: "업로드에 실패했습니다." }));
          throw new Error(errorBody.message ?? "업로드에 실패했습니다.");
        }

        const result = (await response.json()) as UploadSummary;
        setSummary(result);
        setStatus("success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        setErrorMessage(message);
        setStatus("error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">직원 명단 업로드</h2>
        <p className="text-sm text-slate-600">
          직원명, 팀명, 이메일, 사번 컬럼을 가진 엑셀(.xlsx) 파일을 업로드하면 QR 코드가 생성되고 이메일로 발송됩니다.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="excel"
            className="block text-sm font-medium text-slate-700"
          >
            엑셀 파일 선택
          </label>
          <input
            id="excel"
            name="excel"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isUploading}
            className={clsx(
              "mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60",
              {
                "border-red-500": status === "error" && !!errorMessage
              }
            )}
          />
          <p className="mt-1 text-xs text-slate-500">지원되는 확장자: .xlsx, .xls</p>
        </div>

        {isUploading && (
          <Progress.Root className="relative h-2 overflow-hidden rounded-full bg-slate-200">
            <Progress.Indicator
              className="h-full w-full bg-blue-500 transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${100 - progressValue}%)` }}
            />
          </Progress.Root>
        )}

        {status === "success" && (
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-medium">업로드가 완료되었습니다.</p>
            <ul className="mt-2 space-y-1">
              <li>총 {summary.total}명 중 {summary.stored}명의 정보가 저장되었습니다.</li>
              <li>{summary.emailed}명의 직원에게 QR 코드 이메일을 발송했습니다.</li>
            </ul>
            {summary.failures.length > 0 && (
              <div className="mt-3 space-y-1 text-blue-800">
                <p className="font-semibold">처리하지 못한 항목</p>
                <ul className="space-y-1">
                  {summary.failures.map((failure) => (
                    <li key={`${failure.row}-${failure.identifier ?? "unknown"}`} className="flex flex-col rounded-md bg-white/60 p-2">
                      <span className="font-medium">{failure.identifier ?? `${failure.row}행`}</span>
                      <span className="text-xs text-slate-600">{failure.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {status === "error" && errorMessage && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">업로드 도중 문제가 발생했습니다.</p>
            <p className="mt-1">{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isUploading || !file}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "업로드 중..." : "업로드 시작"}
        </button>
      </div>
    </form>
  );
}
