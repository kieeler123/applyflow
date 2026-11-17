import { Suspense } from "react";

async function SupabaseConnectionStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let status = "연결 확인 전";

  if (!url || !key) {
    status = "환경 변수가 누락되었습니다.";
  } else {
    try {
      const response = await fetch(
        `${url.replace(/\/$/, "")}/auth/v1/settings`,
        {
          headers: {
            apikey: key,
          },
          cache: "no-store",
        },
      );

      status = response.ok
        ? "Supabase Auth 서버 연결 성공!"
        : `서버 응답 오류: HTTP ${response.status}`;
    } catch (error) {
      status =
        error instanceof Error
          ? `연결 실패: ${error.message}`
          : "알 수 없는 연결 오류";
    }
  }

  return (
    <section className="space-y-3">
      <p>Supabase URL: {url ? "설정됨" : "누락"}</p>
      <p>Publishable Key: {key ? "설정됨" : "누락"}</p>
      <p>상태: {status}</p>
    </section>
  );
}

export default function TestConnectionPage() {
  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-2xl font-bold">ApplyFlow Supabase 연결 테스트</h1>

      <Suspense fallback={<p>Supabase 서버 연결 확인 중...</p>}>
        <SupabaseConnectionStatus />
      </Suspense>
    </main>
  );
}
