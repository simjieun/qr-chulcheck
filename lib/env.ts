const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const env = {
  // Supabase 설정
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
  qrBucket: process.env.SUPABASE_QR_BUCKET ?? "qr-codes",
  
  // 앱 URL - 환경별 자동 감지
  appUrl: isProduction 
    ? (process.env.VERCEL_PROJECT_PRODUCTION_URL 
       ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
       : process.env.APP_URL)
    : (process.env.APP_URL ?? "http://localhost:3000"),
  
  // SMTP 이메일 설정
  smtpServer: process.env.SMTP_SERVER ?? "smtp.gmail.com",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "587"),
  smtpUsername: process.env.SMTP_USERNAME,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpFromEmail: process.env.SMTP_FROM_EMAIL,

  // 테스트 이메일 (개발 환경에서만 사용)
  testEmail: isDevelopment ? process.env.TEST_EMAIL : undefined,
  
  // 환경 정보
  nodeEnv: process.env.NODE_ENV,
  isProduction,
  isDevelopment,
  isVercel: !!process.env.VERCEL
};

export function assertServerEnv(key: keyof typeof env): string {
  const value = env[key];
  if (!value) {
    console.error(`❌ 환경변수 누락: ${key}`);
    throw new Error(`${key} 환경 변수가 설정되어 있지 않습니다.`);
  }
  
  // 보안 검증
  if (key.includes('KEY') || key.includes('SECRET')) {
    if (typeof value === 'string' && value.length < 20) {
      console.warn(`⚠️ 환경변수 ${key}의 값이 너무 짧습니다. 보안에 취약할 수 있습니다.`);
    }
  }
  
  return String(value);
}

// 환경변수 상태 체크 함수
export function validateEnvConfig(): void {
  const requiredVars = [
    'supabaseUrl',
    'supabaseServiceRoleKey', 
    'supabaseAnonKey'
  ] as const;
  
  console.log('🔍 환경변수 검증 중...');
  
  for (const varName of requiredVars) {
    try {
      assertServerEnv(varName);
      console.log(`✅ ${varName}: 설정됨`);
    } catch (error) {
      console.error(`❌ ${varName}: 누락`);
      throw error;
    }
  }
  
  console.log('✅ 모든 필수 환경변수가 설정되었습니다.');
}
