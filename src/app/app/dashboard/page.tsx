import { createClient } from "@/src/lib/supabase/server";
import { LogoutButton } from "@/src/components/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ApplyFlow 대시보드</h1>
        <LogoutButton />
      </header>

      <p className="text-gray-600">{data.user?.email}님, 환영합니다.</p>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">취업 준비 현황</h2>
        <p className="mt-2 text-gray-500">
          다음 주부터 경험 보관함과 지원서 관리 기능이 추가됩니다.
        </p>
      </section>
    </main>
  );
}
