"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 8) {
      setIsError(true);
      setMessage("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setIsError(true);
        setMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace("/app/dashboard");
        router.refresh();
      } else {
        setMessage(
          "회원가입 요청이 완료되었습니다. 이메일 인증 링크를 확인해 주세요.",
        );
      }
    } catch {
      setIsError(true);
      setMessage(
        "회원가입 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            ApplyFlow
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            취업 준비의 모든 과정을 한곳에서
          </p>
        </div>

        <h2 className="mb-6 text-xl font-semibold text-slate-900">회원가입</h2>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium"
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {message && (
            <p
              role={isError ? "alert" : "status"}
              className={`rounded-lg p-3 text-sm ${
                isError
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "가입 처리 중..." : "회원가입"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
