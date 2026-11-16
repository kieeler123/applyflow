"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage("이메일 또는 비밀번호를 확인해 주세요.");
      return;
    }

    router.replace("/app/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto mt-20 max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">ApplyFlow 로그인</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className="w-full rounded border p-3"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded border p-3"
        />
        <button
          disabled={loading}
          className="w-full rounded bg-blue-600 p-3 text-white"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {errorMessage && (
        <p role="alert" className="mt-4 text-red-600">
          {errorMessage}
        </p>
      )}

      <Link href="/signup" className="mt-4 block underline">
        계정이 없나요? 회원가입
      </Link>
    </main>
  );
}
