"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setReady(true);
      }
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      await supabase.auth.signOut();
      setCompleted(true);
      setMessage("비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요.");
    } catch {
      setMessage("비밀번호 변경 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>새 비밀번호 설정</h1>

      {!ready && !completed && (
        <p style={{ marginTop: 16 }}>
          재설정 링크를 확인하고 있습니다. 이메일에서 받은 링크로 접속해 주세요.
        </p>
      )}

      {ready && !completed && (
        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          <label htmlFor="password">새 비밀번호</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
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
            }}
          />

          <label
            htmlFor="confirmPassword"
            style={{ display: "block", marginTop: 20 }}
          >
            새 비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      )}

      {message && (
        <p role="status" style={{ marginTop: 16 }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        <Link href="/login">로그인 페이지로 이동</Link>
      </p>
    </main>
  );
}
