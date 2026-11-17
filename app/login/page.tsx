"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      router.push("/app/dashboard");
      router.refresh();
    } catch {
      setError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1>ApplyFlow 로그인</h1>

      <form onSubmit={handleLogin}>
        <div style={{ marginTop: 20 }}>
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", padding: 12 }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: 12 }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 24, padding: 12, width: "100%" }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      <p style={{ marginTop: 20 }}>
        계정이 없나요? <Link href="/signup">회원가입</Link>
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/forgot-password">비밀번호를 잊으셨나요?</Link>
      </p>
    </main>
  );
}
