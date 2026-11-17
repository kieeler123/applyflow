"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (data.session) {
        router.push("/app/dashboard");
        router.refresh();
      } else {
        setMessage(
          "회원가입 요청이 완료되었습니다. 이메일 인증이 필요한 경우 메일함을 확인해 주세요.",
        );
      }
    } catch {
      setError("회원가입 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 420,
        margin: "80px auto",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>ApplyFlow 회원가입</h1>

      <p style={{ marginTop: 8, color: "#666" }}>
        취업 준비를 체계적으로 시작하세요.
      </p>

      <form onSubmit={handleSignup}>
        <div style={{ marginTop: 24 }}>
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              marginTop: 8,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              background: "#fff",
              color: "#111",
            }}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              marginTop: 8,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              background: "#fff",
              color: "#111",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 28,
            padding: 14,
            background: "#2563eb",
            color: "#fff",
            borderRadius: 8,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "가입 처리 중..." : "회원가입"}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "crimson", marginTop: 16 }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ marginTop: 16 }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        이미 계정이 있나요? <Link href="/login">로그인</Link>
      </p>
    </main>
  );
}
