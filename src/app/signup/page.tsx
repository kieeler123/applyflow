"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session) {
      router.replace("/app/dashboard");
      router.refresh();
    } else {
      setMessage("인증 이메일을 확인해 주세요.");
    }
  }

  return (
    <main className="mx-auto mt-20 max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">ApplyFlow 회원가입</h1>

      <form onSubmit={handleSignup} className="space-y-4">
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
          placeholder="비밀번호 (8자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          autoComplete="new-password"
          required
          className="w-full rounded border p-3"
        />
        <button
          disabled={loading}
          className="w-full rounded bg-blue-600 p-3 text-white"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <p role="status" className="mt-4 text-sm">
        {message}
      </p>

      <Link href="/login" className="mt-4 block underline">
        이미 계정이 있나요? 로그인
      </Link>
    </main>
  );
}
