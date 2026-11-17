"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });

      if (error) {
        setMessage(`요청 실패: ${error.message}`);
      } else {
        setMessage("재설정 요청을 처리했습니다. 이메일을 확인해 주세요.");
      }
    } catch {
      setMessage("요청 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>비밀번호 재설정</h1>

      <p style={{ marginTop: 12, color: "#666" }}>
        가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            padding: 12,
            marginTop: 8,
            border: "1px solid #d1d5db",
            borderRadius: 8,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 24,
            padding: 14,
            background: "#2563eb",
            color: "#fff",
            borderRadius: 8,
          }}
        >
          {loading ? "전송 중..." : "재설정 메일 보내기"}
        </button>
      </form>

      {message && (
        <p role="status" style={{ marginTop: 16 }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        <Link href="/login">로그인으로 돌아가기</Link>
      </p>
    </main>
  );
}
