"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("로그아웃에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="rounded border px-4 py-2">
      로그아웃
    </button>
  );
}
