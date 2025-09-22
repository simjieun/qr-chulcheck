export const env = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
  qrBucket: process.env.SUPABASE_QR_BUCKET ?? "qr-codes",
  appUrl: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM ?? "체육대회 <onboarding@resend.dev>",
  testEmail: process.env.TEST_EMAIL ?? "simjiuen@gmail.com"
};

export function assertServerEnv(key: keyof typeof env): string {
  const value = env[key];
  if (!value) {
    throw new Error(`${key} 환경 변수가 설정되어 있지 않습니다.`);
  }
  return value;
}
